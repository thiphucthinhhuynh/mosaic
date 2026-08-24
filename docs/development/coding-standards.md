# Coding Standards

These conventions apply to both `apps/web` and `apps/api` unless stated otherwise. They exist so that code written in Milestone 0 and code written in Milestone 15 look like they came from the same team — enforced by tooling wherever possible, not left to memory.

## Language & Type Safety

- TypeScript everywhere, `strict: true`. No `any` without a comment explaining why it's unavoidable.
- Prefer `type` for data shapes, `interface` only when declaration merging is actually needed.
- Types derived from Zod schemas (`z.infer<typeof schema>`) rather than hand-duplicated, wherever a schema already exists for that shape.

## Formatting & Linting

- **Prettier** is the only source of truth for formatting — no manual formatting debates in review. Run on save; enforced pre-commit by lint-staged.
- **ESLint** (`typescript-eslint` + React plugin on the frontend) enforces correctness rules (no unused vars, no floating promises, hooks rules). ESLint and Prettier are wired via `eslint-config-prettier` so their rules never conflict.
- **.editorconfig** covers indentation/charset/line-endings for files Prettier doesn't touch (Markdown, YAML, JSON).
- Nothing formatting-related should ever be a comment in a PR review — if it's not caught by tooling, add a rule instead of relying on a human to notice it twice.

## Naming Conventions

- `camelCase` for variables/functions, `PascalCase` for types/components/classes, `SCREAMING_SNAKE_CASE` for true constants (in `packages/shared/constants`).
- Files: `kebab-case` for non-component files (`items.service.ts`), `PascalCase` for React components (`ItemCard.tsx`).
- Boolean variables/props read as a question: `isOwner`, `hasImages`, not `owner`, `images_flag`.

## Project Structure

- **Feature/domain-based**, not layer-based — see [ADR-004](../adr/ADR-004-feature-based-architecture.md). A change to "items" touches `features/items/` or `modules/items/`, not five scattered top-level folders.
- **Absolute imports** via `tsconfig` path aliases (`@/features/*` on the frontend, `@shared/*` for the shared package). No `../../../..` relative chains — if an import needs three or more `../`, it's a signal the code is in the wrong place or the alias config is missing.
- **Barrel exports** (`index.ts`) define each module's public surface. Only what's re-exported from a module's `index.ts` may be imported by other modules — internal files (`items.repository.ts`, etc.) are not imported directly from outside the module. This is what keeps the domain-folder structure from decaying into cross-module spaghetti as the app grows.

## Backend Conventions

- Routes stay thin: parse → delegate to a controller. No business logic in route files.
- Controllers stay thin: call exactly one service method, shape the response via the shared API response helper (`sendSuccess(res, data, meta?)`), never touch Prisma directly.
- Services contain business logic and never reference `req`/`res` — this is what makes them unit-testable without spinning up Express.
- Repositories are the _only_ layer that imports Prisma. If you're calling `prisma.*` outside a `*.repository.ts` file, it's in the wrong place.
- Every async route handler is wrapped in the shared `asyncHandler` utility so promise rejections reach the centralized error middleware. This project runs on Express 5, which already forwards rejected promises to `next()` on its own — `asyncHandler` is kept as an explicit, framework-independent convention regardless, not because it's the only thing making error handling work on this specific Express version. See [docs/architecture.md](../architecture.md) §19.
- Errors are thrown as one of the `AppError` subclasses (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`) from services — never a bare `throw new Error(...)`, since the centralized handler maps subclasses to HTTP status codes.

## Frontend Conventions

- Server state (anything from the API) lives in TanStack Query, never copied into component state. Feature-level hooks (e.g. `useAuth`) wrap the query/mutation calls so components never call `fetch`/`apiClient` directly.
- A React context + its hook are **never exported from the same file** as the component providing it. ESLint's `react-refresh/only-export-components` rule (needed for Vite's Fast Refresh to work reliably) flags a file that exports both a component and a non-component value — split into `*-context.ts` (context object + types), `use<Thing>.ts` (the hook), and `<Thing>Provider.tsx` (the component). See `apps/web/src/features/auth/` for the reference layout.
- Forms use React Hook Form with `zodResolver`, validating against the exact same schema the backend uses (imported from `packages/shared`) — never a hand-rolled, separately-maintained set of validation rules on the frontend.
- Class fields, not TypeScript parameter-property shorthand (`constructor(public readonly x: number)`), for any custom `Error` subclass on the frontend — `apps/web`'s `tsconfig` has `erasableSyntaxOnly` enabled, which rejects parameter properties because they require the compiler to generate constructor-body code, not just erase types. Declare the field and assign it in the constructor body instead.
- Route components live in `routes/`, one file per page; reusable-but-not-feature-specific UI (e.g. `NavBar`) lives in `components/`; everything else lives inside the feature folder it belongs to.
- Styling is plain CSS via CSS Modules, not a utility framework — see [ADR-007](../adr/ADR-007-vanilla-css.md). Component-scoped styles go in `ComponentName.module.css` next to the component (`import styles from './ComponentName.module.css'`, then `className={styles.something}`); only true global concerns (CSS resets, root-level custom properties for colors/spacing/fonts) belong in `src/index.css`. Don't add a class to `index.css` to style one specific component — that's what the component's own module file is for.

## API Response Shape

Every endpoint returns the same envelope:

```
{ "data": <payload or null>, "error": <error object or null>, "meta": <pagination/extra info or omitted> }
```

Produced by the shared response helper — controllers never hand-build this shape inline, so it can't drift between endpoints.

## Validation

- Every request body/query is validated by a Zod schema _before_ it reaches a controller, applied as route middleware.
- Schemas live in `packages/shared` when the same shape is used by both apps (the common case), or co-located as `<module>.schema.ts` when backend-only.
- The frontend uses the same schema for client-side form validation (React Hook Form's Zod resolver) — this is a UX convenience; the backend check is what's actually trusted.

## Comments

- Default to no comments. Well-named code explains _what_; comments are reserved for _why_ — a non-obvious constraint, a workaround for a specific bug, a business rule that isn't visible in the code shape.
- No comments referencing a task, ticket, or PR number — that context belongs in the commit message and rots in the code otherwise.

## Testing

- Test files live next to the code they test (`items.service.test.ts` beside `items.service.ts`), not in a separate mirrored tree.
- Unit tests: Arrange–Act–Assert structure, one behavior per test, descriptive test names ("throws ForbiddenError when a non-owner attempts to delete a store" rather than "test delete 3").
- Integration tests exercise the real route through Supertest against a real (test) database — no mocking Prisma in integration tests, since the point is to catch issues at the exact seams (auth middleware, DB constraints) that unit tests can't reach.
- A test that can't fail is worse than no test — every new test should be run once against the pre-fix code to confirm it actually fails before the fix lands.

## Environment & Configuration

- All environment variables are declared and validated in a single Zod schema at process startup. No ad-hoc `process.env.X` reads scattered through the codebase.
- `.env.example` is kept up to date with every variable the app actually reads — if a PR adds a new env var, `.env.example` is updated in the same PR.
