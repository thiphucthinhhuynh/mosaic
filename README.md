# Mosaic

![Status](https://img.shields.io/badge/status-in%20development-blue)

[![Tech Stack](https://skillicons.dev/icons?i=typescript,react,express,prisma,postgresql,githubactions,docker)](https://skillicons.dev)

Mosaic is a full-stack marketplace application where users open stores, list items, and build a following through likes, follows, and reviews. It is a ground-up rebuild — architecture, codebase, and engineering practices are all new — inspired only by the **business domain** of an earlier personal project. No prior implementation was reused.

Mosaic is developed as a portfolio project demonstrating software-engineering practices expected on a small production team: incremental delivery, living documentation, automated testing, CI/CD, and deliberate architectural decision-making.

## Project Status

🚧 **Status: In Development** <br>
Milestones 0–2 (Project Bootstrap, Database Foundation & User Model, Authentication) are complete — see [docs/roadmap.md](docs/roadmap.md) for what's next.

## Documentation

| Doc                                                                          | Purpose                                                                 |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                                 | System design, tech stack, and every cross-cutting engineering decision |
| [docs/roadmap.md](docs/roadmap.md)                                           | Milestone-by-milestone delivery plan, MVP → production-ready            |
| [docs/adr/](docs/adr/README.md)                                              | Architecture Decision Records — the _why_ behind key choices            |
| [docs/development/coding-standards.md](docs/development/coding-standards.md) | Conventions for naming, structure, error handling, validation, testing  |
| [docs/development/git-workflow.md](docs/development/git-workflow.md)         | Branching, commit, and review process                                   |
| [docs/development/project-setup.md](docs/development/project-setup.md)       | Local environment setup                                                 |
| [docs/api/authentication.md](docs/api/authentication.md)                     | Auth endpoint contracts                                                 |
| [docs/api/health.md](docs/api/health.md)                                     | Health-check endpoint contract                                          |
| [docs/api/users.md](docs/api/users.md)                                       | Users endpoint contract                                                 |

## Tech Stack

| Layer          | Choice                                                                          |
| -------------- | ------------------------------------------------------------------------------- |
| Frontend       | React, TypeScript, Vite, TanStack Query, React Hook Form, Zod, CSS Modules      |
| Backend        | Node.js, TypeScript, Express                                                    |
| Database       | PostgreSQL, Prisma ORM                                                          |
| Auth           | bcrypt + JWT (httpOnly cookie)                                                  |
| Logging        | Pino                                                                            |
| Tooling        | ESLint, Prettier, Husky, lint-staged, Conventional Commits                      |
| Infrastructure | Docker Compose (local), GitHub Actions (CI/CD)                                  |
| Deployment     | Vercel (frontend), Render/Railway (backend), managed PostgreSQL (Neon/Supabase) |

Full rationale for each choice, including alternatives considered, is in [docs/architecture.md](docs/architecture.md) and [docs/adr/](docs/adr/README.md).

## Getting Started

Prerequisites: Node.js 20+ (see `.nvmrc`), npm, Docker.

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d
npm run db:generate -w @mosaic/api
npm run db:migrate -w @mosaic/api
npm run db:seed -w @mosaic/api
npm run dev
```

This starts the API on `http://localhost:4000` and the web app on `http://localhost:5173`, which displays a live backend health check. `GET /api/v1/users/:id` now reads real seeded data from PostgreSQL through Prisma. Full details, including every npm script and the test-database setup, are in [docs/development/project-setup.md](docs/development/project-setup.md).

## Engineering Practices

This project is built one milestone at a time, with documentation updated in the same milestone as the code it describes — never after the fact. See [docs/development/git-workflow.md](docs/development/git-workflow.md) for the branching and commit conventions, and [docs/adr/](docs/adr/README.md) for how architectural decisions are recorded.

## License

MIT License
