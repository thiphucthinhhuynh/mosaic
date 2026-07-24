# Mosaic

Mosaic is a full-stack marketplace application where users open stores, list items, and build a following through likes, follows, and reviews. It is a ground-up rebuild — architecture, codebase, and engineering practices are all new — inspired only by the **business domain** of an earlier personal project. No prior implementation was reused.

Mosaic is developed as a portfolio project demonstrating software-engineering practices expected on a small production team: incremental delivery, living documentation, automated testing, CI/CD, and deliberate architectural decision-making.

## Project Status

🚧 **Pre-implementation.** Architecture, engineering rules, and the delivery roadmap are approved. No application code has been written yet — see [docs/roadmap.md](docs/roadmap.md) for the milestone currently in progress.

## Documentation

| Doc | Purpose |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System design, tech stack, and every cross-cutting engineering decision |
| [docs/roadmap.md](docs/roadmap.md) | Milestone-by-milestone delivery plan, MVP → production-ready |
| [docs/adr/](docs/adr/README.md) | Architecture Decision Records — the *why* behind key choices |
| [docs/development/coding-standards.md](docs/development/coding-standards.md) | Conventions for naming, structure, error handling, validation, testing |
| [docs/development/git-workflow.md](docs/development/git-workflow.md) | Branching, commit, and review process |
| [docs/development/project-setup.md](docs/development/project-setup.md) | Local environment setup |
| [docs/api/authentication.md](docs/api/authentication.md) | Auth endpoint contracts |

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Vite, TanStack Query, React Hook Form, Zod, Tailwind CSS |
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL, Prisma ORM |
| Auth | bcrypt + JWT (httpOnly cookie) |
| Logging | Pino |
| Tooling | ESLint, Prettier, Husky, lint-staged, Conventional Commits |
| Infrastructure | Docker Compose (local), GitHub Actions (CI/CD) |
| Deployment | Vercel (frontend), Render/Railway (backend), managed PostgreSQL (Neon/Supabase) |

Full rationale for each choice, including alternatives considered, is in [docs/architecture.md](docs/architecture.md) and [docs/adr/](docs/adr/README.md).

## Getting Started

Application code has not been implemented yet (see Project Status above). Once Milestone 1 (Project Bootstrap) lands, this section will be replaced with real, verified setup instructions. Until then, see [docs/development/project-setup.md](docs/development/project-setup.md) for the planned prerequisites and workflow.

## Engineering Practices

This project is built one milestone at a time, with documentation updated in the same milestone as the code it describes — never after the fact. See [docs/development/git-workflow.md](docs/development/git-workflow.md) for the branching and commit conventions, and [docs/adr/](docs/adr/README.md) for how architectural decisions are recorded.

## License

TBD.
