# Project Setup

**Status:** verified as of Milestone 0 (Project Bootstrap & Engineering Foundation). The steps below are the real, tested setup flow — not a plan.

## Prerequisites

| Tool                    | Required version          | Notes                                                                                                          |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Node.js                 | 20.x LTS or newer         | Pinned in `.nvmrc` — run `nvm use` after cloning.                                                              |
| npm                     | 10.x (ships with Node 20) | Used for workspace management (npm workspaces) — no separate package manager install needed.                   |
| Docker & Docker Compose | Recent stable             | Runs PostgreSQL locally. Not required to run Milestone 0's health check, but installed for Milestone 1 onward. |
| Git                     | Any recent version        | —                                                                                                              |

## Why npm workspaces (not pnpm/yarn)

The monorepo structure was decided in [ADR-001](../adr/ADR-001-monorepo.md); the package manager itself is a smaller, implementation-level extension of that decision rather than a separate architectural choice. npm workspaces is used because:

- It ships with Node — no extra global install for anyone cloning the repo.
- The monorepo has exactly two apps and one shared package — not the scale (hundreds of packages) where pnpm's stricter dependency isolation or disk-space savings would matter.

If workspace install times or phantom-dependency issues become a real problem later, switching to pnpm is a low-cost, well-justified change at that point — not a default.

## Repository Layout

See [docs/architecture.md](../architecture.md) §2 and §6 for the full rationale; the current top-level shape:

```
mosaic/
├── apps/
│   ├── web/       # React + TypeScript + Vite frontend
│   └── api/       # Express + TypeScript backend
├── packages/
│   └── shared/    # Types shared by both apps (Zod schemas arrive in Milestone 2)
├── docker-compose.yml  # PostgreSQL service — not yet consumed by the app (Milestone 1)
├── .github/workflows/ci.yml
└── docs/
```

`prisma/` does not exist yet — it's introduced in Milestone 1 along with the first database schema.

## Local Setup

1. Clone the repository and run `nvm use` (or otherwise ensure Node 20+ is active).
2. `npm install` at the repo root — installs dependencies for all three workspaces in one step.
3. Copy environment templates:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
   Required backend variables are validated with Zod at process startup (`apps/api/src/config/env.ts`) — the API refuses to start if one is missing or malformed. See [docs/architecture.md](../architecture.md) §14.
4. `npm run dev` — starts `apps/api` (port 4000) and `apps/web` (port 5173) concurrently.
5. Open `http://localhost:5173` — the page fetches `GET /api/v1/health` and displays the live backend status.

`docker compose up -d` starts a local PostgreSQL container, but nothing in the app connects to it yet — that wiring is Milestone 1's job. It's included now so Milestone 1 doesn't need any new infrastructure setup, only application code.

## Other Useful Scripts (run from the repo root)

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run lint`         | ESLint across the whole repo                           |
| `npm run lint:fix`     | Same, applying safe auto-fixes                         |
| `npm run format`       | Prettier, writes changes                               |
| `npm run format:check` | Prettier, check-only (what CI runs)                    |
| `npm run typecheck`    | `tsc` across `packages/shared`, `apps/api`, `apps/web` |
| `npm run build`        | Production build for `apps/api` and `apps/web`         |

Pre-commit (Husky + lint-staged) automatically lints and formats staged files; commit messages are checked against [Conventional Commits](https://www.conventionalcommits.org/) by commitlint. See [docs/development/git-workflow.md](git-workflow.md).

## Environment Variables

**`apps/api/.env`**

| Variable      | Purpose                               | Default in `.env.example` |
| ------------- | ------------------------------------- | ------------------------- |
| `NODE_ENV`    | `development` / `test` / `production` | `development`             |
| `PORT`        | API server port                       | `4000`                    |
| `CORS_ORIGIN` | Allowlisted frontend origin           | `http://localhost:5173`   |

**`apps/web/.env`**

| Variable       | Purpose                     | Default in `.env.example` |
| -------------- | --------------------------- | ------------------------- |
| `VITE_API_URL` | Base URL the frontend calls | `http://localhost:4000`   |

`DATABASE_URL` and `JWT_SECRET` are **not yet used** — they'll be added to `apps/api/.env.example` in Milestone 1 (database) and Milestone 2 (auth) respectively, each in the same PR that introduces the code that reads them.
