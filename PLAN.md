# Job Tracker — Development Plan

## Overview

- **Purpose:** Build a job-application tracker with a Bun-based Node.js backend and a React frontend using ShadeCDN components. The app will be containerized; only the web-facing proxy will be exposed publicly.
- **Primary goals:** Learn Bun, build a full-stack TypeScript app, and keep the architecture production-ready (Postgres, JWT auth, containerized services).

---

## High-level Goals

- Use `bun` as the package manager and runtime for backend tooling and build steps.
- Backend: TypeScript API server (REST) with Postgres and an ORM (recommended: Drizzle).
- Frontend: React + Vite + ShadeCDN components, TypeScript, SPA with `react-router`.
- Deployment: Docker Compose (or Kubernetes) where only the frontend proxy (nginx/Traefik) is public; backend and DB internal.

---

## Project Phases & Tasks

### Phase 0 — Project setup

- Init repository, branches (`main`, `dev`), `.gitignore`, `README.md`.
- Create a monorepo layout with two top-level folders: `backend/` and `frontend/`.
- Run `bun init` in each package and commit `bun.lockb`.
- Add `tsconfig.json`, `eslint`, and `prettier` configs.

### Phase 1 — Data model & API design

- Core entities: `User`, `Company`, `Job`, `Stage`, `Note`, `Contact`, `Tag`.
- Example `Job` fields: `id`, `userId`, `companyId`, `title`, `location`, `salaryRange`, `source`, `appliedAt`, `statusId`, `url`, `priority`, `createdAt`, `updatedAt`.
- REST endpoints (examples):
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`
  - `GET /api/jobs`, `POST /api/jobs`, `GET /api/jobs/:id`, `PUT /api/jobs/:id`, `DELETE /api/jobs/:id`
  - `GET /api/companies`, `POST /api/companies`, etc.
- DB recommendation: PostgreSQL + Drizzle ORM (migrations). Optionally evaluate Prisma for feature fit with Bun.

### Phase 2 — Backend scaffold

- Runtime: Bun + TypeScript.
- Framework: Minimal HTTP framework compatible with Bun (e.g., `hono`) or a small custom router.
- Validation: `zod` for schema validation.
- Auth: JWT stored in secure HTTP-only cookies, passwords hashed with `bcryptjs`.
- Project layout: `src/routes/`, `src/services/`, `src/db/`, `src/models/`, `src/middleware/`.
- Add health endpoints and basic logging.

### Phase 3 — Frontend scaffold

- Tooling: Vite + React + TypeScript (configured to work with Bun). Use `react-router`.
- UI: ShadeCDN components via CDN imports or package if available.
- Data fetching: React Query (or SWR) for server sync.
- Auth: Cookie-based JWT (HTTP-only) with protected routes and token refresh handling.
- Layout: `src/pages/`, `src/components/`, `src/api/`, `src/hooks/`.

### Phase 4 — Core features

- Register/login/logout flows and `GET /api/users/me`.
- Jobs CRUD with list, create, update, delete, status transitions.
- Companies & contacts with notes attached to jobs.
- Filtering/search (status, tags, date range, full-text search).
- Activity timeline per job (notes and status changes).

### Phase 5 — Tests & quality

- Unit tests: `vitest` for backend and frontend logic (works with Bun).
- API tests: integration tests hitting routes in a test harness.
- E2E (optional): Playwright or Cypress against a local compose stack.
- Linting/formatting: `eslint` + `prettier` + type checking in CI.

### Phase 6 — Containerization & networking

- Docker images:
  - `frontend`: build static assets, serve with `nginx` (public).
  - `backend`: Bun server image (internal service).
  - `db`: Postgres (internal).
- Use Docker Compose or K8s. Only the web proxy (nginx) is published to the host; it proxies `/api` to the backend service.
- Use multi-stage Dockerfiles to minimize image size.

### Phase 7 — CI/CD & deploy

- CI: GitHub Actions (install Bun in runner), run lint, tests, build artifacts.
- CD: Build and push images to a registry, deploy via Compose on a VPS or to Render/DigitalOcean/Cloud run.
- SSL: Terminate TLS at reverse proxy (Let's Encrypt via Certbot or Traefik).

### Phase 8 — Operations

- Monitoring: logs, health endpoint, optional Sentry integration.
- Backups: scheduled Postgres backups (cron or managed DB snapshots).
- Documentation: API docs (OpenAPI or simple markdown), ER diagram, `README.md` with local dev instructions.

---

## Recommended Repository Layout (monorepo)

- `package.json` (root orchestration scripts)
- `backend/`
  - `package.json`, `bun.lockb`, `src/`, `Dockerfile`
- `frontend/`
  - `package.json`, `bun.lockb`, `src/`, `vite.config.ts`, `Dockerfile`
- `docker-compose.yml`
- `PLAN.md` (this file)
- `README.md`

---

## Security & Operational Notes

- Keep Postgres and backend ports internal only; expose only the proxy.
- Use HTTP-only, Secure cookies for auth tokens and enable CSRF protections where needed.
- Rate-limit authentication endpoints and sensitive APIs.
- Hash passwords (bcrypt) and never store plaintext secrets.

---

## Minimal Local Dev Commands

Install Bun (if not present): follow https://bun.sh

Backend (from `backend/`):

```bash
cd backend
bun install
bun run dev
```

Frontend (from `frontend/`):

```bash
cd frontend
bun install
bun run dev
```

Docker Compose (example):

```bash
docker compose up --build
```

---

## Milestones (example timeline)

- Week 0: Repo + Bun scaffolds
- Week 1: DB schema + auth + basic API
- Week 2: Frontend pages + connect to API
- Week 3: Filters, notes, polish
- Week 4: Tests, Dockerize, deploy to staging

---

## Learning Resources

- Bun: https://bun.sh
- Drizzle ORM: https://drizzle.team
- Vite + React docs: https://vitejs.dev
- ShadeCDN docs: (see ShadeCDN website for usage and imports)
- Docker & Docker Compose docs

---

## Next steps

- I can scaffold the monorepo with `backend/` and `frontend/` folders, initial `package.json` and `Dockerfile`s, and a minimal API + frontend example. Reply with **"scaffold monorepo"** to start that.
