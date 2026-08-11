# ADR-006: Case-Insensitive Signup Uniqueness via Query-Time Check, Not Schema Changes

- **Status:** Accepted
- **Date:** 2026-08-11
- **Deciders:** Project owner (solo)

## Context

Milestone 1 flagged a known limitation when the `users` table was created: Postgres's default collation makes the `username`/`email` `@unique` constraints case-sensitive, so `"JohnDoe"` and `"johndoe"` could exist as two distinct rows. That was harmless while nothing could sign up yet. Milestone 2 (signup) is the first place a real user can trigger it, so the deferred decision came due.

## Decision

Add a case-insensitive existence check in `auth.repository.ts` using Prisma's built-in `mode: 'insensitive'` query filter, run before every signup. The DB's unique constraints stay exactly as they are — case-sensitive, untouched by any migration.

## Alternatives Considered

1. **`citext` Postgres extension** — the idiomatic Postgres-native way to make a column genuinely case-insensitive at the type level, enforced by the DB itself, not just the application. Rejected for this project's scope: Prisma's first-class support for Postgres extensions (`postgresqlExtensions`) is a preview feature, and adopting a preview feature to solve a problem the query-mode approach already solves cleanly isn't a justified trade — more moving parts for the same practical outcome at this scale.
2. **Store a separate normalized column** (e.g. `usernameNormalized`, lowercased, with the unique index moved there) — preserves the DB-level guarantee without a preview feature, at the cost of a schema change and keeping two columns in sync on every write. Rejected as more machinery than this problem needs right now.
3. **Lowercase the stored value itself** — simplest possible fix, but destroys the user's chosen display casing (`"JohnDoe"` becomes `"johndoe"` everywhere, permanently). Rejected as a real, if minor, product regression for no offsetting benefit over option 4.
4. **Query-time case-insensitive check only (chosen)** — no schema/migration change at all; `findByUsernameOrEmailCaseInsensitive` checks both fields with `mode: 'insensitive'` before creating a user. Preserves the user's exact chosen casing for display.

## Consequences

### Positive

- Solves the actual problem (a user can no longer accidentally or deliberately create a case-variant duplicate through signup) with zero schema/migration footprint.
- Display casing is fully preserved — what a user types is what's stored and shown.

### Negative / Trade-offs

- This is an **application-level** guarantee, not a **database-level** one. The DB's case-sensitive unique constraint remains as a defense-in-depth backstop against a race between two concurrent signups slipping past the application check (which does two round trips — check, then create — with no transaction wrapping them), but a successful race would surface as an unhandled DB unique-constraint error rather than the clean `409 Conflict` the normal path returns. This is judged an acceptable residual risk at this project's scale and traffic; revisit if it's ever observed in practice.
- Every future text field that needs case-insensitive comparisons (there are none yet) has to make this same choice again — this ADR doesn't set a blanket project-wide pattern the way [ADR-005](ADR-005-primary-key-strategy.md) did for primary keys, since the right answer could reasonably differ per field.

## Related

- [docs/architecture.md](../architecture.md) §19
- `apps/api/src/modules/auth/auth.repository.ts`
