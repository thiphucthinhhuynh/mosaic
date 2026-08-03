# Project Setup

**Status:** verified as of Milestone 1 (Database Foundation & User Model). The steps below are the real, tested setup flow.

**One caveat, stated plainly:** the sandbox this milestone was implemented in did not have Docker available, so `docker compose up` itself was not executed directly. Every other step below — migrations, seeding, the running API, the test suite — was verified against a real (not mocked) PostgreSQL server using the exact same credentials `docker-compose.yml` produces. If you're following these steps with real Docker, `docker compose up -d` should produce an equivalent database; if something doesn't match, that's the one part of this doc that's inferred rather than directly confirmed.

## Prerequisites

| Tool                    | Required version          | Notes                                                                                        |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| Node.js                 | 20.x LTS or newer         | Pinned in `.nvmrc` — run `nvm use` after cloning.                                            |
| npm                     | 10.x (ships with Node 20) | Used for workspace management (npm workspaces) — no separate package manager install needed. |
| Docker & Docker Compose | Recent stable             | Runs PostgreSQL locally (both the dev and test databases — see below).                       |
| Git                     | Any recent version        | —                                                                                            |

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
│       └── prisma/         # schema.prisma, migrations/, seed.ts
├── packages/
│   └── shared/    # Types shared by both apps (Zod schemas arrive in Milestone 2)
├── docker/postgres-init/   # runs once, on first container init — creates the mosaic_test DB
├── docker-compose.yml      # PostgreSQL service (dev + test databases)
├── .github/workflows/ci.yml
└── docs/
```

Prisma lives inside `apps/api` (not at the repo root) — it's exclusively a backend concern, and `prisma migrate`/`generate` commands need `apps/api` as their working directory to find `prisma.config.ts` by default. An earlier sketch of this layout in this doc showed `prisma/` at the repo root; that was corrected once Prisma was actually wired up, for this reason.

## Local Setup

1. Clone the repository and run `nvm use` (or otherwise ensure Node 20+ is active).
2. `npm install` at the repo root — installs dependencies for all three workspaces in one step.
3. Copy environment templates:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
   Required backend variables (including `DATABASE_URL`) are validated with Zod at process startup (`apps/api/src/config/env.ts`) — the API refuses to start if one is missing or malformed. See [docs/architecture.md](../architecture.md) §14.
4. `docker compose up -d` — starts PostgreSQL. On first run, an init script creates two databases: `mosaic` (dev) and `mosaic_test` (integration tests) — see `docker/postgres-init/`.
5. Apply migrations and seed the dev database:
   ```bash
   npm run db:migrate -w @mosaic/api
   npm run db:seed -w @mosaic/api
   ```
6. `npm run dev` — starts `apps/api` (port 4000) and `apps/web` (port 5173) concurrently.
7. Open `http://localhost:5173` — the page fetches `GET /api/v1/health` and displays the live backend status. Try `http://localhost:4000/api/v1/users/<id>` with one of the seeded users' ids (query them via `psql` or `prisma studio`) to see the data layer working end-to-end.

## Running Tests

Integration tests hit a real second database (`mosaic_test`), kept separate from dev data:

```bash
cp apps/api/.env.test.example apps/api/.env.test   # once
npm run db:test:migrate -w @mosaic/api             # applies migrations to mosaic_test
npm run test                                        # from repo root, or `npm run test -w @mosaic/api`
```

Vitest sets `NODE_ENV=test` automatically, which is what makes `apps/api/src/config/env.ts` load `.env.test` instead of `.env` — no extra flags needed.

## Other Useful Scripts

**From the repo root:**

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run lint`         | ESLint across the whole repo                           |
| `npm run lint:fix`     | Same, applying safe auto-fixes                         |
| `npm run format`       | Prettier, writes changes                               |
| `npm run format:check` | Prettier, check-only (what CI runs)                    |
| `npm run typecheck`    | `tsc` across `packages/shared`, `apps/api`, `apps/web` |
| `npm run test`         | Runs `apps/api`'s test suite (Vitest)                  |
| `npm run build`        | Production build for `apps/api` and `apps/web`         |

**From `apps/api` (or with `-w @mosaic/api` from the root):**

| Command                     | What it does                                                               |
| --------------------------- | -------------------------------------------------------------------------- |
| `npm run db:generate`       | Regenerates the Prisma client from `schema.prisma`                         |
| `npm run db:migrate`        | Creates and applies a new migration against the dev database (interactive) |
| `npm run db:migrate:deploy` | Applies existing migrations non-interactively (what CI runs)               |
| `npm run db:seed`           | Runs `prisma/seed.ts` against the dev database                             |
| `npm run db:test:migrate`   | Applies existing migrations against the **test** database                  |
| `npm run test:watch`        | Vitest in watch mode                                                       |

Pre-commit (Husky + lint-staged) automatically lints and formats staged files; commit messages are checked against [Conventional Commits](https://www.conventionalcommits.org/) by commitlint. See [docs/development/git-workflow.md](git-workflow.md).

## Environment Variables

**`apps/api/.env`**

| Variable       | Purpose                               | Default in `.env.example`                          |
| -------------- | ------------------------------------- | -------------------------------------------------- |
| `NODE_ENV`     | `development` / `test` / `production` | `development`                                      |
| `PORT`         | API server port                       | `4000`                                             |
| `CORS_ORIGIN`  | Allowlisted frontend origin           | `http://localhost:5173`                            |
| `DATABASE_URL` | Postgres connection string            | `postgresql://mosaic:mosaic@localhost:5432/mosaic` |

**`apps/api/.env.test`** (copy from `.env.test.example`) — same shape; `DATABASE_URL` points at `mosaic_test` instead.

**`apps/web/.env`**

| Variable       | Purpose                     | Default in `.env.example` |
| -------------- | --------------------------- | ------------------------- |
| `VITE_API_URL` | Base URL the frontend calls | `http://localhost:4000`   |

`JWT_SECRET` is **not yet used** — it arrives in Milestone 2 (auth), in the same PR that introduces the code that reads it.
