# Job Tracker

A personal job-application tracker I built and actively use during my job search. It lets me track applications, companies, and notes across every stage of the hiring process. The app is containerized with Docker and deployed on a DigitalOcean droplet.

I'm a .NET developer with many years of experience who was recently laid off. I built this project for its practical utility, but also as an opportunity to venture outside my usual stack — exploring TypeScript, Bun, React, and MongoDB — and to learn how to work effectively with AI-assisted development tools like Claude Code. The main thing I want any potential employer to take away is that I'm still hungry to learn and not afraid to pick up new tools and technologies.

If you're interested in hiring me or want to know more about my background, you can find me at [billydavis.dev](http://billydavis.dev).

## Tech stack

### Runtime & package manager
- **Bun** — used for both the backend runtime and as the package manager across the monorepo. Replaces Node.js and npm/yarn entirely.

### Backend
- **TypeScript** — strictly typed throughout
- **Hono** — lightweight, fast web framework with a familiar Express-like API, running directly on Bun
- **MongoDB** — document database accessed via the raw `mongodb` driver (no ORM). A lazy-initialized singleton client exposes `getCollection()` and `getObjectId()` helpers.
- **JWT authentication** — tokens issued on login and stored in HTTP-only cookies. A refresh token flow handles silent re-authentication. Route middleware validates tokens and attaches the user payload to the request context.
- **Structured logging** — custom logger that outputs colored text in development and JSON in production, with method, path, status, and duration on every request.

### Frontend
- **React 18** — UI library
- **Vite** — build tool and dev server. Proxies `/api/*` to the backend in development so cookies work without CORS issues.
- **PWA** — production builds include a web app manifest and service worker (`vite-plugin-pwa`) so you can install the app on desktop or mobile from a **secure origin** (HTTPS, or `localhost` for testing). Use `vite preview` after `vite build`, or open your deployed site in Chrome/Edge and use the install option in the address bar. API traffic stays **network-only** in the service worker so cookie auth is not served from cache.
- **React Router v7** — client-side routing with protected route wrappers for authenticated and public-only pages
- **TanStack React Query v5** — all server state lives here. Custom hooks (`useJobs`, `useCompanies`, `useNotes`, etc.) wrap every API call. Automatic retry on 401 triggers the refresh flow before re-fetching.
- **Radix UI** — accessible, unstyled component primitives (dialogs, dropdowns, selects, etc.)
- **Tailwind CSS v4** — utility-first styling

### Testing
- **Vitest** — integration tests that run against a real MongoDB instance. The database is dropped on each test run to ensure a clean state.

### Infrastructure
- **Docker** — each service (`backend`, `frontend`) has its own multi-stage `Dockerfile`
- **Docker Compose** — orchestrates the full stack (backend, frontend, MongoDB) for both local development and production
- **DigitalOcean** — deployed on a droplet running the containerized stack

## Prerequisites

- Bun installed: https://bun.sh
- Docker & Docker Compose (for containerized development)
- Git

## Quick start (local)

Backend (development):

```bash
cd backend
bun install
bun run dev
```

Frontend (development):

```bash
cd frontend
bun install
bun run dev
```

Docker compose (build and run services):

```bash
docker compose up --build
```

## Repository layout

- `backend/` — Bun + TypeScript API server, database layer, auth, and routes
- `frontend/` — Vite + React app with Radix UI components
