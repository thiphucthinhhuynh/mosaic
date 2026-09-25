# Roadmap

Mosaic is delivered one milestone at a time. Each milestone is scoped to roughly 1–3 coding sessions, builds only on what came before it, and is not started until the previous one is reviewed and approved. See [docs/development/git-workflow.md](development/git-workflow.md) for how each milestone maps to branches/PRs.

**Status legend:** ⬜ Not Started · 🟨 In Progress · ✅ Done

Documentation (this file, `architecture.md`, relevant `docs/api/*`, and any new ADRs) is updated as part of completing a milestone, not after the fact — a milestone's status only moves to ✅ once its docs match its code.

## Overview

| #   | Milestone                                      | Phase                | Status |
| --- | ---------------------------------------------- | -------------------- | ------ |
| 0   | Project Bootstrap & Engineering Foundation     | Foundation           | ✅     |
| 1   | Database Foundation & User Model               | Foundation           | ✅     |
| 2   | Auth: Signup & Login                           | MVP                  | ✅     |
| 3   | Store CRUD (Ownership Authorization)           | MVP                  | ✅     |
| 4   | Item CRUD & Item Images                        | MVP                  | ⬜     |
| 5   | Search & Filtering                             | MVP                  | ⬜     |
| 6   | Social Interactions: Likes & Follows           | MVP                  | ⬜     |
| 7   | Reviews                                        | MVP                  | ⬜     |
| 8   | Frontend Cohesion & Profile Pages              | MVP                  | ⬜     |
| 9   | Testing Hardening                              | Production-readiness | ⬜     |
| 10  | Security & Production Hardening                | Production-readiness | ⬜     |
| 11  | CI/CD Pipeline & Deployment                    | Production-readiness | ⬜     |
| 12  | Production Readiness Review (Launch Checklist) | Launch               | ⬜     |

---

### Milestone 0 — Project Bootstrap & Engineering Foundation

**Status:** ✅ Done
**Goal:** Stand up the monorepo, every piece of engineering tooling the project has committed to, and a walking skeleton proving the full stack + CI wiring works — before any real feature exists.
**Features:** health-check endpoint; React page that calls it and displays live backend status.
**Database changes:** none. No Prisma, no schema — the database layer is Milestone 1's job.
**API endpoints:** `GET /api/v1/health` — see [docs/api/health.md](api/health.md).
**Frontend pages:** single page showing API connectivity status.
**Technical concepts introduced:** npm workspaces monorepo (`apps/web`, `apps/api`, `packages/shared`), TypeScript project setup for both apps (path aliases via `tsconfig` `paths`, resolved natively by `tsx` in dev and by Vite's `resolve.alias` for the frontend), Vite, Express 5, ESLint 10 flat config + Prettier, Husky + lint-staged, commitlint (Conventional Commits), .editorconfig, .gitignore, Docker Compose (PostgreSQL service, not yet consumed by the app), GitHub Actions CI (lint → typecheck → build), API response helper, async error wrapper, a type-only `packages/shared` (the response envelope and `HealthStatus` types, consumed via `import type` so no build step is needed yet — see note below).
**Definition of Done:**

- [x] Fresh clone + `npm install` + `npm run dev` runs both apps.
- [x] `npm run lint`, `npm run typecheck`, and `npm run build` all pass locally (the same commands the CI workflow runs) — the workflow file itself has not yet been proven green on an actual GitHub Actions run, since the repo hasn't been pushed to a remote yet.
- [x] Frontend displays live backend health status — verified with a real browser (Playwright), rendering "Backend status: ok" with zero console errors.
- [x] A badly-formatted/non-conventional commit is blocked locally by hooks — verified both live (a real commit was blocked by a lint-staged failure until fixed) and directly against commitlint.
- [x] `.env.example` and `.gitignore` are present and accurate for both apps.

**Notable engineering decisions made during implementation** (see [docs/architecture.md](architecture.md) §19 for the full note): Express 5 (not 4) was installed, which natively forwards rejected-promise errors from async handlers to `next()` — the `asyncHandler` wrapper is kept anyway as an explicit, framework-independent convention, not because it's strictly required for correctness. `packages/shared` currently holds only type-only exports and has no build step; a real build (or dev/prod conditional exports) will be added once Milestone 2 introduces runtime Zod schemas.

---

### Milestone 1 — Database Foundation & User Model

**Status:** ✅ Done
**Goal:** Introduce Postgres + Prisma and the first entity, with migrations and seeding — no auth logic yet, just the data layer.
**Features:** Prisma schema, seed script with fake users.
**Database changes:** created `users` table (id, username, email, password_hash, profile_pic, timestamps) with unique constraints on username/email. See [ADR-005](adr/ADR-005-primary-key-strategy.md) for the id type.
**API endpoints:** `GET /api/v1/users/:id` (public shape only — no password_hash/email) as a proof-of-life read. Contract: [docs/api/users.md](api/users.md).
**Frontend pages:** none.
**Technical concepts introduced:** Prisma schema modeling, migrations, seeding, repository pattern, Docker Compose Postgres service (plus a second `mosaic_test` database via a Postgres init script), API response helper used against a real database for the first time, a minimal `AppError`/`NotFoundError`/`ValidationError` hierarchy (pulled forward from Milestone 2 — see [docs/architecture.md](architecture.md) §19), Zod-validated route params, Vitest + Supertest integration testing against a real test database, Vitest unit testing with a mocked repository layer.
**Definition of Done:**

- [x] `docker compose up` gives a working Postgres — **with one caveat**: Docker wasn't available in the sandbox this milestone was implemented in, so migration/seed/endpoint/test verification below used a temporary real (not mocked) embedded PostgreSQL server with matching credentials instead. `docker-compose.yml` itself was not executed end-to-end by me — see the verification section of my report for exactly what that means and what's still worth you confirming with real Docker.
- [x] `prisma migrate dev` + seed populates data — executed for real, `users` table verified via direct `psql` query showing 3 real seeded rows with generated UUIDs.
- [x] An integration test confirms the endpoint never leaks `password_hash`/`email` — 4 integration tests + 2 unit tests, all passing against a real (non-mocked) Postgres test database.
- [x] CI runs this test against a real DB service container — `.github/workflows/ci.yml` updated with a `postgres` service container, migration step, and test step. This was pushed and run for real on GitHub Actions, which caught a genuine bug (see below) that the sandbox's manual verification had missed; after the fix, the identical CI-equivalent sequence was re-run locally from a truly clean state (`npm ci`, no pre-existing generated Prisma Client or build output) and passed end-to-end — the next actual GitHub Actions run should be green, but hasn't been independently re-observed by me.

**Known limitations / follow-ups for Milestone 2:** username/email uniqueness is case-sensitive (see [docs/architecture.md](architecture.md) §19); `packages/shared` still has no `User`-shaped type since nothing outside `apps/api` consumes one yet — the public-user shape used here (`{ id, username, profilePic }`) is defined locally in `apps/api/src/modules/users` and is a natural candidate to move into `packages/shared` once Milestone 2's auth responses need the identical shape.

**Bug found and fixed after initial review:** running `npm run test` right after `npm run build` picked up stale compiled test files from `apps/api/dist/` (`tsc` was compiling `*.test.ts` into the build output, since `apps/api/tsconfig.json` had no exclusion for them) — Vitest then ran both the source and compiled copies of the same integration test concurrently against the same test database, causing a unique-constraint collision on the seeded username. Fixed by excluding `src/**/*.test.ts` from the `tsc` build (`apps/api/tsconfig.json`) and, as defense-in-depth, explicitly excluding `**/dist/**` in `apps/api/vitest.config.ts`. Verified by deleting the stale `dist/`, rebuilding, and re-running the full `lint → typecheck → test → build → format:check` sequence twice (including test-immediately-after-build, the exact order that surfaced the bug) — all green both times.

**Second bug, caught by a real GitHub Actions run:** CI's Typecheck step failed with `Cannot find module '@/generated/prisma/client'`. Root cause: nothing in the pipeline — or in the documented local setup steps — ever ran `prisma generate`; every verification up to that point had a pre-existing generated client left over from earlier manual commands, masking the gap. `apps/api/src/generated/prisma` is gitignored by design (it's regenerated from `schema.prisma`, not version-controlled — see [ADR-003](adr/ADR-003-prisma.md)), so a genuinely clean checkout (`npm ci` with no prior generate) had nothing to import. Fixed with an explicit "Generate Prisma Client" step in `.github/workflows/ci.yml` (after install, before lint/typecheck) and an explicit `npm run db:generate -w @mosaic/api` step added to the documented local setup in [docs/development/project-setup.md](development/project-setup.md) and the README (`prisma migrate dev` only regenerates the client as a side effect when there's an actual pending migration, which is false on a fresh clone). Verified by removing `apps/api/src/generated/` and every `dist/`, running `npm ci` for real, reproducing the exact CI error, then running the corrected sequence (generate → lint → typecheck → migrate → test → build → format:check) clean end to end, plus a live check of both endpoints against freshly seeded data.

---

### Milestone 2 — Auth: Signup & Login

**Status:** ✅ Done
**Goal:** Registration and login per the V1 auth strategy (bcrypt + single JWT cookie, no refresh yet).
**Features:** signup, login, logout, get-current-user.
**Database changes:** none (schema already in place from Milestone 1) — the `users.passwordHash` column, unused since Milestone 1, is real now.
**API endpoints:** `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` — contract documented in [docs/api/authentication.md](api/authentication.md).
**Frontend pages:** Signup page (`/signup`), Login page (`/login`), a protected Account page (`/account`) demonstrating `ProtectedRoute`, auth context/hook (`useAuth`), nav shows logged-in state.
**Technical concepts introduced:** bcrypt hashing, JWT sign/verify, httpOnly cookies, Zod schemas from the shared package (`packages/shared` now ships real runtime code, not just types), centralized error handler + `AppError` classes (`UnauthorizedError`, `ConflictError` added), async error wrapper, `requireAuth` middleware, `validateBody` middleware, React Router (first introduced this milestone), TanStack Query (first introduced this milestone), React Hook Form + Zod resolver.
**Definition of Done:**

- [x] Signup → login → page refresh keeps the session — verified live in a real browser (Playwright): sign up, reload the page, still authenticated.
- [x] Logout clears it — verified live: logout redirects away from the protected page, and a subsequent direct visit to `/account` redirects to `/login`.
- [x] Duplicate email and wrong password return correctly-shaped errors — integration tests assert the exact envelope (`409 CONFLICT`, `401 UNAUTHORIZED`).
- [x] Integration tests cover happy path + each validation/error case — 13 integration tests across signup/login/me/logout (invalid body, duplicate email, duplicate username case-insensitively, wrong password, unknown email, missing/garbage cookie).
- [x] Unit tests cover the hashing and JWT helpers directly — 4 tests for `password.ts` (hash/verify round trip, wrong password, salt randomness, no plaintext leakage), 4 for `jwt.ts` (sign/verify round trip, tampered token, wrong secret, expired token).

Full suite: `lint`, `typecheck`, `test` (27/27 passing), `build`, `format:check` all pass; live-verified with Playwright rather than assumed from the automated suite alone.

**Conflicts found in existing implementation, fixed as part of this milestone (not scope changes — see full explanation in the implementation report):** `app.ts`'s CORS config was missing `credentials: true`, which would have silently broken cookie-based auth entirely; `users.repository.ts` had a locally-duplicated `PublicUser` type that Milestone 1 had already flagged for moving into `packages/shared` once auth needed the same shape.

**New decision:** [ADR-006](adr/ADR-006-case-insensitive-uniqueness.md) — signup uniqueness is checked case-insensitively at the application level (Prisma `mode: 'insensitive'`), resolving the case-sensitivity gap flagged in Milestone 1, without a schema/migration change.

**Known limitations / follow-ups:** no admin capability to force-logout a user — this project's auth design has no refresh-token/session table, so there's no server-side mechanism to revoke a still-valid token before it expires (see [docs/architecture.md](architecture.md) §6, a permanent V1-only design choice, not a deferred one); the case-insensitive uniqueness check has a small theoretical race window between the check and the create (see ADR-006); no "confirm password" field on the signup form (matches the documented API contract exactly, which only has one password field).

---

### Milestone 3 — Store CRUD (Ownership Authorization)

**Status:** ✅ Done
**Goal:** Users create and manage their own store(s); introduces the Ownership authorization tier.
**Features:** create store, browse all stores (guest), view store detail (guest), update/delete own store.
**Database changes:** create `stores` table (owner_id FK → users, name, description, location, timestamps).
**API endpoints:** `GET /api/v1/stores`, `GET /api/v1/stores/:id`, `POST /api/v1/stores` (auth), `PUT /api/v1/stores/:id` (owner), `DELETE /api/v1/stores/:id` (owner), `GET /api/v1/users/me/stores` (auth)
**Frontend pages:** Stores listing, Store detail, Create Store form, Edit Store form, delete confirmation.
**Technical concepts introduced:** `requireOwnership` middleware pattern with a resource loader, nested-resource REST design, Prisma relation queries, pagination on a list endpoint.
**Definition of Done:** guests browse without auth; only the owner can edit/delete (403 otherwise, explicitly tested); list pagination works; barrel export (`index.ts`) established for this module as the template for the rest.

**Sub-steps (implemented one at a time, in that order, on request):**

- [x] **1. Database:** `Store` model & migration. Reconcile against any existing draft in `schema.prisma`, apply the migration, regenerate the Prisma client, optionally seed 1–2 stores. No API yet. — Done: migration `20260823070300_add_store` applied to both databases; `@@index([ownerId])` added (Postgres doesn't auto-index FK columns, and step 5 needs it) and `onDelete: Cascade` kept and explained in a schema comment. Seeded 2 stores (owned by `ada_lovelace`, `grace_hopper`); `linus_t` deliberately left storeless to cover the empty-list case later. Verified live: cascade delete actually removes a user's stores (tested in a rolled-back transaction), FK index confirmed via `\d stores`, seed re-run confirmed idempotent (0 new rows on the second run).
- [x] **2. Backend — public reads (Guest tier):** `GET /api/v1/stores` (paginated), `GET /api/v1/stores/:id`. New `stores` module (repository/service/controller/routes/barrel), following the `users` module pattern. Integration tests: happy path, pagination, 404, invalid id. — Done: both endpoints embed the owner's public info (`id`, `username`) via a Prisma nested `select` (never `include`, so `passwordHash`/`email` can't leak through the relation either). Pagination via `?page=&limit=` (default 20, max 100), returned in the response `meta`. Found and fixed a real gap along the way: Express 5 makes `req.query` read-only, so the existing `validateBody`-style "replace the field with the parsed value" pattern silently no-ops for query params — added a `validateQuery` middleware that stashes the validated/coerced result on `res.locals.query` instead (typed per-route via `Response<unknown, { query: ... }>`), and generalized `asyncHandler` to be generic over the response type too, since it previously only parameterized the request. 8 new integration tests (35/35 passing total); verified live against real seeded data (list, pagination across pages, detail, 404, 400).
- [x] **3. Backend — create store (Authenticated tier):** `POST /api/v1/stores` behind `requireAuth`, new `packages/shared` Zod schema for the body. Tests: happy path (owner id from the JWT, not the body), validation errors, 401 without a session. — Done: wired `requireAuth` → `validateBody(createStoreSchema)` → `createStoreHandler` in `stores.routes.ts` (the schema/service/repository/controller pieces already existed from earlier work but weren't reachable yet). `createStoreSchema` has no `ownerId` field, so a client-supplied `ownerId` in the body is silently stripped by Zod's default "strip unknown keys" behavior — `createStoreForOwner` always takes the id from `req.user.id` (set by `requireAuth` from the JWT), never the body. 4 new integration tests (39/39 passing total): store created and owned by the session user (verified against the DB row directly), a spoofed `ownerId` in the body is ignored in favor of the session user, 401 with no session, 400 when `name` is missing.
- [x] **4. Backend — `requireOwnership` + update/delete:** the generic resource-loader ownership middleware (architecture.md §7, first real use), then `PUT /api/v1/stores/:id` and `DELETE /api/v1/stores/:id`. Tests: owner succeeds, non-owner gets 403, unauthenticated gets 401, missing store gets 404. — Done: `requireOwnership(loadResource)` in `middleware/requireOwnership.ts` takes a loader returning `{ ownerId }`, so it works for any resource type, including one owned through a relation (e.g. an item via its store) — not just a direct `ownerId` column; this is the "resource loader" pattern the DoD calls for. Added the previously-deferred `ForbiddenError` (403) to the `AppError` hierarchy. Route order is `validateParams` → `requireAuth` → `requireOwnership` → `validateBody` → handler, so authorization is checked before body validation (a non-owner never learns whether their payload would've been valid). `updateStoreSchema` (`packages/shared`) is `createStoreSchema.partial()` with a refine rejecting an empty body. Delete responds `{ data: null, error: null }` (200), matching the envelope convention used by logout, rather than a bodyless 204. 9 new integration tests (48/48 passing total): PUT owner success, PUT 403/401/404/400-empty-body, DELETE 403 (row still exists), DELETE 401, DELETE 404, DELETE owner success (row actually gone). Verified live against the real Postgres test DB via Docker Compose.
- [x] **5. Backend — `GET /api/v1/users/me/stores`:** current user's own stores, behind `requireAuth`. — Done: lives in the `users` module (route path is `/users/me/stores`) but delegates to the `stores` module's service layer (`listStoresForOwner`, exported via `modules/stores`'s barrel) rather than reaching into its repository directly — same cross-module pattern `auth.service.ts` already uses for `findPublicProfileById`. `usersRouter.get('/me/stores', ...)` is registered before `/:id`; no route conflict either way since `/me/stores` is two path segments and `/:id` only matches one, but keeping the static route first reads clearer. No pagination (unlike the guest list endpoint) — not called for by the roadmap entry, and a user's own store count isn't expected to need it. 3 new integration tests (51/51 passing total): returns only the authenticated user's own stores (a second user's store in the same query window is excluded), empty array for a user with none, 401 unauthenticated. Verified live against the real Postgres test DB via Docker Compose.
- [x] **6. Frontend — Stores list + Store detail pages:** guest-visible, TanStack Query hooks for step 2's endpoints. — Done: new `stores` feature (`useStoresQuery`/`useStoreQuery`) plus `/stores` and `/stores/:id` routes, both outside `<ProtectedRoute>` since browsing is guest-visible. Added a `PublicStore` type to `packages/shared` (mirroring the existing `PublicUser` pattern) since no shared response type existed yet. `apiClient` only ever returned `data`, dropping `meta` — added a sibling `apiClientWithMeta` (sharing the same fetch/error-handling internals) so the list page can read pagination info; list pagination uses `keepPreviousData` so the current page stays visible while the next loads. Verified live in the browser: caught and fixed a real bug along the way that had nothing to do with this step's code — the _dev_ Postgres database had never been migrated or seeded (only the test DB had, from earlier integration-test runs), so `GET /api/v1/stores` was 500ing. Ran `prisma migrate deploy` + `db:seed` against dev; confirmed both pages render real seeded data end-to-end.
- [x] **7. Frontend — Create Store form:** React Hook Form + Zod (shared schema from step 3), requires auth, redirects to `/login` if signed out. — Done: `CreateStoreForm` (`features/stores`) reuses `createStoreSchema` from `packages/shared` via `zodResolver`, following the exact `LoginForm`/`SignupForm` shape (local `formError` state, `ApiError` → message fallback, `isSubmitting` gate). New `/stores/new` route is wrapped in the existing `<ProtectedRoute>`, so an unauthenticated visit redirects to `/login` for free — no new auth-guard logic needed. On success, `useCreateStoreMutation` invalidates the `['stores', 'list']` query (so a fresh browse of `/stores` shows the new store) and the form navigates to the new store's detail page. Added a "Create a store" link on `StoresPage`, shown only when `useAuth()` has a user. Verified: typecheck/lint clean, new modules confirmed to compile through Vite with no transform errors, and the exact API flow the form drives (signup → `POST /stores` → appears via `GET /users/me/stores` → `DELETE`) exercised end-to-end via curl with cleanup after. Not verified: an actual click-through of the form in a real browser — no headless browser was available in this session, and the trade-off of live UI verification was intentionally accepted this step.
- [x] **8. Frontend — Edit/Delete Store UI:** edit form (pre-filled), delete confirmation, both shown only to the store's owner. — Done: `EditStoreForm` pre-fills via RHF `defaultValues` from the loaded `PublicStore` (`description`/`location` coerced from `null` to `''` since the form fields are plain strings), validated with `updateStoreSchema` — since the form always submits all three fields, its "reject an empty body" refine never actually triggers here, but reusing the same shared schema as the API keeps client/server validation in lockstep. `DeleteStoreButton` is a two-step inline confirm (click "Delete store" → "Yes, delete it" / "Cancel") rather than `window.confirm`, consistent with hand-rolled UI elsewhere in the app. New `/stores/:id/edit` route is `<ProtectedRoute>`-gated for the signed-in check; the ownership check itself (`store.owner.id !== user.id` → redirect to the detail page) lives inside `EditStorePage`, since routing alone can't express "signed in AND owns this specific resource" — the backend's `requireOwnership` remains the actual enforcement boundary, this is purely a UI convenience to avoid showing the form to a non-owner who navigates there directly. `StoreDetailPage` now shows "Edit store" + `DeleteStoreButton` only when `useAuth()`'s user matches the store's owner. Both mutations invalidate the `['stores', 'list']` query; update also patches the cached detail, delete removes it and navigates back to `/stores`. Verified: typecheck/lint clean, new modules confirmed to compile through Vite, and the full edit→delete API sequence the UI drives exercised end-to-end via curl (update reflected in the response, delete confirmed via a follow-up 404) with cleanup after. As with step 7, not verified: an actual click-through in a real browser — no headless browser was available in this session.
- [x] **9. Full milestone verification & docs:** complete gate (lint/typecheck/test/build/format), live Playwright walkthrough (browse as guest → sign in → create → edit → delete a store), then update this roadmap entry, `docs/architecture.md`, a new `docs/api/stores.md`, and `README.md`. — Done: full gate green (lint, typecheck, all 3 workspaces build, format check, 51/51 backend tests). Live Playwright walkthrough (no headless browser was available in earlier sub-step sessions this milestone, so this is the first real click-through of the create/edit/delete UI, not just steps 7–8's curl-level checks): a real Chromium instance drove guest browse → sign up → create a store → edit it (name + location) → delete it (two-step confirm) → back to the guest list with the store gone, asserting the rendered text at each stop, not just HTTP status codes. Two benign console errors were observed (`401` on the guest `/auth/me` check, logged twice by React StrictMode's dev double-invoke) — pre-existing behavior unrelated to this milestone's code, already handled gracefully by `fetchMe`'s catch. Docs: added `docs/api/stores.md` (all 6 endpoints + the `PublicStore` shape + `requireOwnership`'s design); updated `docs/architecture.md` §19 (fixed a stale note that still called `ForbiddenError` deferred, added notes for `requireOwnership`, `apiClientWithMeta`, and the new `PublicStore` shared type); updated `README.md` (status line, new doc link); this roadmap's Overview table and Milestone 3's own status both flipped to ✅.

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

**Sub-steps (implemented one at a time, in that order, on request):**

- [x] **1. Database:** `Item` and `ItemImage` models & migration. `Item.storeId` FK → `Store` (no direct `ownerId` — ownership is always derived through the store relation, per this milestone's DoD). `ItemImage.itemId` FK → `Item`, `onDelete: Cascade` so deleting an item deletes its images. `price` as `Decimal`, `quantity` as a non-negative `Int`. Apply the migration, regenerate the Prisma client, seed a few items (with images) against the existing seeded stores. No API yet. — Done: migration `20260920043319_add_item_and_item_image` applied to both databases; `@@index([storeId])`/`@@index([itemId])` added (same FK-indexing reasoning as `Store.ownerId`). `category` made required (not optional like `description`/`location`) since Milestone 5's search/filtering depends on every item having one. No DB-level `CHECK` constraint on `price`/`quantity` — negative-value rejection is deliberately left to the Zod schema arriving in step 3, the same layer that owns every other value-range rule in this app. Seeded 3 items across the 2 existing stores (2 for Ada's Curiosities, 1 for Hopper Hardware; `linus_t` stays storeless and therefore itemless too), images created in the same transaction as their item — exercising the same transactional-create shape step 3's API will use, not just a plain insert. Verified live: cascade delete confirmed both hops (deleting an item removes its images; deleting a store removes its items) in a rolled-back transaction so real data was untouched; seed re-run confirmed idempotent (0 new rows the second time).
- [x] **2. Backend — public reads (Guest tier):** `GET /api/v1/stores/:storeId/items` (paginated, following the stores-list pattern), `GET /api/v1/items/:id`. New `items` module (repository/service/controller/routes/barrel), embedding images and enough store/owner info for the frontend's item detail page. Integration tests: happy path, pagination, 404 (both a bad item id and a bad `:storeId`), invalid id. — Done: the list route's handler lives in `stores.controller.ts` (not the `items` module), calling into `items`'s service layer (`listItemsForStore`, exported via its barrel) — same cross-module pattern as Milestone 3 step 5's `/users/me/stores`, and consistent with the route's URL living under `/stores`. The Express route param is `:id` internally (matching every other route on `storesRouter`), documented as `:storeId` externally for clarity — this also isn't incidental: step 3's `requireOwnership` reuse depends on the param being named `id`. A nonexistent `:storeId` 404s via a `getStoreById` existence check before querying items, since an empty item list would otherwise be indistinguishable from "no such store." `GET /items/:id` embeds `images` plus the owning `store` (with its `owner`) for the standalone item detail page; the list-within-a-store variant omits `store`/`owner` since the URL already scopes it. `price` returns as a JSON string (`"24.99"`, and `"150"` for a whole-number `150.00` — Decimal.js's own normalization, not a bug) via Prisma's `Decimal.toJSON()`, avoiding float precision loss for currency. 8 new integration tests (59/59 passing total); verified live against real seeded data (list, pagination, cross-store isolation, detail, both 404 cases, both 400 cases).
- [x] **3. Backend — create item (Ownership tier, via the store):** `POST /api/v1/stores/:storeId/items` behind `requireOwnership` — the _first_ case where the loader resolves ownership one hop away (the store's `ownerId`, not the not-yet-existing item's), and where `requireOwnership` runs against a `:storeId` route param rather than the created resource's own id. Transactional create (item + its images in one Prisma transaction, so a partial write on failure is impossible). New `packages/shared` Zod schema rejecting negative/zero price or negative quantity. Tests: happy path, 403 for a non-owner's store, 401 unauthenticated, 404 for a nonexistent store, validation errors for bad price/quantity. — Done: this reuses `requireOwnership(findStoreOwnerId)` — the exact same middleware call already wired for `PUT`/`DELETE /stores/:id` — needing zero new ownership code, just a new route on `storesRouter` (route order: `validateParams → requireAuth → requireOwnership → validateBody → handler`, same as update/delete). `createItemSchema` (`packages/shared`) caps `price` at `99999999.99` to mirror the DB's `Decimal(10, 2)`, same defensive pattern as `createStoreSchema`'s length caps. The handler lives in `stores.controller.ts` (URL is under `/stores`), delegating to `items`'s `createItemForStore` — the same cross-module split as step 2's list route. `createItem` (`items.repository.ts`) wraps the item insert and `itemImage.createMany` in one `prisma.$transaction`, then re-reads the row inside that same transaction to return it fully populated. 7 new integration tests (66/66 passing total): happy path with images, an empty-`imageUrls` case, 403 non-owner, 401 unauthenticated, 404 nonexistent store, 400 zero/negative price, 400 negative quantity. Also fixed a real, unrelated flake these new tests exposed: `GET /api/v1/stores`'s pagination test intermittently failed when run as part of the full suite (never in isolation) — Vitest parallelizes test _files_ by default, and `stores.routes.test.ts` and `users.routes.test.ts` both create rows in the shared `stores` table; a concurrent insert from the other file could land between this test's two sequential paginated requests and shift the DESC-ordered window. Set `fileParallelism: false` in `vitest.config.ts` (documented there) — confirmed via 5 consecutive full-suite runs, all green, after 3 consecutive full-suite runs reproduced the flake beforehand.
- [x] **4. Backend — update/delete item (Ownership tier, via the item's store):** `PUT /api/v1/items/:id`, `DELETE /api/v1/items/:id`, both behind `requireOwnership` with a loader that resolves the owner through `item.store.ownerId` — the second, and DoD-required, proof that `requireOwnership`'s loader pattern generalizes beyond a direct `ownerId` column. Tests: owner succeeds, explicit "user B cannot edit user A's item via user A's store" case, unauthenticated 401, missing item 404. — Done: `findItemOwnerId` (`items.repository.ts`) selects `item.store.ownerId` and flattens it to `{ ownerId }`, so `requireOwnership` is reused unchanged — no ownership code was added, only a new loader, which is the point of the DoD's "generalizes beyond a direct `ownerId` column" claim. Routes live on `itemsRouter` (the `:id` param is the item's own id here, unlike step 3), same order as the store routes: `validateParams → requireAuth → requireOwnership → validateBody → handler`. `updateItemSchema` (`packages/shared`) is `createItemSchema.partial()` rejecting an empty body, mirroring `updateStoreSchema`; `imageUrls` is a _replacement_ set when present (an empty array clears images) and untouched when omitted, applied as delete-then-insert inside one `prisma.$transaction` (same atomicity reasoning as create). Delete relies on `onDelete: Cascade` for images. 14 new integration tests in `items.routes.test.ts` (80/80 passing total) (including the explicit user-B-cannot-edit/delete-user-A's-item cases, 401, 404, 400 for empty body/zero price/negative price/negative quantity). Verified against the real Postgres test database: typecheck, lint, format, and the full suite pass.
- [x] **5. Frontend — Item list (within a store) + Item detail page:** guest-visible, TanStack Query hooks for step 2's endpoints, item list rendered on the store detail page (or a nested route — decide when implementing). — Done: the list renders on the store detail page via a self-contained `StoreItemList` (its own pagination, loading and error states, so an items failure never blanks the store page), and each item links to a new guest-visible `/items/:id` route; this resolves the "nested route or not" question in favor of a flat `/items/:id` matching the API's own shape. New `items` feature (`useStoreItemsQuery`, `useItemQuery`) with a query-key prefix of `['items', …]` so step 6/7 mutations can invalidate every item query at once, and `PublicItem`/`PublicItemDetail` types in `packages/shared` (with `price` typed as a string, since the API serializes Decimals that way — parse for display only). `formatPrice` (`lib/formatPrice.ts`) renders prices as USD via `Intl.NumberFormat`, so a whole-number `"150"` displays as `$150.00`. Found and fixed a real UX bug while verifying: TanStack Query retries every failed query 3× with backoff by default, so a nonexistent item (or store — same defect since Milestone 3) sat on "Loading…" for ~7.4 s and made 4 requests before showing "not found". `queryClient` now skips retries for 4xx `ApiError`s (deterministic failures) and keeps them for network errors and 5xx — not-found now appears in ~108 ms with one request. Verified in a real Chromium (Playwright): guest browses a store's items, sees formatted price/category, clicks through to the detail page (stock, description, image element, "Sold by" store link), follows the link back, sees the empty state on an itemless store, and gets the not-found message for an unknown id; no unexpected console errors (the only errors are the known guest `/auth/me` 401 and the deliberate 404 probe).
- [x] **6. Frontend — Create Item form:** React Hook Form + Zod (shared schema from step 3), image URLs entered as a repeatable list of text inputs (no file upload, per this milestone's scope), requires being the store's owner, shown only from that store's page. — Done: `CreateItemForm` (`features/items`) validates against the shared `createItemSchema` directly, following the `CreateStoreForm` shape. Two form-specific decisions: numeric fields use `register(…, { valueAsNumber: true })` so the schema sees real numbers (matching what the API receives as JSON), and the repeatable image-URL list is driven by `watch`/`setValue` rather than `useFieldArray`, because `useFieldArray` doesn't support arrays of plain strings and wrapping URLs in `{ url }` objects would have meant a form-only schema diverging from the shared one. New `/stores/:id/items/new` route is `<ProtectedRoute>`-gated; `CreateItemPage` adds the ownership check (non-owner → redirected to the store page), with the API's `requireOwnership` still the real enforcement boundary — the same split as `EditStorePage`. The entry point is an "Add an item" link on the store page, rendered only for the owner. On success it invalidates `['items', 'list', storeId]` (every page of that store's list) and navigates to the new item's detail page. Found while verifying: an empty price/quantity produced Zod's developer-facing _"expected number, received NaN"_, so `createItemSchema` now carries readable messages for price and quantity (type, sign, integer, and max checks) — validation rules are unchanged, only the text, and it applies to API error messages too (tests assert error codes, not text). Verified in a real Chromium against the live stack: empty submit shows field errors and stays put; zero price and negative quantity are rejected; adding three image inputs and removing the middle one removes the right row; creating navigates to the detail page with the formatted price, stock, and both images; returning to the store page lists the new item without a reload (cache invalidation); a second signed-in user sees no "Add an item" link and is redirected when opening the form URL directly; a signed-out visitor is sent to `/login`. Full gate green (80/80 backend tests). Not covered: the API-error path (e.g. 403/500 surfacing in the form's `formError`) — exercised by the backend tests at the HTTP level, not driven through this UI.
- [ ] **7. Frontend — Edit/Delete Item UI:** edit form (pre-filled, including existing image URLs), delete confirmation, both shown only to the item's owner (i.e. the store's owner). — **Implemented, pending live check:** new `/items/:id/edit` route (`<ProtectedRoute>`-gated; `EditItemPage` redirects a non-owner back to the item, with the API's `requireOwnership` still the real boundary — same split as `EditStorePage`/`CreateItemPage`). An item's owner is `item.store.owner.id`, so the "Edit item" link and `DeleteItemButton` on `ItemDetailPage` render only when that matches the signed-in user. The create form's field set was extracted into a shared `ItemFormFields` component (the repeatable image-URL list is too fiddly to maintain twice); `EditItemForm` validates with `createItemSchema`, not `updateItemSchema`, because it is pre-filled with every field and always submits all of them, and it sends the full `imageUrls` list, which the API treats as a replacement set. `useUpdateItemMutation` merges the PUT response (a `PublicItem`, no embedded store) into the cached detail so the detail page shows the new values immediately, and invalidates the store's `['items', 'list', storeId]` pages. `useDeleteItemMutation` invalidates that list but deliberately leaves the item's detail query alone — the detail page is still mounted when it runs, so invalidating/removing it would refetch and flash "Item not found" before navigation lands. Typecheck, lint, format, and production build pass; **not yet exercised in a browser against a live API** (no Docker/PostgreSQL reachable from the implementation environment), so `CreateItemForm`'s refactor onto `ItemFormFields` in particular still needs a live re-check. Tick this box after that check.
- [ ] **8. Full milestone verification & docs:** complete gate (lint/typecheck/test/build/format), live Playwright walkthrough (browse a store's items as guest → sign in as the store owner → create an item with images → edit it → delete it; separately, confirm a non-owner cannot edit/delete via the UI), then update this roadmap entry, `docs/architecture.md`, a new `docs/api/items.md`, and `README.md`.

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
**Technical concepts introduced:** React error boundaries, skeleton loading states, responsive layout with vanilla CSS (media queries, CSS custom properties) — see [ADR-007](adr/ADR-007-vanilla-css.md).
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

### Milestone 12 — Production Readiness Review (Launch Checklist)

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

Not on the critical path, consistent with the YAGNI reasoning in [docs/architecture.md](architecture.md) §18. This project has a single V1 scope — nothing below is "coming in V2"; these were considered and are permanently excluded unless a real need for one shows up later:

- Admin role + RBAC
- Real file upload (S3/Cloudinary) in place of image URLs
- Real-time notifications (WebSockets)
- Refresh token rotation / server-side session revocation — V1 auth's single long-lived JWT cookie is the permanent design, not a placeholder for a later upgrade (see [docs/architecture.md](architecture.md) §6)
- Per-request correlation IDs / distributed log tracing — structured logging (Pino) ships without this; not planned
- End-to-end browser tests (Playwright) — the project relies on unit + integration tests only (see [docs/architecture.md](architecture.md) §15)

These may be worth a "what I'd build next" note in the README once the core roadmap is complete, but are not planned milestones.
