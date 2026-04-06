# Job Tracker

Lightweight job-application tracker built with Bun + TypeScript backend and React frontend. This repo is a monorepo skeleton for a learning/project starter: it includes `backend/` and `frontend/` folders, a development plan (`PLAN.md`), and Docker-friendly configs.

## Tech stack

- Runtime & package manager: Bun
- Backend: TypeScript, Hono, MongoDB (raw driver)
- Frontend: React + Vite + TypeScript, Radix UI + Tailwind CSS
- Testing: Vitest
- Containerization: Docker / Docker Compose (planned)

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

- `backend/` — Bun + TypeScript API server, database layer, migrations
- `frontend/` — Vite + React app using ShadeCDN components
- `PLAN.md` — high-level roadmap and development plan
- `.gitignore`, `README.md`

## Next steps

- Scaffold `backend/` and `frontend/` directories with starter `package.json`, `tsconfig.json`, and `Dockerfile`s.
- Implement authentication, basic Jobs CRUD, and a simple React list/detail UI.

If you'd like, I can scaffold the monorepo now (create `backend/` and `frontend/` skeletons and Dockerfiles). Reply with **"scaffold monorepo"** to start.
