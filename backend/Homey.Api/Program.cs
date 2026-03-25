using System.Data;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using BCrypt.Net;
using MySqlConnector;

LoadRootEnvFile();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    connectionString = BuildConnectionStringFromDbEnvironment();
}
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection is not configured. Set ConnectionStrings:DefaultConnection or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME."
    );
}

builder.Services.AddScoped<IDbConnection>(_ => new MySqlConnection(connectionString));

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedOrigins.Length > 0 ? allowedOrigins : ["http://localhost:5173"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseSession();

const string UserSessionKey = "User";

app.MapPost("/api/auth/register", (RegisterRequest request, IDbConnection db, HttpContext httpContext) =>
{
    if (string.IsNullOrWhiteSpace(request.Username) ||
        string.IsNullOrWhiteSpace(request.Email) ||
        string.IsNullOrWhiteSpace(request.Password) ||
        string.IsNullOrWhiteSpace(request.FirstName) ||
        string.IsNullOrWhiteSpace(request.LastName))
    {
        return Results.BadRequest("All fields are required.");
    }

    const string checkSql = """
        SELECT COUNT(*) FROM users
        WHERE username = @username OR email = @email;
        """;

    using (db)
    {
        db.Open();

        using (var checkCmd = db.CreateCommand())
        {
            checkCmd.CommandText = checkSql;
            checkCmd.Parameters.Add(new MySqlParameter("@username", request.Username));
            checkCmd.Parameters.Add(new MySqlParameter("@email", request.Email));

            var existingObj = checkCmd.ExecuteScalar();
            var existing = existingObj is null ? 0L : Convert.ToInt64(existingObj);
            if (existing > 0)
            {
                return Results.Conflict("Username or email already exists.");
            }
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        const string insertSql = """
            INSERT INTO users (username, email, password_hash, first_name, last_name)
            VALUES (@username, @email, @password_hash, @first_name, @last_name);
            SELECT LAST_INSERT_ID();
            """;

        using (var insertCmd = db.CreateCommand())
        {
            insertCmd.CommandText = insertSql;
            insertCmd.Parameters.Add(new MySqlParameter("@username", request.Username));
            insertCmd.Parameters.Add(new MySqlParameter("@email", request.Email));
            insertCmd.Parameters.Add(new MySqlParameter("@password_hash", passwordHash));
            insertCmd.Parameters.Add(new MySqlParameter("@first_name", request.FirstName));
            insertCmd.Parameters.Add(new MySqlParameter("@last_name", request.LastName));

            var result = insertCmd.ExecuteScalar();
            var userId = Convert.ToInt32(result);

            var response = new AuthResponse(
                userId,
                request.Username,
                request.Email,
                request.FirstName,
                request.LastName
            );

            httpContext.Session.SetString(UserSessionKey, JsonSerializer.Serialize(response));
            return Results.Ok(response);
        }
    }
});

app.MapPost("/api/auth/login", (LoginRequest request, IDbConnection db, HttpContext httpContext) =>
{
    if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest("Username/email and password are required.");
    }

    const string sql = """
        SELECT user_id, username, email, password_hash, first_name, last_name
        FROM users
        WHERE username = @id OR email = @id
        LIMIT 1;
        """;

    const string updateLastLoginSql = """
        UPDATE users
        SET last_logged_in_at = UTC_TIMESTAMP()
        WHERE user_id = @user_id
        LIMIT 1;
        """;

    using (db)
    {
        db.Open();

        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@id", request.UsernameOrEmail));

        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
        {
            return Results.Unauthorized();
        }

        var userId = reader.GetInt32(reader.GetOrdinal("user_id"));
        var username = reader.GetString(reader.GetOrdinal("username"));
        var email = reader.GetString(reader.GetOrdinal("email"));
        var passwordHash = reader.GetString(reader.GetOrdinal("password_hash"));
        var firstName = reader.GetString(reader.GetOrdinal("first_name"));
        var lastName = reader.GetString(reader.GetOrdinal("last_name"));

        var isValid = false;
        try
        {
            isValid = BCrypt.Net.BCrypt.Verify(request.Password, passwordHash);
        }
        catch
        {
            // Handle invalid/non-BCrypt legacy values without crashing the endpoint.
            return Results.Unauthorized();
        }
        if (!isValid)
        {
            return Results.Unauthorized();
        }

        reader.Close();

        using (var updateCmd = db.CreateCommand())
        {
            updateCmd.CommandText = updateLastLoginSql;
            updateCmd.Parameters.Add(new MySqlParameter("@user_id", userId));
            updateCmd.ExecuteNonQuery();
        }

        var response = new AuthResponse(userId, username, email, firstName, lastName);
        httpContext.Session.SetString(UserSessionKey, JsonSerializer.Serialize(response));
        return Results.Ok(response);
    }
});

app.MapGet("/api/auth/me", (HttpContext httpContext) =>
{
    var value = httpContext.Session.GetString(UserSessionKey);
    if (string.IsNullOrWhiteSpace(value))
    {
        return Results.NoContent();
    }

    var user = JsonSerializer.Deserialize<AuthResponse>(value);
    return user is null ? Results.NoContent() : Results.Ok(user);
});

app.MapPost("/api/auth/logout", (HttpContext httpContext) =>
{
    httpContext.Session.Clear();
    return Results.Ok();
});

app.MapGet("/api/profile/me", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
    {
        return Results.Unauthorized();
    }

    const string sql = """
        SELECT
            user_id,
            username,
            email,
            first_name,
            last_name,
            desired_home_price,
            credit_score,
            monthly_income,
            monthly_expenses,
            total_savings,
            target_zip_code,
            industry_of_work,
            role
        FROM users
        WHERE user_id = @user_id
        LIMIT 1;
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));

        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
        {
            return Results.NotFound();
        }

        var response = new UserProfileResponse(
            reader.GetInt32(reader.GetOrdinal("user_id")),
            reader.GetString(reader.GetOrdinal("username")),
            reader.GetString(reader.GetOrdinal("email")),
            reader.GetString(reader.GetOrdinal("first_name")),
            reader.GetString(reader.GetOrdinal("last_name")),
            reader.IsDBNull(reader.GetOrdinal("desired_home_price")) ? null : reader.GetDecimal(reader.GetOrdinal("desired_home_price")),
            reader.IsDBNull(reader.GetOrdinal("credit_score")) ? null : Convert.ToUInt16(reader.GetValue(reader.GetOrdinal("credit_score"))),
            reader.IsDBNull(reader.GetOrdinal("monthly_income")) ? null : reader.GetDecimal(reader.GetOrdinal("monthly_income")),
            reader.IsDBNull(reader.GetOrdinal("monthly_expenses")) ? null : reader.GetDecimal(reader.GetOrdinal("monthly_expenses")),
            reader.IsDBNull(reader.GetOrdinal("total_savings")) ? null : reader.GetDecimal(reader.GetOrdinal("total_savings")),
            reader.IsDBNull(reader.GetOrdinal("target_zip_code")) ? null : reader.GetString(reader.GetOrdinal("target_zip_code")),
            reader.IsDBNull(reader.GetOrdinal("industry_of_work")) ? null : reader.GetString(reader.GetOrdinal("industry_of_work")),
            reader.GetString(reader.GetOrdinal("role"))
        );

        return Results.Ok(response);
    }
});

app.MapPut("/api/profile/me", (UpdateProfileRequest request, IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
    {
        return Results.Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Username) ||
        string.IsNullOrWhiteSpace(request.Email) ||
        string.IsNullOrWhiteSpace(request.FirstName) ||
        string.IsNullOrWhiteSpace(request.LastName))
    {
        return Results.BadRequest("Username, email, first name, and last name are required.");
    }

    const string sql = """
        UPDATE users
        SET
            username = @username,
            email = @email,
            first_name = @first_name,
            last_name = @last_name,
            desired_home_price = @desired_home_price,
            credit_score = @credit_score,
            monthly_income = @monthly_income,
            monthly_expenses = @monthly_expenses,
            total_savings = @total_savings,
            target_zip_code = @target_zip_code,
            industry_of_work = @industry_of_work
        WHERE user_id = @user_id;
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        cmd.Parameters.Add(new MySqlParameter("@username", request.Username.Trim()));
        cmd.Parameters.Add(new MySqlParameter("@email", request.Email.Trim()));
        cmd.Parameters.Add(new MySqlParameter("@first_name", request.FirstName.Trim()));
        cmd.Parameters.Add(new MySqlParameter("@last_name", request.LastName.Trim()));
        cmd.Parameters.Add(new MySqlParameter("@desired_home_price", request.DesiredHomePrice ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@credit_score", request.CreditScore ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@monthly_income", request.MonthlyIncome ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@monthly_expenses", request.MonthlyExpenses ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@total_savings", request.TotalSavings ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@target_zip_code", string.IsNullOrWhiteSpace(request.TargetZipCode)
            ? DBNull.Value
            : request.TargetZipCode.Trim()));
        cmd.Parameters.Add(new MySqlParameter("@industry_of_work", string.IsNullOrWhiteSpace(request.IndustryOfWork)
            ? DBNull.Value
            : request.IndustryOfWork.Trim()));

        try
        {
            var rows = cmd.ExecuteNonQuery();
            if (rows == 0)
            {
                return Results.NotFound();
            }
        }
        catch (MySqlException ex) when (ex.Number == 1062)
        {
            return Results.Conflict("Username or email already exists.");
        }
    }

    var refreshedSession = new AuthResponse(
        sessionUser.UserId,
        request.Username.Trim(),
        request.Email.Trim(),
        request.FirstName.Trim(),
        request.LastName.Trim()
    );
    httpContext.Session.SetString(UserSessionKey, JsonSerializer.Serialize(refreshedSession));

    return Results.Ok();
});

app.MapGet("/api/homes/search", async (string zip, IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
    {
        return Results.Unauthorized();
    }

    var normalizedZip = NormalizeZip(zip);
    if (normalizedZip is null)
    {
        return Results.BadRequest("A valid ZIP code is required.");
    }

    const string profileSql = """
        SELECT monthly_income, monthly_expenses, desired_home_price
        FROM users
        WHERE user_id = @user_id
        LIMIT 1;
        """;

    decimal monthlyIncome = 0;
    decimal monthlyExpenses = 0;
    decimal desiredHomePrice = 0;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = profileSql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));

        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            monthlyIncome = reader.IsDBNull(reader.GetOrdinal("monthly_income"))
                ? 0
                : reader.GetDecimal(reader.GetOrdinal("monthly_income"));
            monthlyExpenses = reader.IsDBNull(reader.GetOrdinal("monthly_expenses"))
                ? 0
                : reader.GetDecimal(reader.GetOrdinal("monthly_expenses"));
            desiredHomePrice = reader.IsDBNull(reader.GetOrdinal("desired_home_price"))
                ? 0
                : reader.GetDecimal(reader.GetOrdinal("desired_home_price"));
        }
    }

    var nearbyZips = BuildNearbyZipCodes(normalizedZip);
    var listings = await FetchListingsForZipsAsync(nearbyZips);
    if (listings.Count == 0)
    {
        return Results.NotFound("No homes found for this ZIP area.");
    }
    var grouped = GroupListingsByAffordability(listings, monthlyIncome, monthlyExpenses, desiredHomePrice);

    return Results.Ok(new HomesSearchResponse(
        normalizedZip,
        nearbyZips,
        grouped.WithinRange,
        grouped.SlightlyAboveRange,
        grouped.BelowComfortRange
    ));
});

app.Run();

static string? BuildConnectionStringFromDbEnvironment()
{
    var host = Environment.GetEnvironmentVariable("DB_HOST");
    var user = Environment.GetEnvironmentVariable("DB_USER");
    var dbName = Environment.GetEnvironmentVariable("DB_NAME");

    if (string.IsNullOrWhiteSpace(host) ||
        string.IsNullOrWhiteSpace(user) ||
        string.IsNullOrWhiteSpace(dbName))
    {
        return null;
    }

    var port = Environment.GetEnvironmentVariable("DB_PORT");
    var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? string.Empty;

    var builder = new MySqlConnectionStringBuilder
    {
        Server = host,
        UserID = user,
        Password = password,
        Database = dbName,
        Port = uint.TryParse(port, CultureInfo.InvariantCulture, out var parsedPort) ? parsedPort : 3306,
    };

    return builder.ConnectionString;
}

static void LoadRootEnvFile()
{
    var current = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (current is not null)
    {
        var envPath = Path.Combine(current.FullName, ".env");
        if (File.Exists(envPath))
        {
            foreach (var rawLine in File.ReadLines(envPath))
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
                {
                    continue;
                }

                var separatorIndex = line.IndexOf('=');
                if (separatorIndex <= 0)
                {
                    continue;
                }

                var key = line[..separatorIndex].Trim();
                if (string.IsNullOrWhiteSpace(key) || Environment.GetEnvironmentVariable(key) is not null)
                {
                    continue;
                }

                var value = line[(separatorIndex + 1)..].Trim().Trim('"');
                Environment.SetEnvironmentVariable(key, value);
            }

            return;
        }

        current = current.Parent;
    }
}

static bool TryGetSessionUser(HttpContext httpContext, out AuthResponse? user)
{
    user = null;
    var value = httpContext.Session.GetString("User");
    if (string.IsNullOrWhiteSpace(value))
    {
        return false;
    }

    user = JsonSerializer.Deserialize<AuthResponse>(value);
    return user is not null;
}

static string? NormalizeZip(string? zip)
{
    if (string.IsNullOrWhiteSpace(zip))
    {
        return null;
    }

    var digits = new string(zip.Where(char.IsDigit).ToArray());
    return digits.Length == 5 ? digits : null;
}

static List<string> BuildNearbyZipCodes(string centerZip)
{
    var result = new List<string> { centerZip };
    if (!int.TryParse(centerZip, NumberStyles.None, CultureInfo.InvariantCulture, out var numericZip))
    {
        return result;
    }

    foreach (var offset in new[] { -2, -1, 1, 2 })
    {
        var nearby = numericZip + offset;
        if (nearby >= 10000 && nearby <= 99999)
        {
            result.Add(nearby.ToString("D5", CultureInfo.InvariantCulture));
        }
    }

    return result.Distinct().ToList();
}

static async Task<List<HomeListing>> FetchListingsForZipsAsync(List<string> zipCodes)
{
    var rapidApiKey = Environment.GetEnvironmentVariable("RAPIDAPI_KEY");
    var rapidApiHost = Environment.GetEnvironmentVariable("RAPIDAPI_HOST") ?? "zillow-com1.p.rapidapi.com";
    var endpoint = Environment.GetEnvironmentVariable("RAPIDAPI_ZILLOW_SEARCH_PATH") ?? "/propertyExtendedSearch";

    if (string.IsNullOrWhiteSpace(rapidApiKey))
    {
        return BuildFallbackListings(zipCodes);
    }

    var listings = new List<HomeListing>();
    using var client = new HttpClient
    {
        Timeout = TimeSpan.FromSeconds(15),
        BaseAddress = new Uri($"https://{rapidApiHost}"),
    };
    client.DefaultRequestHeaders.Add("X-RapidAPI-Key", rapidApiKey);
    client.DefaultRequestHeaders.Add("X-RapidAPI-Host", rapidApiHost);
    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

    foreach (var zip in zipCodes)
    {
        try
        {
            var response = await client.GetAsync($"{endpoint}?location={zip}&statusType=ForSale&home_type=Houses&page=1");
            if (!response.IsSuccessStatusCode)
            {
                continue;
            }

            await using var stream = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(stream);
            listings.AddRange(ParseListingsFromRapidApi(doc, zip));
        }
        catch
        {
            // Continue to other ZIPs.
        }
    }

    var deduped = listings
        .GroupBy(l => l.ListingId)
        .Select(g => g.First())
        .ToList();
    return deduped.Count > 0 ? deduped : BuildFallbackListings(zipCodes);
}

static List<HomeListing> ParseListingsFromRapidApi(JsonDocument doc, string zip)
{
    var results = new List<HomeListing>();
    if (!doc.RootElement.TryGetProperty("props", out var props) || props.ValueKind != JsonValueKind.Array)
    {
        return results;
    }

    foreach (var item in props.EnumerateArray())
    {
        var listingId = item.TryGetProperty("zpid", out var zpidElement)
            ? zpidElement.ToString()
            : Guid.NewGuid().ToString("N");
        var homeStatus = item.TryGetProperty("homeStatus", out var homeStatusElement)
            ? homeStatusElement.ToString()
            : string.Empty;
        if (!string.IsNullOrWhiteSpace(homeStatus) &&
            !homeStatus.Contains("FOR_SALE", StringComparison.OrdinalIgnoreCase))
        {
            continue;
        }

        if (!item.TryGetProperty("price", out var priceElement) ||
            !decimal.TryParse(priceElement.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var price))
        {
            continue;
        }

        var latitude = item.TryGetProperty("latitude", out var latElement)
            && double.TryParse(latElement.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var lat)
            ? lat
            : 0d;
        var longitude = item.TryGetProperty("longitude", out var lngElement)
            && double.TryParse(lngElement.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var lng)
            ? lng
            : 0d;
        var address = item.TryGetProperty("address", out var addressElement)
            ? addressElement.ToString()
            : $"Listing in {zip}";
        var beds = item.TryGetProperty("bedrooms", out var bedsElement) &&
            int.TryParse(bedsElement.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var bedsValue)
            ? bedsValue
            : 0;
        var baths = item.TryGetProperty("bathrooms", out var bathsElement) &&
            decimal.TryParse(bathsElement.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var bathsValue)
            ? bathsValue
            : 0m;
        var sqft = item.TryGetProperty("livingArea", out var sqftElement) &&
            int.TryParse(sqftElement.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var sqftValue)
            ? sqftValue
            : 0;
        var detailUrl = item.TryGetProperty("detailUrl", out var detailUrlElement)
            ? $"https://www.zillow.com{detailUrlElement}"
            : null;
        var imageUrl = item.TryGetProperty("imgSrc", out var imageElement)
            ? imageElement.ToString()
            : null;

        results.Add(new HomeListing(listingId, address, zip, price, beds, baths, sqft, latitude, longitude, detailUrl, imageUrl));
    }

    return results;
}

static List<HomeListing> BuildFallbackListings(List<string> zipCodes)
{
    var random = new Random(84042);
    var anchorData = new Dictionary<string, (double Lat, double Lng, decimal BaselinePrice)>
    {
        ["84042"] = (40.1652, -111.6247, 515000m),
        ["84043"] = (40.3916, -111.8508, 520000m),
        ["84003"] = (40.3769, -111.7958, 545000m),
        ["84604"] = (40.2549, -111.6585, 500000m),
        ["84601"] = (40.2338, -111.6585, 470000m),
        ["84058"] = (40.2969, -111.6946, 465000m),
        ["84057"] = (40.3005, -111.6999, 490000m),
    };

    var listings = new List<HomeListing>();
    foreach (var zip in zipCodes)
    {
        var anchor = anchorData.TryGetValue(zip, out var value)
            ? value
            : (40.1652 + random.NextDouble() * 0.25, -111.6247 + random.NextDouble() * 0.25, 500000m);

        for (var i = 0; i < 8; i++)
        {
            var ratio = 0.72m + (decimal)random.NextDouble() * 0.72m;
            var price = Math.Round(anchor.Item3 * ratio, 0);
            var beds = random.Next(2, 6);
            var baths = (decimal)(random.Next(2, 5) - 0.5);
            var sqft = random.Next(1200, 3600);
            var lat = anchor.Item1 + (random.NextDouble() - 0.5) * 0.05;
            var lng = anchor.Item2 + (random.NextDouble() - 0.5) * 0.05;
            var streetNumber = 100 + i * 11;
            var streetName = new[] { "Maple", "Canyon", "River", "Aspen", "Sunset", "Juniper", "Oak", "Willow" }[i % 8];

            listings.Add(new HomeListing(
                $"sample-{zip}-{i}",
                $"{streetNumber} {streetName} Dr",
                zip,
                price,
                beds,
                baths,
                sqft,
                lat,
                lng,
                null,
                null
            ));
        }
    }

    return listings;
}

static HomesGroupedResult GroupListingsByAffordability(
    List<HomeListing> listings,
    decimal monthlyIncome,
    decimal monthlyExpenses,
    decimal desiredHomePrice)
{
    var disposable = Math.Max(monthlyIncome - monthlyExpenses, 0);
    var dtiCap = monthlyIncome * 0.36m;
    var monthlyHousingBudget = Math.Max(Math.Min(dtiCap, disposable * 0.9m), 1200m);
    var maxComfortPrice = monthlyHousingBudget / 0.007m;
    if (desiredHomePrice > 0)
    {
        maxComfortPrice = (maxComfortPrice + desiredHomePrice) / 2m;
    }

    var belowCutoff = maxComfortPrice * 0.85m;
    var aboveCutoff = maxComfortPrice * 1.15m;

    var below = listings
        .Where(l => l.Price < belowCutoff)
        .OrderByDescending(l => l.Price)
        .Take(12)
        .ToList();
    var within = listings
        .Where(l => l.Price >= belowCutoff && l.Price <= maxComfortPrice)
        .OrderByDescending(l => l.Price)
        .Take(12)
        .ToList();
    var above = listings
        .Where(l => l.Price > maxComfortPrice && l.Price <= aboveCutoff)
        .OrderBy(l => l.Price)
        .Take(12)
        .ToList();

    if (within.Count == 0)
    {
        within = listings.OrderBy(l => Math.Abs(l.Price - maxComfortPrice)).Take(12).ToList();
    }

    return new HomesGroupedResult(within, above, below);
}

public record RegisterRequest(string Username, string Email, string Password, string FirstName, string LastName);

public record LoginRequest(string UsernameOrEmail, string Password);

public record AuthResponse(int UserId, string Username, string Email, string FirstName, string LastName);

public record UserProfileResponse(
    int UserId,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    decimal? DesiredHomePrice,
    ushort? CreditScore,
    decimal? MonthlyIncome,
    decimal? MonthlyExpenses,
    decimal? TotalSavings,
    string? TargetZipCode,
    string? IndustryOfWork,
    string Role
);

public record UpdateProfileRequest(
    string Username,
    string Email,
    string FirstName,
    string LastName,
    decimal? DesiredHomePrice,
    ushort? CreditScore,
    decimal? MonthlyIncome,
    decimal? MonthlyExpenses,
    decimal? TotalSavings,
    string? TargetZipCode,
    string? IndustryOfWork
);

public record HomeListing(
    string ListingId,
    string Address,
    string ZipCode,
    decimal Price,
    int Beds,
    decimal Baths,
    int Sqft,
    double Latitude,
    double Longitude,
    string? DetailUrl,
    string? ImageUrl
);

public record HomesSearchResponse(
    string SelectedZip,
    List<string> NearbyZips,
    List<HomeListing> WithinRange,
    List<HomeListing> SlightlyAboveRange,
    List<HomeListing> BelowComfortRange
);

public record HomesGroupedResult(
    List<HomeListing> WithinRange,
    List<HomeListing> SlightlyAboveRange,
    List<HomeListing> BelowComfortRange
);
