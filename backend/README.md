# Homey Backend

Starter ASP.NET Core Web API scaffold created with `dotnet new webapi`.

## Structure

- `Homey.slnx`: solution file
- `Homey.Api/`: API project

## Status

This is scaffold-only for now. Database connection, EF Core, and app endpoints are not wired yet.

## Next Steps

1. Add EF Core + MySQL provider packages.
2. Create `DbContext` and models based on `db/sql/schema.sql`.
3. Add initial migration.
4. Add CORS for frontend (`http://localhost:5173`).
