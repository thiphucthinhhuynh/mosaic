# Git Workflow

Mosaic is developed solo but follows a workflow that would work unchanged on a small team — the point is to practice and demonstrate the process, not just produce working code.

## Branching Strategy

Trunk-based, with short-lived branches per milestone (or per sub-task within a large milestone):

- `main` is always in a working, deployable state once Milestone 12 (CI/CD) lands. Before that, "working" means "passes CI."
- One branch per milestone: `milestone-03-auth-signup-login`, or a more granular `feature/`, `fix/`, `chore/`, `docs/` prefix for smaller units of work within a milestone:
  - `feature/<short-description>` — new functionality
  - `fix/<short-description>` — bug fix
  - `chore/<short-description>` — tooling, deps, config
  - `docs/<short-description>` — documentation-only changes
- Branches are deleted after merge. No long-lived parallel branches — per the project's rule of one milestone in flight at a time, there is never more than one active feature branch.

## Commit Convention: Conventional Commits

Every commit message follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary>

<optional body — the why, not the what>
```

Types used in this project: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`, `ci`.

Examples:
```
feat(auth): add signup and login endpoints with bcrypt + JWT cookie
fix(items): reject negative price in item validation schema
docs(roadmap): mark milestone 3 complete
chore(deps): bump prisma to 5.x
```

Enforced by `commitlint` running in a Husky `commit-msg` hook — a non-conforming commit message is rejected locally, before it ever reaches CI.

**Why this matters here specifically:** with the "one milestone at a time, docs updated with code" rule, a clean Conventional Commits history is what makes it possible to look back and see exactly which commit shipped a feature versus updated its docs — useful both for review and for later writing accurate release notes.

## Pre-commit Checks

Husky + lint-staged run on every commit, scoped to staged files only:

1. ESLint (`--fix` where safe)
2. Prettier
3. (once tests exist) affected unit tests, if fast enough to stay unobtrusive — otherwise left to CI

Husky's `commit-msg` hook separately runs `commitlint` against the message itself.

## Pull Request Process

Even solo, every milestone (or meaningful sub-unit of one) goes through a PR rather than being pushed straight to `main`:

1. Branch off `main`.
2. Implement the milestone's scope only — no scope creep into the next milestone's work, per the project rules.
3. Update the required docs (README, `docs/roadmap.md`, `docs/architecture.md`, relevant `docs/api/*`, new ADRs if applicable) in the same PR as the code.
4. Open a PR with:
   - A summary of what the milestone delivers.
   - A checklist mirroring the milestone's Definition of Done from `docs/roadmap.md`.
   - Confirmation that docs were updated (or a note that none were needed, with why).
5. Self-review the diff before merging — read it as if reviewing a colleague's PR, not the person who just wrote it.
6. **Squash merge** into `main` — the milestone becomes one clean commit (or a small number of logically separate commits) in `main`'s history, even if the working branch had many small WIP commits.
7. Delete the branch.

## Tagging & Releases

Once Milestone 12 (CI/CD & Deployment) lands, each deploy to `main` is tagged (`v0.1.0`, `v0.2.0`, ...) using semantic versioning, bumped according to the scale of what shipped. Before that milestone, tagging is not yet meaningful since there's no deployed artifact to version.

## What This Workflow Deliberately Skips (for now)

No mandatory external code review (solo project — self-review substitutes), no release branches, no hotfix branch strategy — these would be real additions on an actual team, and are called out here so it's clear they're omitted by scope, not unknown.
