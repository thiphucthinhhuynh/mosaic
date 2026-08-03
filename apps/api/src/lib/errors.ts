// Minimal AppError hierarchy — only the subclasses this milestone's
// GET /api/v1/users/:id endpoint actually needs (not-found, bad input).
// UnauthorizedError/ForbiddenError/ConflictError are introduced when
// Milestone 2 (auth) and Milestone 3 (ownership) actually need them.
// See docs/architecture.md §11 for the full design and docs/roadmap.md
// for why this arrived a milestone earlier than originally planned.
export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;

  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = 'NOT_FOUND';
}

export class ValidationError extends AppError {
  readonly status = 400;
  readonly code = 'VALIDATION_ERROR';
}
