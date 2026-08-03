# ADR-005: UUID Primary Keys, Not Autoincrementing Integers

- **Status:** Accepted
- **Date:** 2026-08-03
- **Deciders:** Project owner (solo)

## Context

Milestone 1 introduced the first database table (`users`) and, with it, the first primary-key strategy decision. This choice isn't specific to `User` — every future table (`stores`, `items`, ...) will follow whatever pattern is set here, and several of Mosaic's endpoints expose a resource's id directly in a public URL (starting with `GET /api/v1/users/:id` in this milestone). That combination — a project-wide pattern, chosen under a concrete security consideration rather than a hypothetical one — is what makes this decision significant enough for an ADR rather than a coding-standards note.

## Decision

Every table's primary key is a **UUID** (`String @id @default(uuid())` in Prisma), not an autoincrementing integer.

## Alternatives Considered

1. **Autoincrementing integer** (`Int @id @default(autoincrement())`) — the default in most ORM quickstarts, including the domain-reference project's Sequelize models. Simpler to read in logs/URLs, marginally smaller index size. Rejected because a sequential integer id, once exposed on a public endpoint, lets anyone enumerate every row by walking `1, 2, 3, ...` — for `/users/:id` that means trivially scraping the entire user base. Nothing about this milestone's public-by-design endpoint makes that a hypothetical risk.
2. **Postgres-native `gen_random_uuid()`** (`@default(dbgenerated("gen_random_uuid()"))`) — generates the UUID in the database rather than in application code. Rejected in favor of Prisma's own `uuid()` default: Mosaic's architecture already mandates that all writes go through Prisma repositories (§5), so there's no raw-SQL write path that would need a DB-native default; keeping id generation in Prisma keeps the schema portable and avoids depending on a Postgres-specific function.
3. **CUID/CUID2** — Prisma's other common default, designed to be more index-friendly than random UUIDv4 (roughly sortable, shorter). A reasonable alternative; not chosen because UUID is the more universally recognized format outside the Prisma ecosystem specifically, which matters for a portfolio project meant to demonstrate broadly transferable choices.

## Consequences

### Positive

- Public endpoints can expose a resource's id directly (as `GET /api/v1/users/:id` already does) without leaking how many rows exist or letting anyone enumerate them.
- The decision is made once, here, rather than re-litigated per table as Store/Item/etc. are added.

### Negative / Trade-offs

- UUIDs are 36-byte text values versus 4/8-byte integers — larger indexes and slightly worse cache locality at real scale. Not a meaningful cost at this project's size, and worth revisiting only if performance profiling ever says otherwise.
- Random (v4-style) UUIDs insert in a random order relative to a b-tree index, which is less write-friendly than sequential ids at high volume. Accepted for the same reason: not this project's actual scale, and CUID2 or UUIDv7 (time-ordered) are known mitigations to reach for later if it ever matters.
- IDs are no longer human-guessable/readable in logs or during manual debugging (`52051d0f-abaf-...` vs `42`) — a minor developer-experience cost, outweighed by the security property for a public-facing app.

## Related

- [docs/architecture.md](../architecture.md) §9, §19
- `apps/api/prisma/schema.prisma`
