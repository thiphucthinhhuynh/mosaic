# Architecture Decision Records

An ADR captures a significant architectural decision, the context that led to it, the alternatives that were considered, and the trade-offs accepted — so that anyone reading the project later (including the author, months on) understands _why_ something was built the way it was, not just _what_ was built.

## When to Write One

An ADR is written for a decision that:

- Is expensive or awkward to reverse later, or
- Was chosen over one or more genuinely reasonable alternatives, or
- Sets a pattern the rest of the codebase is expected to follow.

Routine implementation choices (variable names, which utility function to use) do not need one — [docs/development/coding-standards.md](../development/coding-standards.md) covers those.

**Note on timing:** ADRs are not only written _after_ something changes — ADR-001 through ADR-004 were written for foundational decisions made _before_ any code existed, because a decision doesn't stop being architecturally significant just because it happened on day one. Going forward, a new ADR is added whenever a decision meeting the criteria above is made, whether that's revising an existing choice or introducing a new one.

## Format

Each ADR follows the same structure: Status, Date, Context, Decision, Alternatives Considered, Consequences (positive and negative).

## Status Values

- **Proposed** — under discussion, not yet acted on.
- **Accepted** — decided and in effect.
- **Superseded** — replaced by a later ADR (the later one is linked, and this one is kept for history rather than deleted).

## Index

| ADR                                               | Title                                                   | Status   |
| ------------------------------------------------- | ------------------------------------------------------- | -------- |
| [ADR-001](ADR-001-monorepo.md)                    | Monorepo for frontend, backend, and shared code         | Accepted |
| [ADR-002](ADR-002-rest-api.md)                    | REST over GraphQL/tRPC for the API                      | Accepted |
| [ADR-003](ADR-003-prisma.md)                      | Prisma as the ORM                                       | Accepted |
| [ADR-004](ADR-004-feature-based-architecture.md)  | Feature-based folder structure with barrel exports      | Accepted |
| [ADR-005](ADR-005-primary-key-strategy.md)        | UUID primary keys, not autoincrementing integers        | Accepted |
| [ADR-006](ADR-006-case-insensitive-uniqueness.md) | Case-insensitive signup uniqueness via query-time check | Accepted |
| [ADR-007](ADR-007-vanilla-css.md)                 | Vanilla CSS (via CSS Modules), not Tailwind             | Accepted |

Decisions **not yet** captured as their own ADR but documented directly in [docs/architecture.md](../architecture.md) because they were specified alongside the roadmap rather than debated as standalone architecture questions: the V1 auth strategy (bcrypt, no refresh token), the V1 authorization scope (no RBAC), and the V1 testing/logging scope. If any of these are revisited with real alternatives on the table — for example, when Milestone 13 introduces refresh tokens — that revision gets its own ADR at that time.
