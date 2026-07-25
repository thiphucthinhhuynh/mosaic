# ADR-002: REST over GraphQL/tRPC for the API

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Project owner (solo)

## Context

Mosaic's domain (users, stores, items, likes, follows, reviews) is CRUD-heavy with a moderate amount of nested data (a store page needs the store, its items, and its reviews together). An API style had to be chosen that both fits this domain and is a strong, broadly-applicable skill to demonstrate for internship applications.

## Decision

REST over HTTPS, versioned under `/api/v1`, with resource-oriented, ownership-nested routes (e.g. `/stores/:storeId/items`) and a consistent response envelope.

## Alternatives Considered

1. **GraphQL** — a genuinely good fit for this domain's nested-data shape (a single query could fetch a store with its items and reviews in one round trip, instead of the multiple REST calls this design accepts). Rejected for V1 because it adds a schema/resolver layer and a different client integration story, which is more surface area than this project's scope needs, and because REST is the more universally expected skill for an internship-level interview.
2. **tRPC** — would meaningfully reduce boilerplate given the monorepo's shared TypeScript types (no separate schema/codegen step, end-to-end type inference). Rejected because it ties the API tightly to being consumed only by a TypeScript client in the same repo, and because REST is a more portable, transferable skill across employers' stacks than a TS-monorepo-specific tool.

## Consequences

### Positive

- REST maps directly onto the domain's resource model and is straightforward to document, test, and reason about.
- A documented OpenAPI-style contract (see `docs/api/`) is a concrete artifact reviewers can read without running the code.
- No additional schema/codegen tooling required.

### Negative / Trade-offs

- Nested views (e.g. a store's items and reviews together) either require multiple client requests or a deliberate aggregate endpoint. The project accepts a small number of explicit aggregate endpoints (see [docs/architecture.md](../architecture.md) §8, and the profile endpoint in Milestone 8) as a named exception rather than pretending strict REST purity has no cost.
- Versioning (`/api/v1`) adds a small amount of upfront ceremony for a project that may never need a `v2` — accepted because the cost is negligible and the alternative (no versioning) is a bad habit to practice.

## Related

- [docs/architecture.md](../architecture.md) §8
- [docs/api/authentication.md](../api/authentication.md)
