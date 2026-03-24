using System.Data;
using System.Globalization;
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
    string? IndustryOfWork
);
