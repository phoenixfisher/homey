# Homey

Homey is organized as a multi-part project:

- `frontend/`: React + TypeScript (Vite)
- `backend/`: planned .NET/C# API (not scaffolded yet)
- `db/`: MySQL schema and seed SQL
- `frontend/scripts/`: local database setup/reset scripts

## Current Status

- Frontend has a working homepage and dashboard with the full Homey design system applied.
- Database schema and seed data are in `db/sql/`.
- Backend is scaffolded in `backend/` (default .NET Web API template — endpoints and DB connection still need to be added).

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

## Frontend Design System

The frontend (`frontend/src/`) uses a glassmorphism design system built on Tailwind CSS v4 and shadcn/ui. Everything lives under `src/` — no configuration beyond what is already set up.

### Routes

| URL | Component | File |
|---|---|---|
| `/` | Landing page + onboarding modal | `src/pages/HomePage.tsx` |
| `/dashboard` | Milestone dashboard | `src/pages/DashboardPage.tsx` |
| `/login` | Login & registration screen | `src/pages/LoginPage.tsx` |
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
```

The homepage uses a vertical gradient override — pass a `className` prop to `AppLayout` to do the same on any page:

```tsx
<AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
```

### Brand colors

| Name | Hex | Use |
|---|---|---|
| Blue | `#3e78b2` | Primary / links / active states |
| Sage | `#bdc4a7` | Financial category accents |
| Mint | `#92b4a7` | Research / secondary accents |
| Rose | `#bf8b85` | Credit / warning accents |
| Dark | `#2f2f2f` | Text on light backgrounds |

All colors are also available as CSS variables (`--color-blue`, `--color-sage`, etc.) defined in `src/styles/theme.css`.

### `.glass` utility class

Apply `glass` to any element to get the glassmorphism card style (frosted white overlay + blur + border):

```tsx
<div className="glass rounded-2xl p-6">
  <p className="text-white">Card content</p>
</div>
```

### shadcn/ui components

Pre-built components are in `src/components/ui/`. Import them with the `@/` alias:

```tsx
import { Button }    from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input }     from '@/components/ui/input';
import { Badge }     from '@/components/ui/badge';
import { Progress }  from '@/components/ui/progress';
import { Label }     from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
```

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

## Login & User Tracking

Homey now combines a **backend-backed username/password account system** with **browser-side profile and milestone state** for personalization.

### Backend auth (username + password)

- The backend (`backend/Homey.Api`) exposes two minimal endpoints:
  - `POST /api/auth/register` — creates a new user account in the `users` table (username, email, hashed password, first name, last name).
  - `POST /api/auth/login` — logs a user in by `usernameOrEmail` + `password` and returns basic user info.
- Passwords are hashed with BCrypt via the `BCrypt.Net-Next` package.
- The database schema in `db/sql/schema.sql` was extended so `users` includes a unique `username` column alongside `email` and `password_hash`.
- CORS is enabled for `http://localhost:5173` so the Vite frontend can call the API directly.

> Note: These endpoints do not yet issue JWTs or cookies; the frontend uses the success of a login/register call as the signal that the user is “logged in,” and you can layer a fuller auth story on top later.

### Frontend login card behavior

On the homepage header and throughout the app, the right-hand button is **Login / Sign Out**:

- When **not logged in**:
  - The button shows **“Login”** and navigates to the dedicated `/login` screen.
  - The `/login` screen presents a full-page login/register experience that expands and contracts with the viewport:
    - **Login view**:
      - Fields: **Username or Email + Password**.
      - On submit, calls `POST /api/auth/login` and on success navigates to `/dashboard`.
      - Includes an inline **“Register here”** link.
    - **Register view**:
      - Fields: **First Name, Last Name, Email, Username, Password**.
      - On submit, calls `POST /api/auth/register` and, on success, returns to the login view with the username/email prefilled.
- When **logged in**:
  - The header button shows **“Sign Out”**, which clears local profile/milestone state via `logout()` and returns to a logged-out state.

### Onboarding profile & dashboard

Separately from account auth, the onboarding flow still captures a detailed **Homey profile** on the homepage. That profile is stored in `localStorage` via helper functions in `frontend/src/lib/auth.ts`:

- `isLoggedIn()` — returns `true` if a profile exists in `localStorage`.
- `getUserProfile()` — returns the typed `HomeyUserProfile` object or `null`.
- `saveUserProfile(profile)` — saves a `HomeyUserProfile` to `localStorage`.
- `logout()` — clears both the profile and milestone data from `localStorage`.

Key behaviors:

- Completing the three-step onboarding modal still saves a `HomeyUserProfile` and navigates to `/dashboard`.
- The dashboard reads this profile and milestones from `localStorage` and redirects back to `/` when no profile is present.

This keeps the **financial profile and milestone experience fast and local**, while the new backend accounts allow users to sign in with a username/password and pave the way for shared, server-side state later.

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
