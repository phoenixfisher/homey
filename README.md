# Homey

Homey is a small full-stack project for guiding first-time homebuyers through budgeting, onboarding, milestone tracking, and pre-approval prep.

<<<<<<< Updated upstream
## Structure

- `frontend/`: React + TypeScript + Vite app
- `backend/`: ASP.NET Core API with MySQL-backed auth
=======
- `frontend/`: React + TypeScript (Vite)
- `backend/`: ASP.NET Core Web API
>>>>>>> Stashed changes
- `db/`: MySQL schema and seed SQL

## Current State

<<<<<<< Updated upstream
- Frontend routes are implemented for home, login, dashboard, money-management, learning, and pre-approval.
- Database setup and reset scripts live in `frontend/scripts/` and are run via `npm run db:setup` / `npm run db:reset`.
- Backend auth endpoints are implemented in `backend/Homey.Api` using cookie-backed ASP.NET sessions.
- User onboarding profile and milestone progress are stored in browser `localStorage` under `homeyProfile` and `homeyMilestones`.
- Frontend auth calls the backend using `VITE_API_URL` and sends cookies (`credentials: 'include'`).
=======
- Frontend has a working homepage and dashboard with the full Homey design system applied.
- Database schema and seed data are in `db/sql/`.
- Backend is scaffolded in `backend/` (default .NET Web API template; endpoints and DB connection still need to be added).
>>>>>>> Stashed changes

## Prerequisites

- Node.js 20+
- npm
<<<<<<< Updated upstream
- MySQL Server
- .NET SDK
- (Frontend auth) `VITE_API_URL` set to your backend origin (default: `http://localhost:5185`)
=======
- .NET 10 SDK
- MySQL Server (local)
>>>>>>> Stashed changes

## Setup

1. Copy the DB env file:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

<<<<<<< Updated upstream
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
=======
2. Install frontend dependencies and build the database:

```bash
npm --prefix frontend install
npm --prefix frontend run db:setup
```

3. Start the frontend:

```bash
npm --prefix frontend run dev
```

4. Start the backend API in a second terminal:

```bash
dotnet run --project backend/Homey.Api
```

## Common Commands

```bash
npm --prefix frontend run dev # Start frontend dev server
npm --prefix frontend run build # Rebuild frontend
npm --prefix frontend run lint # Lint frontend
npm --prefix frontend run db:setup # Initialize DB (safe if already exists)
npm --prefix frontend run db:reset # Reset DB (drops and recreates)
dotnet restore backend/Homey.slnx # Restore backend packages
dotnet build backend/Homey.slnx # Build backend
dotnet run --project backend/Homey.Api # Start backend API
>>>>>>> Stashed changes
```

Terminal #2 (frontend):

<<<<<<< Updated upstream
```powershell
cd frontend
npm run dev
=======
- Database details: `db/README.md`
- Backend details: `backend/README.md`

## Frontend Design System

The frontend (`frontend/src/`) uses a glassmorphism design system built on Tailwind CSS v4 and shadcn/ui. Everything lives under `src/` — no configuration beyond what is already set up.

### Routes

| URL | Component | File |
|---|---|---|
| `/` | Landing page + onboarding modal | `src/pages/HomePage.tsx` |
| `/dashboard` | Milestone dashboard | `src/pages/DashboardPage.tsx` |
| `/page1` – `/page4` | Placeholder stubs | `src/pages/PlaceHolder1–4.tsx` |

Add new routes in `src/App.tsx`.

### Creating a new page

1. Create `src/pages/YourPage.tsx`
2. Wrap content in `<AppLayout>` (provides gradient background and animated orbs automatically)
3. Add a route entry in `src/App.tsx`

```tsx
// src/pages/YourPage.tsx
import { AppLayout } from '@/components/AppLayout';

export function YourPage() {
  return (
    <AppLayout>
      <div className="flex-1 p-8">
        <h1 className="text-4xl font-bold text-white">Your Page</h1>
      </div>
    </AppLayout>
  );
}
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
Use `cn()` from `@/components/ui/utils` to merge Tailwind class names:

```tsx
import { cn } from '@/components/ui/utils';

<div className={cn('glass rounded-xl p-4', isActive && 'bg-white/20')} />
```

### Animations

The project uses Framer Motion (`motion/react`). Use the `motion` component for entrance animations consistent with the rest of the app:

```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="glass rounded-2xl p-6"
>
  …
</motion.div>
```

### File structure reference

```
frontend/src/
├── App.tsx                    # Router — add routes here
├── index.css                  # Imports Tailwind + theme
├── styles/
│   ├── tailwind.css           # Tailwind v4 config
│   └── theme.css              # Design tokens, .glass utility, body gradient
├── components/
│   ├── AppLayout.tsx          # Shared page wrapper (use this on every page)
│   ├── AffordabilityMap.tsx   # US city affordability map widget
│   └── ui/                    # shadcn/ui component library
│       ├── utils.ts           # cn() helper
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── progress.tsx
│       ├── label.tsx
│       └── separator.tsx
└── pages/
    ├── HomePage.tsx           # / — landing + onboarding
    ├── DashboardPage.tsx      # /dashboard — milestone tracker
    ├── PlaceHolder1.tsx       # /page1
    ├── PlaceHolder2.tsx       # /page2
    ├── PlaceHolder3.tsx       # /page3
    └── PlaceHolder4.tsx       # /page4
```

## Next Backend Step

Connect the existing backend scaffold to the same MySQL database and replace the template endpoint with app-specific routes.

## EARS Requirements

The following high-level requirements are written using the EARS (Easy Approach to Requirements Syntax) pattern to describe the expected behavior of the current Homey system.

- The system shall allow a developer to configure MySQL connection details via a `.env` file using the environment variables described in `db/README.md`.
- When a developer runs `npm --prefix frontend run db:setup`, the system shall create the configured database if it does not already exist and apply the schema and seed SQL from `db/sql/`.
- When a developer runs `npm --prefix frontend run db:reset`, the system shall drop the configured database if it exists, recreate it, and reapply the schema and seed SQL to provide a known test dataset.
- While the database is initialized with the provided schema and seed data, the system shall store and retrieve user, user progress, and property data as defined in `db/sql/schema.sql`.
- When the database connection or setup fails, the system shall notify the developer through clear error output from the Node-based database setup scripts.
- When a developer runs `npm --prefix frontend run dev`, the system shall start the Vite development server and present the Homey frontend using the data made available by the initialized database.
- When the scaffolded backend Web API in `backend/` is connected to the same database, the system shall expose endpoints that allow the frontend to read and update user and property data through that API.
>>>>>>> Stashed changes
