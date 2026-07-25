# Roadmap

Mosaic is delivered one milestone at a time. Each milestone is scoped to roughly 1–3 coding sessions, builds only on what came before it, and is not started until the previous one is reviewed and approved. See [docs/development/git-workflow.md](development/git-workflow.md) for how each milestone maps to branches/PRs.

**Status legend:** ⬜ Not Started · 🟨 In Progress · ✅ Done

Documentation (this file, `architecture.md`, relevant `docs/api/*`, and any new ADRs) is updated as part of completing a milestone, not after the fact — a milestone's status only moves to ✅ once its docs match its code.

## Overview

| #   | Milestone                                      | Phase                     | Status |
| --- | ---------------------------------------------- | ------------------------- | ------ |
| 0   | Project Bootstrap & Engineering Foundation     | Foundation                | 🟨     |
| 1   | Database Foundation & User Model               | Foundation                | ⬜     |
| 2   | Auth: Signup & Login                           | MVP                       | ⬜     |
| 3   | Store CRUD (Ownership Authorization)           | MVP                       | ⬜     |
| 4   | Item CRUD & Item Images                        | MVP                       | ⬜     |
| 5   | Search & Filtering                             | MVP                       | ⬜     |
| 6   | Social Interactions: Likes & Follows           | MVP                       | ⬜     |
| 7   | Reviews                                        | MVP                       | ⬜     |
| 8   | Frontend Cohesion & Profile Pages              | MVP                       | ⬜     |
| 9   | Testing Hardening                              | Production-readiness      | ⬜     |
| 10  | Security & Production Hardening                | Production-readiness      | ⬜     |
| 11  | CI/CD Pipeline & Deployment                    | Production-readiness      | ⬜     |
| 12  | Observability: Logging & Request Tracing       | Production-readiness (V2) | ⬜     |
| 13  | Auth V2: Refresh Token Rotation                | Production-readiness (V2) | ⬜     |
| 14  | E2E Testing with Playwright                    | Production-readiness (V2) | ⬜     |
| 15  | Production Readiness Review (Launch Checklist) | Launch                    | ⬜     |

---

### Milestone 0 — Project Bootstrap & Engineering Foundation

**Status:** 🟨 In Progress
**Goal:** Stand up the monorepo, every piece of engineering tooling the project has committed to, and a walking skeleton proving the full stack + CI wiring works — before any real feature exists.
**Features:** health-check endpoint; React page that calls it and displays live backend status.
**Database changes:** none. No Prisma, no schema — the database layer is Milestone 1's job.
**API endpoints:** `GET /api/v1/health`
**Frontend pages:** single page showing API connectivity status.
**Technical concepts introduced:** npm workspaces monorepo (`apps/web`, `apps/api`, `packages/shared`), TypeScript project setup for both apps, Vite, Express, ESLint (flat config) + Prettier, Husky + lint-staged, commitlint (Conventional Commits), .editorconfig, .gitignore, Docker Compose (PostgreSQL service, not yet consumed by the app), GitHub Actions CI (lint → typecheck → build), API response helper, async error wrapper, absolute import aliases.
**Definition of Done:** fresh clone + `npm install` + `npm run dev` runs both apps; CI is green on a PR (lint, typecheck, build); frontend displays live backend health status; a badly-formatted file or non-conventional commit message is blocked locally by hooks; `.env.example` and `.gitignore` are present and accurate.

---

### Milestone 1 — Database Foundation & User Model

**Status:** ⬜ Not Started
**Goal:** Introduce Postgres + Prisma and the first entity, with migrations and seeding — no auth logic yet, just the data layer.
**Features:** Prisma schema, seed script with fake users.
**Database changes:** create `users` table (id, username, email, password_hash, profile_pic, timestamps) with unique constraints on username/email.
**API endpoints:** `GET /api/v1/users/:id` (public shape only — no password_hash/email) as a proof-of-life read.
**Frontend pages:** none.
**Technical concepts introduced:** Prisma schema modeling, migrations, seeding, repository pattern, Docker Compose Postgres service, API response helper used for the first time.
**Definition of Done:** `docker compose up` gives a working Postgres; `prisma migrate dev` + seed populates data; an integration test confirms the endpoint never leaks `password_hash`; CI runs this test against a real DB service container.

---

### Milestone 2 — Auth: Signup & Login

**Status:** ⬜ Not Started
**Goal:** Registration and login per the V1 auth strategy (bcrypt + single JWT cookie, no refresh yet).
**Features:** signup, login, logout, get-current-user.
**Database changes:** none (schema already in place from Milestone 1).
**API endpoints:** `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` — contract documented in [docs/api/authentication.md](api/authentication.md).
**Frontend pages:** Signup page, Login page, auth context/hook, protected-route wrapper, nav shows logged-in state.
**Technical concepts introduced:** bcrypt hashing, JWT sign/verify, httpOnly cookies, Zod schemas from the shared package, centralized error handler + `AppError` classes, async error wrapper, `requireAuth` middleware, React Hook Form + Zod resolver, TanStack Query mutations.
**Definition of Done:** signup → login → page refresh keeps the session; logout clears it; duplicate email and wrong password return correctly-shaped errors; integration tests cover happy path + each validation/error case; unit tests cover the hashing and JWT helpers directly.

---

### Milestone 3 — Store CRUD (Ownership Authorization)

**Status:** ⬜ Not Started
**Goal:** Users create and manage their own store(s); introduces the Ownership authorization tier.
**Features:** create store, browse all stores (guest), view store detail (guest), update/delete own store.
**Database changes:** create `stores` table (owner_id FK → users, name, description, location, timestamps).
**API endpoints:** `GET /api/v1/stores`, `GET /api/v1/stores/:id`, `POST /api/v1/stores` (auth), `PUT /api/v1/stores/:id` (owner), `DELETE /api/v1/stores/:id` (owner), `GET /api/v1/users/me/stores` (auth)
**Frontend pages:** Stores listing, Store detail, Create Store form, Edit Store form, delete confirmation.
**Technical concepts introduced:** `requireOwnership` middleware pattern with a resource loader, nested-resource REST design, Prisma relation queries, pagination on a list endpoint.
**Definition of Done:** guests browse without auth; only the owner can edit/delete (403 otherwise, explicitly tested); list pagination works; barrel export (`index.ts`) established for this module as the template for the rest.

---

### Milestone 4 — Item CRUD & Item Images

**Status:** ⬜ Not Started
**Goal:** Items nested under stores, with owner-only mutations derived through the store relationship.
**Features:** create/read/update/delete items within a store, with associated images.
**Database changes:** create `items` table (store_id FK, name, description, price, quantity, category), `item_images` table (item_id FK, url).
**API endpoints:** `GET /api/v1/stores/:storeId/items`, `GET /api/v1/items/:id`, `POST /api/v1/stores/:storeId/items` (owner), `PUT /api/v1/items/:id` (owner), `DELETE /api/v1/items/:id` (owner)
**Frontend pages:** Item list within a store, Item detail page, Create/Edit item form (image as URL input, not file upload).
**Technical concepts introduced:** ownership check through a relation (item's owner = its store's owner, not a direct FK), transactional multi-row create (item + images together), Decimal handling for price.
**Definition of Done:** full item CRUD works with ownership enforced through the store; integration test explicitly proves "user B cannot edit user A's item via user A's store"; negative price/quantity rejected by validation and tested.

---

### Milestone 5 — Search & Filtering

**Status:** ⬜ Not Started
**Goal:** Make items discoverable.
**Features:** search by name, filter by category, sort by price.
**Database changes:** migration adding an index on `items.category` and a trigram/full-text index on `items.name` (Postgres `pg_trgm`) — no new tables.
**API endpoints:** extend `GET /api/v1/items` with `?search=`, `?category=`, `?sort=`, `?page=`
**Frontend pages:** search bar + category filter, reusing the existing item list UI.
**Technical concepts introduced:** query-param validation with Zod, basic Postgres indexing/`EXPLAIN`, debounced search input, TanStack Query key design for filtered/paginated queries.
**Definition of Done:** search, category filter, and sort combine correctly; each param and their combinations covered by integration tests; empty-result state handled on the frontend; seeded dataset large enough (~100+ items) to make the index meaningful.

---

### Milestone 6 — Social Interactions: Likes & Follows

**Status:** ⬜ Not Started
**Goal:** Add the two relationship-style features.
**Features:** like/unlike items, follow/unfollow users.
**Database changes:** create `likes` table (user_id, item_id, unique constraint), `follows` table (follower_id, followee_id, unique constraint, follower ≠ followee).
**API endpoints:** `POST/DELETE /api/v1/items/:id/likes`, `GET /api/v1/items/:id/likes`, `POST/DELETE /api/v1/users/:id/follow`, `GET /api/v1/users/:id/followers`, `GET /api/v1/users/:id/following`
**Frontend pages:** Like button (optimistic), Follow button (optimistic), Followers/Following lists.
**Technical concepts introduced:** unique-constraint-as-business-rule, idempotent toggle endpoints, optimistic UI updates + rollback with TanStack Query, self-follow prevention.
**Definition of Done:** double-clicking like/follow doesn't error or duplicate; self-follow rejected and tested; a forced failed request rolls the optimistic UI back correctly; constraint violations return a clean 409, not a raw DB error.

---

### Milestone 7 — Reviews

**Status:** ⬜ Not Started
**Goal:** Users review stores (rating + text), distinct from store ownership.
**Features:** create/edit/delete a review, view a store's reviews and average rating.
**Database changes:** create `reviews` table (user_id, store_id, stars, body, timestamps, unique on user_id+store_id — one review per user per store).
**API endpoints:** `GET /api/v1/stores/:id/reviews`, `POST /api/v1/stores/:id/reviews` (auth), `PUT /api/v1/reviews/:id` (review author), `DELETE /api/v1/reviews/:id` (review author)
**Frontend pages:** Reviews list + average rating on store detail, review form, edit/delete own review.
**Technical concepts introduced:** aggregate queries (average stars via Prisma `aggregate`), a second distinct "ownership" concept in the same app (review-author ownership vs. store ownership).
**Definition of Done:** average rating updates correctly after each review; duplicate review by the same user on the same store rejected; users can only edit/delete their own review (tested); store detail page composes items + reviews + owner info together.

---

### Milestone 8 — Frontend Cohesion & Profile Pages

**Status:** ⬜ Not Started
**Goal:** No new backend features — tie the app together into something that feels finished. This milestone completes the MVP.
**Features:** profile page (own stores, liked items, followers/following in tabs), global nav, consistent loading/error/empty states, responsive pass.
**Database changes:** none.
**API endpoints:** one aggregate `GET /api/v1/users/:id/profile` combining profile + stores + counts, a deliberate trade-off of REST purity for fewer round trips (see [docs/architecture.md](architecture.md), §8).
**Frontend pages:** Profile page (self/other), auth-aware navigation, 404 page, global error boundary.
**Technical concepts introduced:** React error boundaries, skeleton loading states, Tailwind responsive layout.
**Definition of Done:** every page has defined loading/error/empty states — no blank screens; profile loads in one request instead of a waterfall; guest vs. logged-in nav states verified; layout doesn't break at mobile width.

---

### Milestone 9 — Testing Hardening

**Status:** ⬜ Not Started
**Goal:** Close coverage gaps before moving into production concerns — no new product features.
**Features:** audit every module for missing tests, especially authorization/validation edge cases; add frontend component tests for all forms and the like/follow hooks.
**Database changes:** none.
**API endpoints:** none new.
**Frontend pages:** none new.
**Technical concepts introduced:** coverage reporting (`vitest --coverage`), CI coverage gate as a soft threshold, test data factories for the Prisma test DB, isolated test DB per CI run.
**Definition of Done:** every API module has tests for happy path, validation failure, unauthenticated, and forbidden-not-owner cases; coverage summary published in CI; full suite passes 3 consecutive runs with no flakiness.

---

### Milestone 10 — Security & Production Hardening

**Status:** ⬜ Not Started
**Goal:** Apply the OWASP-aligned checklist from [docs/architecture.md](architecture.md), §10.
**Features:** helmet headers, CORS allowlist, rate limiting on auth routes, CSRF protection for cookie auth, dependency scanning in CI, least-privilege DB role.
**Database changes:** none (a scoped app DB role is infra config, not schema).
**API endpoints:** none new; existing ones gain rate-limit behavior.
**Frontend pages:** none new.
**Technical concepts introduced:** helmet config, CORS preflight behavior, rate-limiting strategy, double-submit CSRF cookie pattern, Dependabot/`npm audit` in CI.
**Definition of Done:** rate limit verified by test (Nth request in window returns 429); CORS rejects an unlisted origin (tested); CSRF token required on cookie-authenticated state changes (tested); CI dependency scan has no unresolved high/critical findings.

---

### Milestone 11 — CI/CD Pipeline & Deployment

**Status:** ⬜ Not Started
**Goal:** Ship to real infrastructure with an automated pipeline.
**Features:** GitHub Actions pipeline (lint → typecheck → test → build → deploy); frontend on Vercel; backend on Render/Railway; managed Postgres (Neon/Supabase); real env-var validation on the deployed platforms.
**Database changes:** run migrations against the production DB as a deploy step.
**API endpoints:** none new.
**Frontend pages:** none new.
**Technical concepts introduced:** GitHub Actions environments/secrets, migration-on-deploy strategy, post-deploy smoke test.
**Definition of Done:** pushing to `main` triggers a green pipeline ending in a live URL; app refuses to boot in production with missing env vars; a post-deploy smoke test hits `/health` and confirms success; rollback steps documented.

---

### Milestone 12 — Observability: Logging & Request Tracing

**Status:** ⬜ Not Started
**Goal:** Add the request-ID correlation deferred from the V1 logging design.
**Features:** `pino-http` middleware, request ID generated per request and propagated through service/repository logs, included in error responses.
**Database changes:** none.
**API endpoints:** none new (error responses gain a `requestId` field).
**Frontend pages:** none new.
**Technical concepts introduced:** context propagation (e.g. `AsyncLocalStorage`) without threading an ID through every function signature.
**Definition of Done:** every log line for a single request shares one ID, verifiable by grep; error responses expose that ID; a deliberately triggered error shows the same ID in the API response and the server log.

---

### Milestone 13 — Auth V2: Refresh Token Rotation

**Status:** ⬜ Not Started
**Goal:** Replace the V1 single long-lived token with short-lived access + rotating refresh tokens and revocation.
**Database changes:** create `refresh_tokens` table (user_id, token_hash, expires_at, revoked_at).
**API endpoints:** `POST /api/v1/auth/refresh`; logout now revokes the token server-side instead of just clearing a cookie.
**Frontend pages:** none new — silent refresh handled transparently via a fetch/query interceptor on 401.
**Technical concepts introduced:** refresh rotation (new refresh token issued on every use, old one invalidated), reuse detection (a replayed old token kills the whole session family), short access-token lifetime.
**Definition of Done:** access token expires quickly and refreshes silently; logout provably revokes server-side (reuse after logout is rejected, tested); simulated token reuse is detected and the session is killed.

---

### Milestone 14 — E2E Testing with Playwright

**Status:** ⬜ Not Started
**Goal:** Lock down the golden paths now that the UI and flows are stable.
**Features:** Playwright suite: signup→login, create store→create item, like an item, follow a user, leave a review.
**Database changes:** none (test-only seed/reset for E2E isolation).
**API endpoints:** none new.
**Frontend pages:** none new.
**Technical concepts introduced:** Playwright fixtures, DB reset strategy per E2E run, headless browser execution in GitHub Actions as a separate CI job.
**Definition of Done:** all golden-path tests pass 3 consecutive CI runs with no flakiness; E2E runs as its own job, kept out of the fast unit/integration feedback loop; README documents running them locally.

---

### Milestone 15 — Production Readiness Review (Launch Checklist)

**Status:** ⬜ Not Started
**Goal:** Final polish pass, treated as a launch rather than a demo.
**Features:** performance pass (bundle size, N+1 query audit via Prisma query logging), basic accessibility pass (labels, keyboard nav, contrast), README overhaul (architecture diagram, setup, live link, screenshots), documented DB backup/rollback approach.
**Database changes:** index review against real query patterns, add anything the audit finds missing.
**API endpoints:** none new.
**Frontend pages:** none new (polish only).
**Technical concepts introduced:** N+1 detection, Lighthouse/accessibility auditing, writing a short decision-summary for interview conversations.
**Definition of Done:** Lighthouse score above an agreed bar on key pages; no N+1 queries on main list/detail pages; a stranger can clone, run, and understand the project from the README in under 10 minutes; project is demo-ready for an interview walkthrough.

---

## Deliberately Out of Scope

Not on the critical path, consistent with the YAGNI reasoning in [docs/architecture.md](architecture.md) §18:

- Admin role + RBAC
- Real file upload (S3/Cloudinary) in place of image URLs
- Real-time notifications (WebSockets)

These may be worth a "what I'd build next" note in the README once the core roadmap is complete, but are not planned milestones.
