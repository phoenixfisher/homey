# Homey

Homey is a small full-stack project for guiding first-time homebuyers through budgeting, onboarding, milestone tracking, and pre-approval prep.

## Structure

- `frontend/`: React + TypeScript + Vite app
- `backend/`: ASP.NET Core API with MySQL-backed auth
- `db/`: MySQL schema and seed SQL

## Current State

- Frontend routes are implemented for home, login, dashboard, money-management, learning, and pre-approval.
- Database setup and reset scripts live in `frontend/scripts/` and are run via `npm run db:setup` / `npm run db:reset`.
- Backend auth endpoints are implemented in `backend/Homey.Api` using cookie-backed ASP.NET sessions.
- User onboarding profile and milestone progress are stored in browser `localStorage` under `homeyProfile` and `homeyMilestones`.
- Frontend auth calls the backend using `VITE_API_URL` and sends cookies (`credentials: 'include'`).

## Prerequisites

- Node.js 20+
- npm
- MySQL Server
- .NET SDK
- (Frontend auth) `VITE_API_URL` set to your backend origin (default: `http://localhost:5185`)

## Setup

1. Copy the DB env file:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

2. Edit `.env` and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for your MySQL instance.

3. Create `frontend/.env` so the frontend knows where the backend is:

```env
VITE_API_URL=http://localhost:5185
```

4. Open two terminals and start backend + frontend:

Terminal #1 (backend):

```powershell
cd backend
dotnet run --project Homey.Api
```

Terminal #2 (frontend + DB scripts):

```powershell
cd frontend
npm install
npm run db:setup
npm run dev
```

Frontend runs on `http://localhost:5173`. The backend is configured to run locally on `http://localhost:5185` in development.

## Common Commands

Terminal #1 (backend):

```powershell
cd backend
dotnet run --project Homey.Api
```

Terminal #2 (frontend):

```powershell
cd frontend
npm run dev
```

Database scripts (from `frontend/`):

```powershell
npm run db:setup
npm run db:reset
```

## Routes

| Route               | Purpose                               |
| ------------------- | ------------------------------------- |
| `/`                 | Landing page and onboarding modal     |
| `/login`            | Login and registration                |
| `/dashboard`        | Profile summary and milestone tracker |
| `/money-management` | Money management page                  |
| `/learning`         | Learning page                          |
| `/pre-approval`     | Pre-approval workflow                 |
| `/page1` - `/page4` | Placeholder pages                     |

## Auth

The backend currently exposes these endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Accounts are stored in MySQL. Passwords are hashed with BCrypt. Session state is cookie-backed on the backend, while the buyer profile and milestone checklist remain local to the browser for now. The frontend includes cookies (`credentials: 'include'`) when calling `/api/auth/*` so the browser receives/sends the session cookie.

## Database

- Schema: `db/sql/schema.sql`
- Seed data: `db/sql/seed.sql`
- DB docs: `db/README.md`

The schema includes `users`, `user_progress`, and `properties`.

## Notes
- The frontend calls the backend using `VITE_API_URL` and sends cookies (session auth) with `credentials: 'include'`.
- The backend reads local database settings from the root `.env` file (searched upward from the backend working directory) or standard environment variables.
- The dashboard depends on the onboarding profile stored in browser `localStorage` (`homeyProfile`); logging into the backend alone does not fully populate dashboard state.

## EARS Requirements

- The system shall allow a developer to configure MySQL connection details via the repo root `.env` file (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) so DB setup/reset scripts can run locally.
- The system shall allow the backend API to read MySQL connection details from the same repo root `.env` file (searched upward from the backend working directory) or equivalent environment variables during local development.
- When a developer runs `npm run db:setup` from the `frontend/` folder, the system shall create the configured MySQL database (if missing) and apply `db/sql/schema.sql` and `db/sql/seed.sql`.
- When a developer runs `npm run db:reset` from the `frontend/` folder, the system shall drop the configured MySQL database, recreate it, and reapply `db/sql/schema.sql` and `db/sql/seed.sql`.
- When a developer starts the backend API with valid database configuration, the system shall expose auth endpoints for registration, login, session lookup, and logout:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- When a user submits valid registration details, the system shall validate required fields, hash the password with BCrypt, store the user in MySQL, and set a backend session.
- When a user submits valid login credentials, the system shall verify the password with BCrypt, set a backend session, and return basic account information.
- When a user has no backend session, `GET /api/auth/me` shall return `204 No Content`; otherwise it shall return the session user JSON.
- When a user logs out, the system shall clear the backend session.
- When a user completes the onboarding flow on `/`, the system shall save the buyer profile to browser `localStorage` under `homeyProfile` and route the user to `/dashboard`.
- When a user visits `/dashboard` without a saved `homeyProfile`, the system shall block dashboard content and prompt the user to return to `/` (it does not auto-redirect).
- While a user interacts with the milestone tracker, the system shall persist milestone completion state in browser `localStorage` under `homeyMilestones`.
- When a user opens `/pre-approval`, the system shall render the pre-approval workflow views available in the frontend router.
- When the frontend is configured with `VITE_API_URL`, the system shall send auth requests with cookies enabled (`credentials: 'include'`) so backend session auth works during local development.
