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
