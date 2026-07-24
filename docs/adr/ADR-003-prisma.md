# ADR-003: Prisma as the ORM

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Project owner (solo)

## Context

Mosaic's domain is relational: users own stores, stores own items, and there are several uniqueness/referential-integrity constraints that matter (one like per user per item, one follow per pair of users, one review per user per store). An ORM/database-access approach had to be chosen for the Express + TypeScript + PostgreSQL backend. The domain-reference project used Sequelize with plain JavaScript; this rebuild is TypeScript-first, which changes the calculus.

## Decision

Use **Prisma** as the ORM, with PostgreSQL as the database.

## Alternatives Considered

1. **Sequelize** — what the domain-reference project used. Mature and widely deployed, but its TypeScript support is retrofitted (types are not derived from the schema the way Prisma's are), which undercuts the project's end-to-end type-safety goal.
2. **Drizzle ORM** — lighter-weight, more explicitly SQL-like, growing quickly in adoption. A reasonable alternative; not chosen because its migration tooling and ecosystem (Prisma Studio, mature docs) are less mature as of this decision, and Prisma's generated types integrate more directly with the shared-types goal in [ADR-001](ADR-001-monorepo.md).
3. **TypeORM** — decorator/class-based, closer to a traditional Java/ORM style. Not chosen; its decorator-heavy models are a less natural fit with the repository-pattern layering in [docs/architecture.md](../architecture.md) §5 than Prisma's schema-first, generated-client approach.
4. **Raw SQL / query builder (Knex)** — maximum control, no ORM abstraction to fight. Rejected for this project's scope: hand-writing every query and its result typing would slow delivery without a corresponding benefit at this schema's size, though the trade-off is worth naming explicitly since ORMs can hide N+1 queries (mitigated by the N+1 audit already planned in Milestone 16).

## Consequences

### Positive
- Query results are typed automatically from `schema.prisma` — no hand-maintained type definitions for database rows, and those types flow naturally into services and, via `packages/shared`, the frontend.
- `prisma migrate` gives a straightforward, reviewable migration history, which matters given the project's incremental, one-migration-per-milestone approach (see [docs/architecture.md](../architecture.md) §9).
- Prisma's relation queries (`include`) map cleanly onto the domain's actual nested-read needs (a store with its items, a user with their liked items).

### Negative / Trade-offs
- Prisma's `include` conveniences can hide N+1 query patterns if used carelessly; the project deliberately writes at least one raw-SQL query somewhere in the codebase so the team (i.e., the author) stays fluent in what the ORM is abstracting away, and audits for N+1s explicitly in Milestone 16.
- Prisma's schema-first workflow requires regenerating the client after every schema change (`prisma generate`) — a minor extra step compared to Sequelize's more dynamic model definitions, accepted for the type-safety payoff.

## Related

- [docs/architecture.md](../architecture.md) §9
- [docs/roadmap.md](../roadmap.md) — Milestone 2 (first schema), Milestone 16 (N+1 audit)
