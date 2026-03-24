# Homey Backend

Starter ASP.NET Core Web API scaffold created with `dotnet new webapi`.

## Structure

- `Homey.slnx`: solution file
- `Homey.Api/`: API project

## Status

The backend exposes minimal authentication endpoints backed by the MySQL schema in `db/sql/schema.sql`. It uses raw ADO.NET with `MySqlConnector` and BCrypt for password hashing.

## Configuration

For local development, the backend reads database settings from the repo root `.env` file before ASP.NET configuration is built. It also supports standard environment variables.

Expected `.env` keys:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

If `ConnectionStrings:DefaultConnection` is set through environment variables or other ASP.NET configuration, that value still takes precedence.

`appsettings.Development.example.json` remains a safe reference file for non-secret development settings.

## Auth Endpoints

The API exposes two minimal auth endpoints that operate on the `users` table defined in `db/sql/schema.sql`:

- `POST /api/auth/register`
  - Body:
    - `username` (string, required, unique)
    - `email` (string, required, unique)
    - `password` (string, required)
    - `firstName` (string, required)
    - `lastName` (string, required)
  - Behavior:
    - Validates that all fields are present.
    - Ensures `username` and `email` are unique.
    - Hashes the password with BCrypt and stores it in `users.password_hash`.
    - Returns a JSON payload: `{ userId, username, email, firstName, lastName }`.

- `POST /api/auth/login`
  - Body:
    - `usernameOrEmail` (string, required)
    - `password` (string, required)
  - Behavior:
    - Looks up a user by `username` or `email`.
    - Verifies the password against `password_hash` using BCrypt.
    - On success returns `{ userId, username, email, firstName, lastName }`.
    - On failure returns `401 Unauthorized`.

> Note: These endpoints do not yet issue JWTs or cookies. The frontend currently uses the presence of a successful response to treat the user as “logged in” in combination with its own local state. You can later layer a proper token or cookie-based auth mechanism on top of this.