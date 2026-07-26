# ADR-001: Monorepo for Frontend, Backend, and Shared Code

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Project owner (solo)

## Context

Mosaic consists of a React frontend, an Express backend, and a meaningful amount of code that logically belongs to both — Zod validation schemas, TypeScript types, and shared constants (e.g. item categories). A repository structure had to be chosen before any code could be written.

## Decision

Use a single repository (monorepo) containing `apps/web`, `apps/api`, and `packages/shared`, managed with npm workspaces.

## Alternatives Considered

1. **Polyrepo** — separate repositories for frontend and backend, as many bootcamp-style projects (including the domain-reference project this rebuild draws from) are structured.
2. **Monorepo with heavier tooling** (Nx, Turborepo) instead of plain npm workspaces.

## Consequences

### Positive

- A single `git clone` and `npm install` sets up the entire project — important for a portfolio piece a reviewer or interviewer might actually try to run.
- `packages/shared` lets a Zod schema (and its inferred TypeScript type) be defined exactly once and imported by both apps, removing an entire class of bugs where frontend and backend validation silently drift apart — this was a real, if minor, gap in the domain-reference project's separate-repo setup.
- One CI pipeline, one set of lint/format/commit rules, one place to look for anything.

### Negative / Trade-offs

- Without discipline, a monorepo can develop hidden coupling between apps that a polyrepo's hard repository boundary would prevent by construction. Mitigated by [ADR-004](ADR-004-feature-based-architecture.md)'s barrel-export convention, which makes each module's public surface explicit.
- npm workspaces is simpler to adopt than Nx/Turborepo but doesn't provide their build caching or task-graph features. For a two-app monorepo, that tooling would be overhead without a corresponding benefit — revisit only if the number of deployable packages grows meaningfully.

## Related

- [docs/architecture.md](../architecture.md) §2, §6
- [ADR-004](ADR-004-feature-based-architecture.md)
