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
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = app.Environment.IsDevelopment() ? CookieSecurePolicy.None : CookieSecurePolicy.Always;
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

// ── Pre-Approval: Loan Application ──────────────────────────────────────────

app.MapGet("/api/preapproval/loan-application", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        SELECT
            loan_phone, loan_dependents,
            loan_marital_status, loan_current_address, loan_current_address_years,
            loan_previous_address, loan_rent_or_own, loan_monthly_housing_payment, loan_landlord_contact,
            loan_employer_name, loan_employer_address, loan_job_title,
            loan_employment_type, loan_start_date, loan_previous_employer, loan_employment_gaps,
            loan_base_salary, loan_bonuses, loan_self_employ_income, loan_rental_income,
            loan_other_income, loan_other_income_source,
            loan_checking_balance, loan_savings_balance, loan_retirement_balance,
            loan_investment_balance, loan_gift_funds, loan_real_estate_value, loan_other_assets,
            loan_credit_card_payment, loan_student_loan_payment, loan_auto_loan_payment,
            loan_child_support, loan_other_debt,
            loan_decl_outstanding_judgments, loan_decl_bankruptcy, loan_decl_foreclosure,
            loan_decl_lawsuit, loan_decl_cosigner, loan_decl_citizenship, loan_decl_primary_residence,
            loan_saved_at
        FROM preapproval_data
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
        if (!reader.Read()) return Results.Ok((object?)null);

        var result = new LoanApplicationResponse(
            reader.IsDBNull(reader.GetOrdinal("loan_phone")) ? null : reader.GetString(reader.GetOrdinal("loan_phone")),
            reader.IsDBNull(reader.GetOrdinal("loan_dependents")) ? null : reader.GetString(reader.GetOrdinal("loan_dependents")),
            reader.IsDBNull(reader.GetOrdinal("loan_marital_status")) ? null : reader.GetString(reader.GetOrdinal("loan_marital_status")),
            reader.IsDBNull(reader.GetOrdinal("loan_current_address")) ? null : reader.GetString(reader.GetOrdinal("loan_current_address")),
            reader.IsDBNull(reader.GetOrdinal("loan_current_address_years")) ? null : reader.GetString(reader.GetOrdinal("loan_current_address_years")),
            reader.IsDBNull(reader.GetOrdinal("loan_previous_address")) ? null : reader.GetString(reader.GetOrdinal("loan_previous_address")),
            reader.IsDBNull(reader.GetOrdinal("loan_rent_or_own")) ? null : reader.GetString(reader.GetOrdinal("loan_rent_or_own")),
            reader.IsDBNull(reader.GetOrdinal("loan_monthly_housing_payment")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_monthly_housing_payment")),
            reader.IsDBNull(reader.GetOrdinal("loan_landlord_contact")) ? null : reader.GetString(reader.GetOrdinal("loan_landlord_contact")),
            reader.IsDBNull(reader.GetOrdinal("loan_employer_name")) ? null : reader.GetString(reader.GetOrdinal("loan_employer_name")),
            reader.IsDBNull(reader.GetOrdinal("loan_employer_address")) ? null : reader.GetString(reader.GetOrdinal("loan_employer_address")),
            reader.IsDBNull(reader.GetOrdinal("loan_job_title")) ? null : reader.GetString(reader.GetOrdinal("loan_job_title")),
            reader.IsDBNull(reader.GetOrdinal("loan_employment_type")) ? null : reader.GetString(reader.GetOrdinal("loan_employment_type")),
            reader.IsDBNull(reader.GetOrdinal("loan_start_date")) ? null : reader.GetString(reader.GetOrdinal("loan_start_date")),
            reader.IsDBNull(reader.GetOrdinal("loan_previous_employer")) ? null : reader.GetString(reader.GetOrdinal("loan_previous_employer")),
            reader.IsDBNull(reader.GetOrdinal("loan_employment_gaps")) ? null : reader.GetString(reader.GetOrdinal("loan_employment_gaps")),
            reader.IsDBNull(reader.GetOrdinal("loan_base_salary")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_base_salary")),
            reader.IsDBNull(reader.GetOrdinal("loan_bonuses")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_bonuses")),
            reader.IsDBNull(reader.GetOrdinal("loan_self_employ_income")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_self_employ_income")),
            reader.IsDBNull(reader.GetOrdinal("loan_rental_income")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_rental_income")),
            reader.IsDBNull(reader.GetOrdinal("loan_other_income")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_other_income")),
            reader.IsDBNull(reader.GetOrdinal("loan_other_income_source")) ? null : reader.GetString(reader.GetOrdinal("loan_other_income_source")),
            reader.IsDBNull(reader.GetOrdinal("loan_checking_balance")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_checking_balance")),
            reader.IsDBNull(reader.GetOrdinal("loan_savings_balance")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_savings_balance")),
            reader.IsDBNull(reader.GetOrdinal("loan_retirement_balance")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_retirement_balance")),
            reader.IsDBNull(reader.GetOrdinal("loan_investment_balance")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_investment_balance")),
            reader.IsDBNull(reader.GetOrdinal("loan_gift_funds")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_gift_funds")),
            reader.IsDBNull(reader.GetOrdinal("loan_real_estate_value")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_real_estate_value")),
            reader.IsDBNull(reader.GetOrdinal("loan_other_assets")) ? null : reader.GetString(reader.GetOrdinal("loan_other_assets")),
            reader.IsDBNull(reader.GetOrdinal("loan_credit_card_payment")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_credit_card_payment")),
            reader.IsDBNull(reader.GetOrdinal("loan_student_loan_payment")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_student_loan_payment")),
            reader.IsDBNull(reader.GetOrdinal("loan_auto_loan_payment")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_auto_loan_payment")),
            reader.IsDBNull(reader.GetOrdinal("loan_child_support")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_child_support")),
            reader.IsDBNull(reader.GetOrdinal("loan_other_debt")) ? null : reader.GetDecimal(reader.GetOrdinal("loan_other_debt")),
            reader.IsDBNull(reader.GetOrdinal("loan_decl_outstanding_judgments")) ? null : reader.GetString(reader.GetOrdinal("loan_decl_outstanding_judgments")),
            reader.IsDBNull(reader.GetOrdinal("loan_decl_bankruptcy")) ? null : reader.GetString(reader.GetOrdinal("loan_decl_bankruptcy")),
            reader.IsDBNull(reader.GetOrdinal("loan_decl_foreclosure")) ? null : reader.GetString(reader.GetOrdinal("loan_decl_foreclosure")),
            reader.IsDBNull(reader.GetOrdinal("loan_decl_lawsuit")) ? null : reader.GetString(reader.GetOrdinal("loan_decl_lawsuit")),
            reader.IsDBNull(reader.GetOrdinal("loan_decl_cosigner")) ? null : reader.GetString(reader.GetOrdinal("loan_decl_cosigner")),
            reader.IsDBNull(reader.GetOrdinal("loan_decl_citizenship")) ? null : reader.GetString(reader.GetOrdinal("loan_decl_citizenship")),
            reader.IsDBNull(reader.GetOrdinal("loan_decl_primary_residence")) ? null : reader.GetString(reader.GetOrdinal("loan_decl_primary_residence")),
            reader.IsDBNull(reader.GetOrdinal("loan_saved_at")) ? null : reader.GetDateTime(reader.GetOrdinal("loan_saved_at"))
        );
        return Results.Ok(result);
    }
});

app.MapPut("/api/preapproval/loan-application", (SaveLoanApplicationRequest request, IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        INSERT INTO preapproval_data (
            user_id,
            loan_phone, loan_dependents,
            loan_marital_status, loan_current_address, loan_current_address_years,
            loan_previous_address, loan_rent_or_own, loan_monthly_housing_payment, loan_landlord_contact,
            loan_employer_name, loan_employer_address, loan_job_title,
            loan_employment_type, loan_start_date, loan_previous_employer, loan_employment_gaps,
            loan_base_salary, loan_bonuses, loan_self_employ_income, loan_rental_income,
            loan_other_income, loan_other_income_source,
            loan_checking_balance, loan_savings_balance, loan_retirement_balance,
            loan_investment_balance, loan_gift_funds, loan_real_estate_value, loan_other_assets,
            loan_credit_card_payment, loan_student_loan_payment, loan_auto_loan_payment,
            loan_child_support, loan_other_debt,
            loan_decl_outstanding_judgments, loan_decl_bankruptcy, loan_decl_foreclosure,
            loan_decl_lawsuit, loan_decl_cosigner, loan_decl_citizenship, loan_decl_primary_residence,
            loan_saved_at
        ) VALUES (
            @user_id,
            @loan_phone, @loan_dependents,
            @loan_marital_status, @loan_current_address, @loan_current_address_years,
            @loan_previous_address, @loan_rent_or_own, @loan_monthly_housing_payment, @loan_landlord_contact,
            @loan_employer_name, @loan_employer_address, @loan_job_title,
            @loan_employment_type, @loan_start_date, @loan_previous_employer, @loan_employment_gaps,
            @loan_base_salary, @loan_bonuses, @loan_self_employ_income, @loan_rental_income,
            @loan_other_income, @loan_other_income_source,
            @loan_checking_balance, @loan_savings_balance, @loan_retirement_balance,
            @loan_investment_balance, @loan_gift_funds, @loan_real_estate_value, @loan_other_assets,
            @loan_credit_card_payment, @loan_student_loan_payment, @loan_auto_loan_payment,
            @loan_child_support, @loan_other_debt,
            @loan_decl_outstanding_judgments, @loan_decl_bankruptcy, @loan_decl_foreclosure,
            @loan_decl_lawsuit, @loan_decl_cosigner, @loan_decl_citizenship, @loan_decl_primary_residence,
            UTC_TIMESTAMP()
        )
        ON DUPLICATE KEY UPDATE
            loan_phone = @loan_phone,
            loan_dependents = @loan_dependents,
            loan_marital_status = @loan_marital_status,
            loan_current_address = @loan_current_address,
            loan_current_address_years = @loan_current_address_years,
            loan_previous_address = @loan_previous_address,
            loan_rent_or_own = @loan_rent_or_own,
            loan_monthly_housing_payment = @loan_monthly_housing_payment,
            loan_landlord_contact = @loan_landlord_contact,
            loan_employer_name = @loan_employer_name,
            loan_employer_address = @loan_employer_address,
            loan_job_title = @loan_job_title,
            loan_employment_type = @loan_employment_type,
            loan_start_date = @loan_start_date,
            loan_previous_employer = @loan_previous_employer,
            loan_employment_gaps = @loan_employment_gaps,
            loan_base_salary = @loan_base_salary,
            loan_bonuses = @loan_bonuses,
            loan_self_employ_income = @loan_self_employ_income,
            loan_rental_income = @loan_rental_income,
            loan_other_income = @loan_other_income,
            loan_other_income_source = @loan_other_income_source,
            loan_checking_balance = @loan_checking_balance,
            loan_savings_balance = @loan_savings_balance,
            loan_retirement_balance = @loan_retirement_balance,
            loan_investment_balance = @loan_investment_balance,
            loan_gift_funds = @loan_gift_funds,
            loan_real_estate_value = @loan_real_estate_value,
            loan_other_assets = @loan_other_assets,
            loan_credit_card_payment = @loan_credit_card_payment,
            loan_student_loan_payment = @loan_student_loan_payment,
            loan_auto_loan_payment = @loan_auto_loan_payment,
            loan_child_support = @loan_child_support,
            loan_other_debt = @loan_other_debt,
            loan_decl_outstanding_judgments = @loan_decl_outstanding_judgments,
            loan_decl_bankruptcy = @loan_decl_bankruptcy,
            loan_decl_foreclosure = @loan_decl_foreclosure,
            loan_decl_lawsuit = @loan_decl_lawsuit,
            loan_decl_cosigner = @loan_decl_cosigner,
            loan_decl_citizenship = @loan_decl_citizenship,
            loan_decl_primary_residence = @loan_decl_primary_residence,
            loan_saved_at = UTC_TIMESTAMP();
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        cmd.Parameters.Add(new MySqlParameter("@loan_phone", string.IsNullOrWhiteSpace(request.Phone) ? DBNull.Value : request.Phone));
        cmd.Parameters.Add(new MySqlParameter("@loan_dependents", string.IsNullOrWhiteSpace(request.Dependents) ? DBNull.Value : request.Dependents));
        cmd.Parameters.Add(new MySqlParameter("@loan_marital_status", string.IsNullOrWhiteSpace(request.MaritalStatus) ? DBNull.Value : request.MaritalStatus));
        cmd.Parameters.Add(new MySqlParameter("@loan_current_address", string.IsNullOrWhiteSpace(request.CurrentAddress) ? DBNull.Value : request.CurrentAddress));
        cmd.Parameters.Add(new MySqlParameter("@loan_current_address_years", string.IsNullOrWhiteSpace(request.CurrentAddressYears) ? DBNull.Value : request.CurrentAddressYears));
        cmd.Parameters.Add(new MySqlParameter("@loan_previous_address", string.IsNullOrWhiteSpace(request.PreviousAddress) ? DBNull.Value : request.PreviousAddress));
        cmd.Parameters.Add(new MySqlParameter("@loan_rent_or_own", string.IsNullOrWhiteSpace(request.RentOrOwn) ? DBNull.Value : request.RentOrOwn));
        cmd.Parameters.Add(new MySqlParameter("@loan_monthly_housing_payment", request.MonthlyHousingPayment ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_landlord_contact", string.IsNullOrWhiteSpace(request.LandlordContact) ? DBNull.Value : request.LandlordContact));
        cmd.Parameters.Add(new MySqlParameter("@loan_employer_name", string.IsNullOrWhiteSpace(request.EmployerName) ? DBNull.Value : request.EmployerName));
        cmd.Parameters.Add(new MySqlParameter("@loan_employer_address", string.IsNullOrWhiteSpace(request.EmployerAddress) ? DBNull.Value : request.EmployerAddress));
        cmd.Parameters.Add(new MySqlParameter("@loan_job_title", string.IsNullOrWhiteSpace(request.JobTitle) ? DBNull.Value : request.JobTitle));
        cmd.Parameters.Add(new MySqlParameter("@loan_employment_type", string.IsNullOrWhiteSpace(request.EmploymentType) ? DBNull.Value : request.EmploymentType));
        cmd.Parameters.Add(new MySqlParameter("@loan_start_date", string.IsNullOrWhiteSpace(request.StartDate) ? DBNull.Value : request.StartDate));
        cmd.Parameters.Add(new MySqlParameter("@loan_previous_employer", string.IsNullOrWhiteSpace(request.PreviousEmployer) ? DBNull.Value : request.PreviousEmployer));
        cmd.Parameters.Add(new MySqlParameter("@loan_employment_gaps", string.IsNullOrWhiteSpace(request.EmploymentGaps) ? DBNull.Value : request.EmploymentGaps));
        cmd.Parameters.Add(new MySqlParameter("@loan_base_salary", request.BaseSalary ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_bonuses", request.Bonuses ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_self_employ_income", request.SelfEmployIncome ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_rental_income", request.RentalIncome ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_other_income", request.OtherIncome ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_other_income_source", string.IsNullOrWhiteSpace(request.OtherIncomeSource) ? DBNull.Value : request.OtherIncomeSource));
        cmd.Parameters.Add(new MySqlParameter("@loan_checking_balance", request.CheckingBalance ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_savings_balance", request.SavingsBalance ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_retirement_balance", request.RetirementBalance ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_investment_balance", request.InvestmentBalance ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_gift_funds", request.GiftFunds ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_real_estate_value", request.RealEstateValue ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_other_assets", string.IsNullOrWhiteSpace(request.OtherAssets) ? DBNull.Value : request.OtherAssets));
        cmd.Parameters.Add(new MySqlParameter("@loan_credit_card_payment", request.CreditCardPayment ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_student_loan_payment", request.StudentLoanPayment ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_auto_loan_payment", request.AutoLoanPayment ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_child_support", request.ChildSupport ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_other_debt", request.OtherDebt ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@loan_decl_outstanding_judgments", string.IsNullOrWhiteSpace(request.DeclOutstandingJudgments) ? DBNull.Value : request.DeclOutstandingJudgments));
        cmd.Parameters.Add(new MySqlParameter("@loan_decl_bankruptcy", string.IsNullOrWhiteSpace(request.DeclBankruptcy) ? DBNull.Value : request.DeclBankruptcy));
        cmd.Parameters.Add(new MySqlParameter("@loan_decl_foreclosure", string.IsNullOrWhiteSpace(request.DeclForeclosure) ? DBNull.Value : request.DeclForeclosure));
        cmd.Parameters.Add(new MySqlParameter("@loan_decl_lawsuit", string.IsNullOrWhiteSpace(request.DeclLawsuit) ? DBNull.Value : request.DeclLawsuit));
        cmd.Parameters.Add(new MySqlParameter("@loan_decl_cosigner", string.IsNullOrWhiteSpace(request.DeclCosigner) ? DBNull.Value : request.DeclCosigner));
        cmd.Parameters.Add(new MySqlParameter("@loan_decl_citizenship", string.IsNullOrWhiteSpace(request.DeclCitizenship) ? DBNull.Value : request.DeclCitizenship));
        cmd.Parameters.Add(new MySqlParameter("@loan_decl_primary_residence", string.IsNullOrWhiteSpace(request.DeclPrimaryResidence) ? DBNull.Value : request.DeclPrimaryResidence));
        cmd.ExecuteNonQuery();
    }

    return Results.Ok();
});

// ── Pre-Approval: Document Checklist ────────────────────────────────────────

app.MapGet("/api/preapproval/documents", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        SELECT
            doc_paystub_1, doc_paystub_2, doc_paystub_eoy_1, doc_paystub_eoy_2,
            doc_tax_1, doc_tax_2, doc_w2_year1, doc_w2_year2, doc_gov_id,
            doc_bank_1, doc_bank_2, doc_bank_3, doc_bank_4, doc_saved_at
        FROM preapproval_data
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
        if (!reader.Read()) return Results.Ok((object?)null);

        var result = new DocumentChecklistResponse(
            reader.GetBoolean(reader.GetOrdinal("doc_paystub_1")),
            reader.GetBoolean(reader.GetOrdinal("doc_paystub_2")),
            reader.GetBoolean(reader.GetOrdinal("doc_paystub_eoy_1")),
            reader.GetBoolean(reader.GetOrdinal("doc_paystub_eoy_2")),
            reader.GetBoolean(reader.GetOrdinal("doc_tax_1")),
            reader.GetBoolean(reader.GetOrdinal("doc_tax_2")),
            reader.GetBoolean(reader.GetOrdinal("doc_w2_year1")),
            reader.GetBoolean(reader.GetOrdinal("doc_w2_year2")),
            reader.GetBoolean(reader.GetOrdinal("doc_gov_id")),
            reader.GetBoolean(reader.GetOrdinal("doc_bank_1")),
            reader.GetBoolean(reader.GetOrdinal("doc_bank_2")),
            reader.GetBoolean(reader.GetOrdinal("doc_bank_3")),
            reader.GetBoolean(reader.GetOrdinal("doc_bank_4")),
            reader.IsDBNull(reader.GetOrdinal("doc_saved_at")) ? null : reader.GetDateTime(reader.GetOrdinal("doc_saved_at"))
        );
        return Results.Ok(result);
    }
});

app.MapPut("/api/preapproval/documents", (SaveDocumentChecklistRequest request, IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        INSERT INTO preapproval_data (
            user_id,
            doc_paystub_1, doc_paystub_2, doc_paystub_eoy_1, doc_paystub_eoy_2,
            doc_tax_1, doc_tax_2, doc_w2_year1, doc_w2_year2, doc_gov_id,
            doc_bank_1, doc_bank_2, doc_bank_3, doc_bank_4, doc_saved_at
        ) VALUES (
            @user_id,
            @doc_paystub_1, @doc_paystub_2, @doc_paystub_eoy_1, @doc_paystub_eoy_2,
            @doc_tax_1, @doc_tax_2, @doc_w2_year1, @doc_w2_year2, @doc_gov_id,
            @doc_bank_1, @doc_bank_2, @doc_bank_3, @doc_bank_4, UTC_TIMESTAMP()
        )
        ON DUPLICATE KEY UPDATE
            doc_paystub_1 = @doc_paystub_1, doc_paystub_2 = @doc_paystub_2,
            doc_paystub_eoy_1 = @doc_paystub_eoy_1, doc_paystub_eoy_2 = @doc_paystub_eoy_2,
            doc_tax_1 = @doc_tax_1, doc_tax_2 = @doc_tax_2,
            doc_w2_year1 = @doc_w2_year1, doc_w2_year2 = @doc_w2_year2,
            doc_gov_id = @doc_gov_id,
            doc_bank_1 = @doc_bank_1, doc_bank_2 = @doc_bank_2,
            doc_bank_3 = @doc_bank_3, doc_bank_4 = @doc_bank_4,
            doc_saved_at = UTC_TIMESTAMP();
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        cmd.Parameters.Add(new MySqlParameter("@doc_paystub_1", request.Paystub1));
        cmd.Parameters.Add(new MySqlParameter("@doc_paystub_2", request.Paystub2));
        cmd.Parameters.Add(new MySqlParameter("@doc_paystub_eoy_1", request.PaystubEoy1));
        cmd.Parameters.Add(new MySqlParameter("@doc_paystub_eoy_2", request.PaystubEoy2));
        cmd.Parameters.Add(new MySqlParameter("@doc_tax_1", request.Tax1));
        cmd.Parameters.Add(new MySqlParameter("@doc_tax_2", request.Tax2));
        cmd.Parameters.Add(new MySqlParameter("@doc_w2_year1", request.W2Year1));
        cmd.Parameters.Add(new MySqlParameter("@doc_w2_year2", request.W2Year2));
        cmd.Parameters.Add(new MySqlParameter("@doc_gov_id", request.GovId));
        cmd.Parameters.Add(new MySqlParameter("@doc_bank_1", request.Bank1));
        cmd.Parameters.Add(new MySqlParameter("@doc_bank_2", request.Bank2));
        cmd.Parameters.Add(new MySqlParameter("@doc_bank_3", request.Bank3));
        cmd.Parameters.Add(new MySqlParameter("@doc_bank_4", request.Bank4));
        cmd.ExecuteNonQuery();
    }

    return Results.Ok();
});

// ── Pre-Approval: Qualification Snapshot ────────────────────────────────────

app.MapGet("/api/preapproval/qualification", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        SELECT snap_dti, snap_credit_score, snap_monthly_income,
               snap_monthly_expenses, snap_savings, snap_down_payment_pct, snap_saved_at
        FROM preapproval_data
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
        if (!reader.Read()) return Results.Ok((object?)null);

        var snapSavedAt = reader.IsDBNull(reader.GetOrdinal("snap_saved_at")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("snap_saved_at"));
        if (snapSavedAt is null) return Results.Ok((object?)null);

        var result = new QualificationSnapshotResponse(
            reader.IsDBNull(reader.GetOrdinal("snap_dti")) ? null : reader.GetDecimal(reader.GetOrdinal("snap_dti")),
            reader.IsDBNull(reader.GetOrdinal("snap_credit_score")) ? null : Convert.ToUInt16(reader.GetValue(reader.GetOrdinal("snap_credit_score"))),
            reader.IsDBNull(reader.GetOrdinal("snap_monthly_income")) ? null : reader.GetDecimal(reader.GetOrdinal("snap_monthly_income")),
            reader.IsDBNull(reader.GetOrdinal("snap_monthly_expenses")) ? null : reader.GetDecimal(reader.GetOrdinal("snap_monthly_expenses")),
            reader.IsDBNull(reader.GetOrdinal("snap_savings")) ? null : reader.GetDecimal(reader.GetOrdinal("snap_savings")),
            reader.IsDBNull(reader.GetOrdinal("snap_down_payment_pct")) ? null : reader.GetDecimal(reader.GetOrdinal("snap_down_payment_pct")),
            snapSavedAt
        );
        return Results.Ok(result);
    }
});

app.MapPut("/api/preapproval/qualification", (SaveQualificationSnapshotRequest request, IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        INSERT INTO preapproval_data (
            user_id, snap_dti, snap_credit_score, snap_monthly_income,
            snap_monthly_expenses, snap_savings, snap_down_payment_pct, snap_saved_at
        ) VALUES (
            @user_id, @snap_dti, @snap_credit_score, @snap_monthly_income,
            @snap_monthly_expenses, @snap_savings, @snap_down_payment_pct, UTC_TIMESTAMP()
        )
        ON DUPLICATE KEY UPDATE
            snap_dti = @snap_dti,
            snap_credit_score = @snap_credit_score,
            snap_monthly_income = @snap_monthly_income,
            snap_monthly_expenses = @snap_monthly_expenses,
            snap_savings = @snap_savings,
            snap_down_payment_pct = @snap_down_payment_pct,
            snap_saved_at = UTC_TIMESTAMP();
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        cmd.Parameters.Add(new MySqlParameter("@snap_dti", request.Dti ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@snap_credit_score", request.CreditScore ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@snap_monthly_income", request.MonthlyIncome ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@snap_monthly_expenses", request.MonthlyExpenses ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@snap_savings", request.Savings ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@snap_down_payment_pct", request.DownPaymentPct ?? (object)DBNull.Value));
        cmd.ExecuteNonQuery();
    }

    return Results.Ok();
});

// ── Pre-Approval: Mark Stage Complete ───────────────────────────────────────

app.MapPost("/api/preapproval/complete", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        INSERT INTO user_progress (user_id, stage, completed, completed_at)
        VALUES (@user_id, 'Pre-Approval', TRUE, UTC_TIMESTAMP())
        ON DUPLICATE KEY UPDATE
            completed = TRUE,
            completed_at = UTC_TIMESTAMP();
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        cmd.ExecuteNonQuery();
    }

    return Results.Ok();
});

app.MapGet("/api/preapproval/complete", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        SELECT completed, completed_at
        FROM user_progress
        WHERE user_id = @user_id AND stage = 'Pre-Approval'
        LIMIT 1;
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        using var reader = cmd.ExecuteReader();
        if (!reader.Read()) return Results.Ok(new { completed = false, completedAt = (DateTime?)null });

        var completed = reader.GetBoolean(reader.GetOrdinal("completed"));
        var completedAt = reader.IsDBNull(reader.GetOrdinal("completed_at")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("completed_at"));
        return Results.Ok(new { completed, completedAt });
    }
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

// ── Milestones ───────────────────────────────────────────────────────────────

app.MapGet("/api/milestones", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        SELECT milestone_id, completed, completed_at
        FROM user_milestones
        WHERE user_id = @user_id;
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        using var reader = cmd.ExecuteReader();
        var rows = new List<object>();
        while (reader.Read())
        {
            rows.Add(new
            {
                milestoneId = reader.GetInt32(reader.GetOrdinal("milestone_id")),
                completed = reader.GetBoolean(reader.GetOrdinal("completed")),
                completedAt = reader.IsDBNull(reader.GetOrdinal("completed_at")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("completed_at")),
            });
        }
        return Results.Ok(rows);
    }
});

app.MapPut("/api/milestones/{milestoneId:int}", (int milestoneId, MilestoneUpdateRequest request, IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        INSERT INTO user_milestones (user_id, milestone_id, completed, completed_at)
        VALUES (@user_id, @milestone_id, @completed, @completed_at)
        ON DUPLICATE KEY UPDATE
            completed = @completed,
            completed_at = @completed_at;
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        cmd.Parameters.Add(new MySqlParameter("@milestone_id", milestoneId));
        cmd.Parameters.Add(new MySqlParameter("@completed", request.Completed));
        cmd.Parameters.Add(new MySqlParameter("@completed_at", request.Completed ? DateTime.UtcNow : DBNull.Value));
        cmd.ExecuteNonQuery();
    }

    return Results.Ok();
});

// ── Learning Progress ────────────────────────────────────────────────────────

app.MapGet("/api/learning/progress", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        SELECT module_id FROM user_learning_progress
        WHERE user_id = @user_id;
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        using var reader = cmd.ExecuteReader();
        var moduleIds = new List<string>();
        while (reader.Read())
            moduleIds.Add(reader.GetString(reader.GetOrdinal("module_id")));
        return Results.Ok(moduleIds);
    }
});

app.MapPost("/api/learning/progress/{moduleId}", (string moduleId, IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        INSERT IGNORE INTO user_learning_progress (user_id, module_id, completed_at)
        VALUES (@user_id, @module_id, UTC_TIMESTAMP());
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        cmd.Parameters.Add(new MySqlParameter("@module_id", moduleId));
        cmd.ExecuteNonQuery();
    }

    return Results.Ok();
});

// ── Money Management Settings ────────────────────────────────────────────────

app.MapGet("/api/money-settings", (IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        SELECT money_savings_goal, money_housing_budget
        FROM users WHERE user_id = @user_id LIMIT 1;
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        using var reader = cmd.ExecuteReader();
        if (!reader.Read()) return Results.Ok(new { monthlySavingsGoal = (decimal?)null, housingBudget = (decimal?)null });

        return Results.Ok(new
        {
            monthlySavingsGoal = reader.IsDBNull(reader.GetOrdinal("money_savings_goal")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("money_savings_goal")),
            housingBudget = reader.IsDBNull(reader.GetOrdinal("money_housing_budget")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("money_housing_budget")),
        });
    }
});

app.MapPut("/api/money-settings", (MoneySettingsRequest request, IDbConnection db, HttpContext httpContext) =>
{
    if (!TryGetSessionUser(httpContext, out var sessionUser) || sessionUser is null)
        return Results.Unauthorized();

    const string sql = """
        UPDATE users SET
            money_savings_goal = @money_savings_goal,
            money_housing_budget = @money_housing_budget
        WHERE user_id = @user_id;
        """;

    using (db)
    {
        db.Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new MySqlParameter("@user_id", sessionUser.UserId));
        cmd.Parameters.Add(new MySqlParameter("@money_savings_goal", request.MonthlySavingsGoal ?? (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@money_housing_budget", request.HousingBudget ?? (object)DBNull.Value));
        cmd.ExecuteNonQuery();
    }

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

static bool TryGetUtahZipCentroid(string zip, out (double lat, double lng) centroid)
{
    centroid = (0,0);
    if (!int.TryParse(zip, NumberStyles.None, CultureInfo.InvariantCulture, out var z))
    {
        return false;
    }

    if (z < 84000 || z > 84799)
    {
        return false;
    }

    if (z <= 84099)
    {
        // Salt Lake metro and nearby valleys
        var t = (z - 84000) / 99.0;
        centroid = (40.20 + 0.75 * t, -111.95 + 0.20 * t);
        return true;
    }

    if (z <= 84199)
    {
        centroid = (40.76, -111.89);
        return true;
    }

    if (z <= 84399)
    {
        // Logan / Northern Utah
        var t = (z - 84300) / 99.0;
        centroid = (41.50 + 0.40 * t, -111.83);
        return true;
    }

    if (z <= 84699)
    {
        // Provo/Orem and southward
        var t = (z - 84600) / 99.0;
        centroid = (39.70 + 0.65 * t, -111.80 - 0.05 * t);
        return true;
    }

    // 847xx - Southern Utah
    var tSouth = (z - 84700) / 99.0;
    centroid = (37.00 + 0.45 * tSouth, -113.50 + 0.60 * tSouth);
    return true;
}

static List<HomeListing> BuildFallbackListings(List<string> zipCodes)
{
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
        // Try hard-coded UT ZIP centroids first for Utah range; otherwise existing anchors and random fallback.
        var anchor = anchorData.TryGetValue(zip, out var value)
            ? value
            : (0d, 0d, 500000m);

        if (anchor.Item1 == 0 && anchor.Item2 == 0 && TryGetUtahZipCentroid(zip, out var utahCoord))
        {
            anchor = (utahCoord.lat, utahCoord.lng, 500000m);
        }

        // Use ZIP-specific deterministic seed to vary non-UT fallback
        var zipSeed = int.TryParse(zip, NumberStyles.None, CultureInfo.InvariantCulture, out var numericZip)
            ? numericZip
            : zip.Aggregate(0, (hash, ch) => (hash * 31) + ch);

        var random = new Random((int)((uint)zipSeed ^ 0xA3B1C2D3u));

        if (anchor.Item1 == 0 && anchor.Item2 == 0)
        {
            anchor = (40.1652 + random.NextDouble() * 0.25, -111.6247 + random.NextDouble() * 0.25, 500000m);
        }

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

// ── Pre-Approval Records ─────────────────────────────────────────────────────

public record LoanApplicationResponse(
    string? Phone, string? Dependents,
    string? MaritalStatus, string? CurrentAddress, string? CurrentAddressYears,
    string? PreviousAddress, string? RentOrOwn, decimal? MonthlyHousingPayment, string? LandlordContact,
    string? EmployerName, string? EmployerAddress, string? JobTitle,
    string? EmploymentType, string? StartDate, string? PreviousEmployer, string? EmploymentGaps,
    decimal? BaseSalary, decimal? Bonuses, decimal? SelfEmployIncome, decimal? RentalIncome,
    decimal? OtherIncome, string? OtherIncomeSource,
    decimal? CheckingBalance, decimal? SavingsBalance, decimal? RetirementBalance,
    decimal? InvestmentBalance, decimal? GiftFunds, decimal? RealEstateValue, string? OtherAssets,
    decimal? CreditCardPayment, decimal? StudentLoanPayment, decimal? AutoLoanPayment,
    decimal? ChildSupport, decimal? OtherDebt,
    string? DeclOutstandingJudgments, string? DeclBankruptcy, string? DeclForeclosure,
    string? DeclLawsuit, string? DeclCosigner, string? DeclCitizenship, string? DeclPrimaryResidence,
    DateTime? SavedAt
);

public record SaveLoanApplicationRequest(
    string? Phone, string? Dependents,
    string? MaritalStatus, string? CurrentAddress, string? CurrentAddressYears,
    string? PreviousAddress, string? RentOrOwn, decimal? MonthlyHousingPayment, string? LandlordContact,
    string? EmployerName, string? EmployerAddress, string? JobTitle,
    string? EmploymentType, string? StartDate, string? PreviousEmployer, string? EmploymentGaps,
    decimal? BaseSalary, decimal? Bonuses, decimal? SelfEmployIncome, decimal? RentalIncome,
    decimal? OtherIncome, string? OtherIncomeSource,
    decimal? CheckingBalance, decimal? SavingsBalance, decimal? RetirementBalance,
    decimal? InvestmentBalance, decimal? GiftFunds, decimal? RealEstateValue, string? OtherAssets,
    decimal? CreditCardPayment, decimal? StudentLoanPayment, decimal? AutoLoanPayment,
    decimal? ChildSupport, decimal? OtherDebt,
    string? DeclOutstandingJudgments, string? DeclBankruptcy, string? DeclForeclosure,
    string? DeclLawsuit, string? DeclCosigner, string? DeclCitizenship, string? DeclPrimaryResidence
);

public record DocumentChecklistResponse(
    bool Paystub1, bool Paystub2, bool PaystubEoy1, bool PaystubEoy2,
    bool Tax1, bool Tax2, bool W2Year1, bool W2Year2, bool GovId,
    bool Bank1, bool Bank2, bool Bank3, bool Bank4,
    DateTime? SavedAt
);

public record SaveDocumentChecklistRequest(
    bool Paystub1, bool Paystub2, bool PaystubEoy1, bool PaystubEoy2,
    bool Tax1, bool Tax2, bool W2Year1, bool W2Year2, bool GovId,
    bool Bank1, bool Bank2, bool Bank3, bool Bank4
);

public record QualificationSnapshotResponse(
    decimal? Dti, ushort? CreditScore, decimal? MonthlyIncome,
    decimal? MonthlyExpenses, decimal? Savings, decimal? DownPaymentPct,
    DateTime? SavedAt
);

public record SaveQualificationSnapshotRequest(
    decimal? Dti, ushort? CreditScore, decimal? MonthlyIncome,
    decimal? MonthlyExpenses, decimal? Savings, decimal? DownPaymentPct
);

public record MilestoneUpdateRequest(bool Completed);

public record MoneySettingsRequest(decimal? MonthlySavingsGoal, decimal? HousingBudget);
