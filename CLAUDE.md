# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`cd backend`)
```bash
bun install          # Install dependencies
bun run index.ts     # Start dev server (port 4000)
bun test             # Bun's test runner (uses backend/bunfig.toml → job-tracker-test DB)
bun run test         # Vitest (same isolated DB via test/setup.ts)
bun test path/to/file.test.ts   # Single file
```

### Frontend (`cd frontend`)
```bash
bun install          # Install dependencies
bun run dev          # Start dev server (port 5174, proxies /api to localhost:4000)
bun run build        # Build static assets to dist/
bun run preview      # Preview production build
```

## Architecture

Monorepo with `backend/` and `frontend/` directories. All package management uses **Bun**.

### Backend (`backend/`)
- **Framework:** Hono running on Bun
- **Database:** MongoDB via raw driver (`mongodb` package) — no ORM. `db.ts` exposes `getCollection(name)` and `getObjectId(id)` helpers with a lazy-initialized singleton client.
- **Auth:** JWT tokens stored in HTTP-only cookies. The `auth` middleware validates tokens and sets `c.set('user', payload)`. Refresh tokens are handled via `POST /api/auth/refresh`. Routes under `/api/jobs/*`, `/api/companies/*`, and `/api/notes/*` are protected.
- **Logging:** Custom structured logger — colored output in dev, JSON in production. All HTTP requests are logged with method, path, status, and duration.
- **Testing:** Vitest integration tests. Tests drop the entire database in cleanup.

Backend environment variables (all have defaults):
- `PORT` — server port (default: `4000`)
- `MONGO_URI` — MongoDB connection string (default: `mongodb://localhost:27017`)
- `MONGO_DB` — database name (default: `job-tracker`)
- `JWT_SECRET` — signing key (default: `dev-secret`)
- `JWT_EXPIRES_IN` — token expiry (default: `15m`)
- `NODE_ENV` — affects CORS and cookie security flags

### Frontend (`frontend/`)
- **Stack:** React 18 + Vite + React Router v7 + TanStack React Query v5
- **UI:** Radix UI primitives + Tailwind CSS v4. Component wrappers live in `src/components/ui/`.
- **Routing:** Protected routes via `ProtectedRoute` / `PublicOnlyRoute` components. Two layout shells: `AuthLayout` (login/register) and `AppLayout` (authenticated app with theme toggle).
- **Auth flow:** Cookie-based. `useQuery` on `GET /api/auth/me` determines auth state; the query client automatically retries after a 401 by calling `/api/auth/refresh`.
- **Data fetching:** Custom React Query hooks (`useJobs`, `useCompanies`, `useNotes`, etc.) wrap all API calls. No global store — server state lives entirely in React Query.
- **Proxy:** Vite proxies `/api/*` to `http://localhost:4000` in dev so cookies work across origins.

Frontend environment variables:
- `VITE_API_BASE` — API base path (default: `/api`)

### Data Models (MongoDB collections)

| Collection | Key fields |
|---|---|
| `users` | `name`, `email`, `passwordHash`, `createdAt` |
| `jobs` | `userId`, `companyId`, `title`, `status` (`waiting`/`applied`/`interview`/`offer`/`negotiation`/`rejected`/`ghosted`), `location` (`on-site`/`remote`/`hybrid`) |
| `companies` | `userId`, `name`, `website`, `description` |
| `notes` | `jobId`, `content` |

All IDs are MongoDB ObjectIds. `userId` and `companyId` on jobs are string references (not ObjectId relations).

### API Surface
- `GET /api/health` — health check
- `/api/auth/*` — register, login, logout, refresh, me
- `/api/jobs` — CRUD; `GET /api/jobs/:id/with-notes` returns job + its notes
- `/api/companies` — CRUD
- `/api/notes?jobId=...` — CRUD, filtered by job
