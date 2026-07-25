# Project Setup

**Status:** planned — this describes the setup workflow Milestone 0 (Project Bootstrap) will implement. Commands here are not yet runnable; this document will be updated to reflect the real, verified steps as soon as Milestone 0 lands, per the project's documentation rules.

## Prerequisites

| Tool                    | Required version          | Notes                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js                 | 20.x LTS or newer         | The active Node version detected in this environment during setup was **16.20.1**, which is past end-of-life and does not support all tooling planned for this project (e.g. current Vite/Prisma major versions). Upgrade via `nvm install 20 && nvm use 20` before Milestone 0 begins. |
| npm                     | 10.x (ships with Node 20) | Used for workspace management (npm workspaces) — no separate package manager install needed.                                                                                                                                                                                            |
| Docker & Docker Compose | Recent stable             | Runs PostgreSQL locally; no local Postgres install required.                                                                                                                                                                                                                            |
| Git                     | Any recent version        | —                                                                                                                                                                                                                                                                                       |

## Why npm workspaces (not pnpm/yarn)

The monorepo structure was decided in [ADR-001](../adr/ADR-001-monorepo.md); the package manager itself is a smaller, implementation-level extension of that decision rather than a separate architectural choice. npm workspaces is used because:

- It ships with Node — no extra global install for anyone cloning the repo.
- The monorepo has exactly two apps and one shared package — not the scale (hundreds of packages) where pnpm's stricter dependency isolation or disk-space savings would matter.

If workspace install times or phantom-dependency issues become a real problem later, switching to pnpm is a low-cost, well-justified change at that point — not a default.

## Planned Repository Layout

See [docs/architecture.md](../architecture.md) §2 and §6 for the full rationale; the top-level shape:

```
mosaic/
├── apps/
│   ├── web/       # React frontend
│   └── api/       # Express backend
├── packages/
│   └── shared/    # Zod schemas, types, constants shared by both apps
├── prisma/        # schema.prisma, migrations, seed script
├── docker-compose.yml
└── docs/
```

## Planned Local Setup Steps (to be finalized in Milestone 0)

1. Clone the repository.
2. `npm install` at the repo root — installs dependencies for all workspaces in one step.
3. Copy environment templates: `cp apps/api/.env.example apps/api/.env` (and equivalent for `apps/web` if needed). Required variables are validated at process startup — see [docs/architecture.md](../architecture.md) §14.
4. `docker compose up -d` — starts the local PostgreSQL container.
5. `npm run prisma:migrate` (workspace script, exact name TBD in Milestone 0) — applies migrations.
6. `npm run prisma:seed` — seeds development data.
7. `npm run dev` — starts both `apps/api` and `apps/web` dev servers concurrently.

## Environment Variables (planned, per the approved architecture)

| Variable       | Used by  | Purpose                               |
| -------------- | -------- | ------------------------------------- |
| `DATABASE_URL` | api      | Postgres connection string            |
| `JWT_SECRET`   | api      | Signs/verifies the V1 auth token      |
| `PORT`         | api      | API server port                       |
| `CORS_ORIGIN`  | api      | Allowlisted frontend origin           |
| `NODE_ENV`     | api, web | `development` / `test` / `production` |
| `VITE_API_URL` | web      | Base URL the frontend calls           |

This table will be corrected against the real `.env.example` files once Milestone 0 ships — treat it as a preview, not a guarantee, until then.
