# Homey Database Setup

This repository includes a simple local MySQL setup for the project.

## What Was Added

- `db/sql/schema.sql` contains the SQL that defines the tables
- `db/sql/seed.sql` contains the SQL that inserts sample test data
- `frontend/scripts/db-setup.mjs` is a Node script that connects to MySQL and runs the SQL files for first-time setup
- `frontend/scripts/db-reset.mjs` is a Node script that drops the database, recreates it, and then runs the SQL files again
- `.env.example` shows the MySQL connection values each teammate needs locally

The `.sql` files are the database instructions. The `.mjs` files are the automation scripts that run those instructions for you.

## One-Time Setup

1. Install MySQL Server on your machine.
2. Clone the repo and install frontend dependencies with `npm --prefix frontend install`.
3. Run database setup commands from the repository root.
4. Copy `.env.example` to `.env`.
5. Fill in your local MySQL username, password, and database name.

Example `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=homey_dev
```

## Build The Database

Run this the first time:

```bash
npm --prefix frontend run db:setup
```

This will:

- create the database if it does not already exist
- create the `users`, `user_progress`, and `properties` tables (including `users.last_logged_in_at` for login recency tracking)
- insert one sample user, progress rows, and one sample property

## Reset The Database

Run this when you want a clean rebuild:

```bash
npm --prefix frontend run db:reset
```

This will drop the current database, recreate it, and reload the schema and sample data.

## Team Workflow

1. Pull the latest code from GitHub.
2. Update `.env` if your local MySQL credentials changed.
3. Run `npm --prefix frontend run db:setup` for normal setup.
4. Run `npm --prefix frontend run db:reset` if you need a clean copy of the database.

## Files To Edit Later

- Update `db/sql/schema.sql` when the table design changes.
- Update `db/sql/seed.sql` when you want different sample data.

## Important Note

This repo currently sets up the database only. The React app does not connect directly to MySQL. When you build the backend later, it should connect to this database and expose API routes for the frontend.
