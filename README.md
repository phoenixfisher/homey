# Homey

Homey is a small full-stack project for guiding first-time homebuyers through budgeting, onboarding, milestone tracking, and pre-approval prep.

## Structure

- `frontend/`: React + TypeScript + Vite app
- `backend/`: ASP.NET Core API with MySQL-backed auth
- `db/`: MySQL schema and seed SQL

## Current State

- Frontend routes are implemented for home, login, dashboard, and pre-approval.
- Database setup and reset scripts live in `frontend/scripts/`.
- Backend auth endpoints are implemented in `backend/Homey.Api`.
- User onboarding profile and milestone progress are still stored in browser `localStorage`.
- Backend login uses ASP.NET session state for `/api/auth/me` and `/api/auth/logout`.

## Prerequisites

- Node.js 20+
- npm
- MySQL Server
- .NET SDK

## Setup

1. Copy the DB env file:

```bash
cp .env.example .env
```

2. Update `.env` with your local MySQL password if needed.

3. Make sure `backend/Homey.Api/appsettings.Development.json` points to the same MySQL database.

### Backend

```bash
dotnet run --project backend/Homey.Api
```

### Frontend

```bash
npm --prefix frontend install
npm --prefix frontend run db:setup
npm --prefix frontend run dev
```

Frontend runs on `http://localhost:5173`. The backend is configured to run locally on `http://localhost:5185` in development.

## Common Commands

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend run db:setup
npm --prefix frontend run db:reset
dotnet run --project backend/Homey.Api
```

## Routes

| Route               | Purpose                               |
| ------------------- | ------------------------------------- |
| `/`                 | Landing page and onboarding modal     |
| `/login`            | Login and registration                |
| `/dashboard`        | Profile summary and milestone tracker |
| `/pre-approval`     | Pre-approval workflow                 |
| `/page1` - `/page4` | Placeholder pages                     |

## Auth

The backend currently exposes these endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Accounts are stored in MySQL. Passwords are hashed with BCrypt. Session state is cookie-backed on the backend, while the buyer profile and milestone checklist remain local to the browser for now.

## Database

- Schema: `db/sql/schema.sql`
- Seed data: `db/sql/seed.sql`
- DB docs: `db/README.md`

The schema includes `users`, `user_progress`, and `properties`.

## Notes

- The frontend currently calls the backend using hard-coded local URLs (`http://localhost:5185`).
- Backend setup already exists in `backend/Homey.Api`; the main setup step is matching its connection string to your local MySQL database.
- The dashboard depends on the onboarding profile in `localStorage`; logging into the backend alone does not fully populate dashboard state.

## EARS Requirements

- The system shall allow a developer to configure MySQL connection details through a root `.env` file for the database setup and reset scripts.
- When a developer runs `npm --prefix frontend run db:setup`, the system shall create the configured database if it does not exist and apply the schema and seed SQL from `db/sql/`.
- When a developer runs `npm --prefix frontend run db:reset`, the system shall drop the configured database, recreate it, and reapply the schema and seed SQL.
- When a developer starts the backend API with a valid MySQL connection string, the system shall expose authentication endpoints for register, login, session lookup, and logout.
- When a user submits valid registration details, the system shall create a user record in MySQL with a BCrypt-hashed password.
- When a user submits valid login credentials, the system shall create a backend session and return basic account information.
- When a user completes the onboarding flow on the homepage, the system shall save the buyer profile in browser `localStorage` and route the user to the dashboard.
- When a dashboard profile is not present in browser storage, the system shall redirect the user from `/dashboard` to `/`.
- While a user interacts with the milestone tracker, the system shall persist milestone completion state in browser `localStorage`.
- When a user opens `/pre-approval`, the system shall present the pre-approval workflow views available in the frontend.
