using System.Data;
using System.Text.Json;
using BCrypt.Net;
using MySqlConnector;

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
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
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

        var isValid = BCrypt.Net.BCrypt.Verify(request.Password, passwordHash);
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

app.Run();

public record RegisterRequest(string Username, string Email, string Password, string FirstName, string LastName);

public record LoginRequest(string UsernameOrEmail, string Password);

public record AuthResponse(int UserId, string Username, string Email, string FirstName, string LastName);
