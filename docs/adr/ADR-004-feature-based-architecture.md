# ADR-004: Feature-Based Folder Structure with Barrel Exports

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Project owner (solo)

## Context

Both `apps/web` and `apps/api` need an internal folder structure. The domain-reference project (and most layer-first codebases, including the bootcamp curriculum it came from) organized files by technical role — `controllers/`, `models/`, `routes/` on the backend; `components/`, `store/` on the frontend. As the domain grows (stores → items → likes → follows → reviews), a decision was needed on whether to continue that pattern or organize by feature instead.

## Decision

Organize both apps by **feature/domain** (`features/items`, `modules/reviews`, etc.), not by technical layer. Each feature/module folder exposes its public surface through a single `index.ts` barrel export; anything not re-exported there is private to that module.

## Alternatives Considered

1. **Layer-first folders** (`controllers/`, `services/`, `models/` at the top level, domain names only appearing as filenames within them) — the pattern the domain-reference project used. Rejected because adding one feature (e.g. reviews) then means touching five different top-level folders instead of one, and nothing stops one module's file from reaching into another's internals.
2. **Feature-first without barrel exports** — organize by domain, but allow any file to be imported directly by any other file. Rejected because without an explicit public/private boundary, a domain-folder structure tends to decay into the same cross-module coupling a layer-first structure has, just with different folder names.

## Consequences

### Positive
- A single feature's work stays within a single folder — directly serves the project's "one milestone at a time" delivery process, since each milestone's diff is naturally scoped to one or two module folders.
- Barrel exports make each module's public API a reviewable, explicit list rather than an implicit convention — a PR reviewer (or future self) can see exactly what a module intends to expose by reading one file.
- The same organizing principle applies to both frontend and backend, so the mental model transfers between them.

### Negative / Trade-offs
- Barrel exports have a known downside at larger scale: they can slow down bundlers/type-checkers and obscure the true dependency graph, which is why some large codebases have moved away from them. At Mosaic's size (a handful of modules) this cost doesn't materialize, and the organizational benefit — an explicit, enforceable module boundary — outweighs it. Worth revisiting only if the project's scale changes substantially.
- Nothing in the tooling *enforces* that other modules only import through the barrel (no ESLint rule for it in V1) — it's a convention that relies on discipline in code review for now. If violations start appearing, an ESLint import-boundary rule is a lightweight follow-up, not a new ADR.

## Related

- [docs/architecture.md](../architecture.md) §4, §5, §17
- [docs/development/coding-standards.md](../development/coding-standards.md)
- [ADR-001](ADR-001-monorepo.md)
