# ADR-007: Vanilla CSS (via CSS Modules), Not Tailwind

- **Status:** Accepted
- **Date:** 2026-08-23
- **Deciders:** Project owner (solo)

## Context

Tailwind CSS was named as the styling choice in the original tech stack (`docs/architecture.md` §3), but it was never actually installed or wired into `apps/web` — no config, no dependency, no class ever written against it. Every component built through Milestone 3 step 1 (health check, auth pages, nav) is unstyled JSX. That makes this a genuine but low-risk architecture change: correcting a planned choice before any code depends on it, not migrating existing styles.

## Decision

Style the frontend with **plain CSS**, organized as **CSS Modules** (`ComponentName.module.css`, co-located next to the component that imports it) for anything component-scoped, plus the existing global `src/index.css` for true global concerns (resets, root variables, font stack).

## Alternatives Considered

1. **Tailwind CSS (the original choice)** — utility-class framework, fast to build with, no separate stylesheet per component. Superseded here at the user's explicit request; also arguably a less direct demonstration of core CSS knowledge for a portfolio project than hand-written styles, since Tailwind makes many layout/spacing decisions on the developer's behalf via its utility set.
2. **Plain global CSS files, no scoping** (e.g. one `App.css`, everything in it or a handful of hand-named files) — the simplest possible interpretation of "vanilla CSS." Rejected because it reintroduces a well-known, avoidable problem: two components independently choosing the same class name (`.card`, `.title`) silently collide, and nothing catches it until it's visibly broken. Worth naming as a real risk now, when the app has one styled component, rather than after the tenth.
3. **CSS-in-JS** (styled-components, Emotion, etc.) — scoped by construction, but it's a runtime dependency and a different authoring model than plain CSS, which doesn't fit "vanilla CSS" as asked.
4. **CSS Modules (chosen)** — still literally hand-written CSS syntax (no utility classes, no new language to learn), but each `*.module.css` file's class names are scoped to the component that imports it by Vite's build step, not by naming discipline. No new dependency — Vite supports `*.module.css` out of the box.

## Consequences

### Positive

- Zero new dependencies; Vite's built-in support means nothing to configure.
- Class name collisions become structurally impossible for component-scoped styles, without requiring a manual naming convention (like BEM) to be remembered and enforced by hand.
- Styles are ordinary CSS — fully transferable knowledge, no framework-specific utility vocabulary to document or explain.

### Negative / Trade-offs

- More files than Tailwind's inline-utility approach (one `.module.css` per styled component) and more manual work than reaching for a pre-built utility (e.g. hand-writing flexbox/spacing rules that Tailwind would have provided as a class).
- No design-system constraints out of the box (Tailwind's spacing/color scale enforces some consistency by default) — consistency here depends on discipline (e.g. shared CSS custom properties in `index.css` for colors/spacing), not tooling.
- Global styles (`index.css`) and scoped styles (`*.module.css`) are two different mechanisms a contributor needs to know when to reach for — documented in `docs/development/coding-standards.md`.

## Related

- `docs/architecture.md` §3 (Tech Stack), §4 (Frontend Architecture)
- `docs/development/coding-standards.md` (Frontend Conventions)
