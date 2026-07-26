# Architecture

This document describes Mosaic's system design as currently approved. It reflects **only** decisions that have been agreed on — nothing here is aspirational or speculative beyond what is explicitly marked as a deferred/future item.

For the narrative reasoning (context, alternatives, trade-offs) behind the most significant decisions, see [docs/adr/](adr/README.md). This document is the current-state reference; the ADRs are the historical record of _why_.

## 1. Vision & Engineering Goals

Mosaic is a full-stack marketplace: users open stores, list items for sale, and build a social layer around them (likes, follows, reviews). The application itself is intentionally domain-scoped and not overbuilt — the engineering goal is to demonstrate:

- Deliberate architecture with documented trade-offs, not default/copied choices.
- A clean separation of concerns (presentation / business logic / data access).
- Type safety end-to-end (TypeScript on both frontend and backend, shared types/schemas).
- Automated testing as a first-class deliverable, not an afterthought.
- Security and correctness treated as requirements, not polish.
- Documentation that stays truthful to the code at every stage of delivery.

## 2. System Architecture

Mosaic is a **monolithic 3-tier application** organized as a **monorepo**:

```
┌─────────────────┐      HTTPS/REST      ┌──────────────────┐      SQL      ┌────────────┐
│  apps/web        │ ───────────────────▶ │  apps/api         │ ─────────────▶│ PostgreSQL │
│  React SPA        │ ◀─────────────────── │  Express + Prisma │ ◀─────────────│            │
└─────────────────┘                        └──────────────────┘                └────────────┘
        │                                            │
        └──────────────── packages/shared ───────────┘
           (Zod schemas, TypeScript types, constants)
```

- **Presentation tier** — React single-page application (`apps/web`).
- **Application/business tier** — Express API (`apps/api`), layered internally (see §5).
- **Data tier** — PostgreSQL, accessed exclusively through Prisma from the API layer. The frontend never talks to the database directly.
- **Shared tier** — `packages/shared` holds validation schemas, types, and constants consumed by both apps, so a single definition (e.g. "what a valid item price looks like") can't drift between frontend and backend.

See [ADR-001](adr/ADR-001-monorepo.md) for why a monorepo was chosen over separate repositories.

## 3. Tech Stack

| Concern                     | Choice                                                       | Notes                                        |
| --------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Frontend framework          | React + TypeScript                                           | Vite as build tool/dev server                |
| Server state                | TanStack Query                                               | Caching, loading/error state for API calls   |
| Forms & validation (client) | React Hook Form + Zod                                        | Shared Zod schemas with the backend          |
| Styling                     | Tailwind CSS                                                 | Utility-first, no separate CSS-in-JS runtime |
| Backend framework           | Express 5 + TypeScript                                       | Layered internally, see §5                   |
| ORM / Database              | Prisma + PostgreSQL                                          | See [ADR-003](adr/ADR-003-prisma.md)         |
| Auth                        | bcrypt (hashing) + JWT (httpOnly cookie)                     | V1 scope — see §7                            |
| Logging                     | Pino                                                         | Structured JSON logs                         |
| API style                   | REST, versioned (`/api/v1`)                                  | See [ADR-002](adr/ADR-002-rest-api.md)       |
| Local infra                 | Docker Compose                                               | PostgreSQL container for local dev           |
| CI/CD                       | GitHub Actions                                               | Lint, typecheck, test, build, deploy         |
| Hosting                     | Vercel (web), Render/Railway (api), Neon/Supabase (Postgres) | See §16                                      |

## 4. Frontend Architecture

`apps/web` is organized by **feature/domain**, not by technical layer:

```
apps/web/src/
├── features/         # auth, stores, items, likes, follows, reviews
│   └── items/
│       ├── index.ts  # barrel — public surface of this feature
│       ├── ...
├── components/        # shared, feature-agnostic UI components
├── lib/                # API client, TanStack Query client, generic utils
└── routes/             # route definitions/pages
```

- **Server state** (anything from the API) is owned by TanStack Query — no server data is duplicated into component state or a global store.
- **Client-only UI state** (e.g. modal open/closed) stays local via `useState`/context; no Redux — the app has no state complex enough to justify it.
- **Forms** use React Hook Form with a Zod resolver, using the _same_ Zod schema the backend validates against (imported from `packages/shared`).
- **Routing** via React Router; a `ProtectedRoute` wrapper enforces the Authenticated tier (§8) client-side, mirroring — never replacing — the server-side check.

See [ADR-004](adr/ADR-004-feature-based-architecture.md) for why feature-based folders were chosen over layer-based ones, and why barrel exports (`index.ts`) are used as explicit module boundaries.

## 5. Backend Architecture

`apps/api` is layered per request lifecycle:

```
routes → controllers → services → repositories → Prisma → PostgreSQL
```

- **Routes** — declare HTTP method + path + middleware chain (`requireAuth`, `requireOwnership`, validation), delegate to a controller.
- **Controllers** — translate HTTP in/out (parse request, call a service, shape the response via the API response helper). No business logic lives here.
- **Services** — business logic and orchestration. Framework-agnostic — no `req`/`res` objects reach this layer, which is what makes services unit-testable in isolation.
- **Repositories** — the only layer that imports Prisma directly. Isolating the ORM behind repositories means a future swap (unlikely, but structurally possible) wouldn't ripple through business logic.

Organized by domain module (mirroring the frontend):

```
apps/api/src/
├── modules/
│   └── items/
│       ├── items.routes.ts
│       ├── items.controller.ts
│       ├── items.service.ts
│       ├── items.repository.ts
│       ├── items.schema.ts   # Zod request/response schemas
│       └── index.ts          # barrel
├── middleware/                # requireAuth, requireOwnership, errorHandler, asyncHandler
├── lib/                        # response.ts, logger.ts (pino)
└── config/                     # env loading/validation
```

## 6. Authentication Strategy (V1)

**Decision:** email/password signup and login. Passwords hashed with **bcrypt**. On successful login, a single **JWT access token** is issued and delivered as an `httpOnly`, `Secure`, `SameSite=Lax` cookie. Logout clears the cookie client-side.

**V1 scope — deliberately excludes:**

- Refresh tokens / rotation. The access token is the only credential; its lifetime (e.g. 7 days) is set long enough to be usable without a refresh flow.
- Server-side revocation. Because there is no refresh-token table yet, there is no way to force-invalidate a still-valid token before it expires (e.g. on logout or account compromise). This is an accepted, explicit limitation of V1, not an oversight.

**Planned V2 addition:** short-lived access token + rotating refresh token with a `refresh_tokens` table enabling real server-side revocation. Tracked as a dedicated milestone in [docs/roadmap.md](roadmap.md) — not built until then.

## 7. Authorization Strategy (V1)

Three tiers only:

| Tier                   | Applies to                            | Enforcement                                                                             |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------------------------- |
| **Guest**              | Anyone, unauthenticated               | Default — public reads (browsing stores/items/reviews)                                  |
| **Authenticated User** | Any logged-in user                    | `requireAuth` middleware — valid JWT cookie required                                    |
| **Resource Ownership** | The specific user who owns a resource | `requireOwnership` middleware — loads the resource, compares its owner to `req.user.id` |

**Deliberately excluded from V1:** role-based access control (admin/moderator roles). The current feature set has no admin-only capability, so adding a `role` column and RBAC middleware now would be speculative complexity with no corresponding use case. If a genuine admin need arises, it will be introduced as its own milestone with its own ADR — not designed in advance of the need.

## 8. API Design

- REST over HTTPS, versioned under `/api/v1`.
- Resource-oriented routes, nesting reflects real ownership (`/stores/:storeId/items`).
- Every response uses a consistent envelope (`{ data, error, meta }`) produced by a shared response helper — see [docs/development/coding-standards.md](development/coding-standards.md).
- List endpoints support pagination via query parameters.
- A small number of deliberate aggregate endpoints (e.g. a combined profile view) are allowed where strict REST would otherwise force the frontend into a request waterfall — each such exception is called out explicitly where it's introduced.
- Endpoint contracts are documented per domain under `docs/api/` as they're implemented; see [docs/api/authentication.md](api/authentication.md) for the first one.

See [ADR-002](adr/ADR-002-rest-api.md) for why REST was chosen over GraphQL/tRPC.

## 9. Database Design

PostgreSQL, accessed via Prisma. The schema is introduced **incrementally**, one migration per feature milestone, rather than all at once — this keeps each migration reviewable and mirrors how a real feature branch would evolve the schema.

Core entities (introduced across milestones, see [docs/roadmap.md](roadmap.md)):

```
User        (id, username, email, password_hash, profile_pic, timestamps)
Store       (id, owner_id → User, name, description, location, timestamps)
Item        (id, store_id → Store, name, description, price, quantity, category, timestamps)
ItemImage   (id, item_id → Item, url)
Like        (id, user_id → User, item_id → Item, unique(user_id, item_id))
Follow      (id, follower_id → User, followee_id → User, unique(follower_id, followee_id))
Review      (id, user_id → User, store_id → Store, stars, body, timestamps, unique(user_id, store_id))
```

Not yet in the schema (planned, not built): `refresh_tokens` (V2 auth), any `role` column on `User` (only if/when RBAC becomes necessary).

See [ADR-003](adr/ADR-003-prisma.md) for why Prisma was chosen over Sequelize/Drizzle/TypeORM.

## 10. Security Practices

Applied progressively as milestones land (see [docs/roadmap.md](roadmap.md) for exactly which milestone introduces each):

- `helmet` for HTTP security headers.
- Explicit CORS allowlist — never `*`.
- Rate limiting on authentication endpoints.
- CSRF protection appropriate to cookie-based auth (double-submit or equivalent).
- All input validated at the API boundary before reaching business logic (see §12).
- Parameterized queries only — enforced structurally by using Prisma, never raw string SQL.
- Secrets never committed; loaded from environment variables, validated at process startup (see §14).
- Dependency vulnerability scanning in CI (`npm audit` / Dependabot).
- Least-privilege database role for the application.

## 11. Error Handling

- A centralized Express error-handling middleware is the single place that maps errors to HTTP responses.
- A small `AppError` class hierarchy (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`) is thrown from services — services never construct HTTP responses themselves.
- Every async route handler is wrapped by a shared `asyncHandler` utility so a rejected promise always reaches the centralized handler. Mosaic runs on Express 5, which already forwards rejected-promise errors from handlers to `next()` natively — `asyncHandler` is kept anyway as an explicit, framework-independent convention, not because it's strictly required for correctness on this specific Express version.
- Stack traces are logged server-side only; client-facing error responses never leak internals in production.

## 12. Validation Strategy

- Zod schemas define validation rules **and** TypeScript types together (`z.infer`), living in `packages/shared` so frontend and backend validate against the exact same definition.
- Validation runs at the API boundary (route middleware), before a request reaches a controller or service.
- Frontend forms use the same schemas via React Hook Form's Zod resolver for pre-submit UX — but the backend check is what's actually trusted; the client-side check is a UX convenience, never a security boundary.

## 13. Logging (V1)

- `pino` for structured JSON logs at the application level: startup/shutdown, database connectivity, and every error caught by the centralized error handler, each with a level (`info`/`warn`/`error`) and relevant context.
- **Not yet included:** per-request correlation IDs (`pino-http` + propagation through service calls). This is a deliberate V1 simplification — logs are structured but not yet traceable end-to-end across a single request. Planned as its own milestone (see [docs/roadmap.md](roadmap.md)).

## 14. Environment Configuration

- `.env` files per environment; the real production file is never committed.
- All required environment variables are validated against a Zod schema at process startup — the app fails fast with a clear error rather than failing mysteriously mid-request if a variable is missing or malformed.
- Production secrets are supplied via the hosting platform's environment variable storage (Vercel/Render/Railway), not a separate secrets manager — appropriate at this project's scale.

## 15. Testing Strategy (V1)

Two layers in V1:

- **Unit tests** (Vitest) — services, utilities, Zod schemas, isolated React hooks/components.
- **Integration tests** (Vitest + Supertest) — full route → middleware → service → real test-database round trips, covering auth, ownership, and validation for every module.

**Not yet included:** end-to-end browser tests (Playwright). Deferred until the UI and core flows are stable enough that E2E tests won't be rewritten as the UI churns — tracked as its own milestone.

CI blocks merges on failing tests. Coverage is tracked but not enforced as a hard gate — testing the actual risk areas (auth, ownership, validation boundaries) matters more than a coverage percentage.

## 16. Deployment Strategy

- **Local development:** Docker Compose runs PostgreSQL; both apps run via their dev servers against it.
- **CI:** GitHub Actions runs lint → typecheck → test → build on every pull request; merge is blocked on failure.
- **CD:** on merge to `main`, the frontend deploys to Vercel and the backend to Render or Railway; the database is managed PostgreSQL (Neon or Supabase). Database migrations run as an explicit deploy step.
- A post-deploy smoke test (`GET /api/v1/health`) confirms a deploy succeeded.

## 17. Developer Tooling & Conventions

- **ESLint + Prettier** — linting and formatting, wired together via `eslint-config-prettier` so they never conflict.
- **Husky + lint-staged** — pre-commit hook lints/formats only staged files.
- **Conventional Commits**, enforced via `commitlint` in a `commit-msg` hook.
- **Absolute imports** via `tsconfig` path aliases (`@/features/*`, `@shared/*`).
- **Barrel exports** (`index.ts`) as the explicit public surface of each feature/module.
- **API response helper** — standardizes the `{ data, error, meta }` envelope.
- **Async error wrapper** — `asyncHandler` around every async controller.
- **Shared constants & types** — `packages/shared/constants` and `packages/shared/types`, single source of truth across both apps.
- **.editorconfig** — baseline formatting consistency for files Prettier doesn't cover.

Full conventions are documented in [docs/development/coding-standards.md](development/coding-standards.md).

## 18. Versioning Note: V1 vs. V2

This document describes **V1 scope** as currently approved. Several items are intentionally deferred rather than omitted by oversight:

| Deferred item                       | Reason                                                                                     | Tracked in                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Refresh token rotation + revocation | Simpler auth flow ships first, correctly, before adding rotation complexity                | [docs/roadmap.md](roadmap.md)                    |
| Admin RBAC                          | No current use case; avoiding speculative design (YAGNI)                                   | [docs/roadmap.md](roadmap.md) (optional/stretch) |
| Request-ID log correlation          | Structured logging ships first; correlation is a deliberate follow-up                      | [docs/roadmap.md](roadmap.md)                    |
| Playwright E2E tests                | Deferred until UI/flows stabilize, to avoid rewriting brittle tests during active UI churn | [docs/roadmap.md](roadmap.md)                    |

When any of these are implemented, this document will be updated in the same milestone as the code, per the project's documentation rules.

## 19. Implementation Notes

Details discovered while building, worth recording so this document stays accurate rather than aspirational:

- **Express 5, not 4.** The version resolved at install time was Express 5, which changes one thing this document originally assumed: Express 5 natively forwards a rejected promise from an async handler to `next(err)`. The `asyncHandler` wrapper described in §11 and §17 is kept regardless, as an explicit, framework-independent convention — but it is no longer strictly required for correctness on this specific Express version, and that distinction matters if the team ever debates removing it.
- **`packages/shared` is currently type-only.** Its first contents (the response envelope and `HealthStatus` types) are pure TypeScript types with no runtime code, consumed via `import type`. This means no build step exists for it yet — the package's `exports` field points straight at its TypeScript source, which is valid only because nothing at runtime actually imports from it. Milestone 2 introduces the first _runtime_ shared code (Zod schemas), at which point this package needs either a real build step or dev/prod conditional exports — that decision is deferred to when it's actually needed, not designed speculatively now.
- **TypeScript path aliases (`@/*`) resolve differently per tool**, all pointed at the same `tsconfig.json` `paths` entries: Vite resolves them via `resolve.alias` in `vite.config.ts`; `tsx` (used for the API's dev server) resolves `tsconfig` `paths` natively. Compiled output (`apps/api`'s `tsc` build) does not rewrite these aliases — this is a known, accepted gap since nothing currently executes that compiled output (the API runs via `tsx` in both dev and, for now, would in production too). Milestone 11 (CI/CD & Deployment) is where the real production run strategy — continue with `tsx`, or add a compile step with alias-rewriting — gets decided with actual deployment constraints in hand.
