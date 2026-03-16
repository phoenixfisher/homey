# Homey

Homey is organized as a multi-part project:

- `frontend/`: React + TypeScript (Vite)
- `backend/`: planned .NET/C# API (not scaffolded yet)
- `db/`: MySQL schema and seed SQL
- `frontend/scripts/`: local database setup/reset scripts

## Current Status

- Frontend is running in `frontend/`.
- Database schema and seed data are in `db/sql/`.
- Backend folder exists but still needs .NET project scaffolding.

## Prerequisites

- Node.js 20+
- npm
- MySQL Server (local)

## Quick Start

Note: Commands use `--prefix frontend` so you can run them from the repo root without changing directories.

1. Configure environment values:

```bash
cp .env.example .env
```

2. Install frontend dependencies, build the database, start frontend:

```bash
npm --prefix frontend install
npm --prefix frontend run db:setup
npm --prefix frontend run dev
```

## Common Commands

```bash
npm --prefix frontend run dev # Start frontend dev server
npm --prefix frontend run build # Rebuild frontend
npm --prefix frontend run lint # Lint frontend
npm --prefix frontend run db:setup # Initialize DB (safe if already exists)
npm --prefix frontend run db:reset # Reset DB (drops and recreates)
```

## Docs

- Database details: `db/README.md`

## Next Backend Step

Scaffold a .NET Web API in `backend/` and connect it to the same MySQL database.

## EARS Requirements

The following high-level requirements are written using the EARS (Easy Approach to Requirements Syntax) pattern to describe the expected behavior of the current Homey system.

- The system shall allow a developer to configure MySQL connection details via a `.env` file using the environment variables described in `db/README.md`.
- When a developer runs `npm --prefix frontend run db:setup`, the system shall create the configured database if it does not already exist and apply the schema and seed SQL from `db/sql/`.
- When a developer runs `npm --prefix frontend run db:reset`, the system shall drop the configured database if it exists, recreate it, and reapply the schema and seed SQL to provide a known test dataset.
- While the database is initialized with the provided schema and seed data, the system shall store and retrieve user, user progress, and property data as defined in `db/sql/schema.sql`.
- When the database connection or setup fails, the system shall notify the developer through clear error output from the Node-based database setup scripts.
- When a developer runs `npm --prefix frontend run dev`, the system shall start the Vite development server and present the Homey frontend using the data made available by the initialized database.
- When a backend Web API is later scaffolded in `backend/` and connected to the same database, the system shall expose endpoints that allow the frontend to read and update user and property data through that API.
