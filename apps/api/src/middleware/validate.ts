import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

// Gates the request on `req.params` matching `schema`, then hands off to the
// route handler — it doesn't rewrite req.params, so downstream code just
// reads req.params normally, trusting it's already been validated.
export function validateParams(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(new ValidationError('Invalid request parameters.', z.treeifyError(result.error)));
      return;
    }
    next();
  };
}

// Same idea for the body, except the parsed result replaces req.body — Zod
// output is what downstream code should trust, not the raw input.
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationError('Invalid request body.', z.treeifyError(result.error)));
      return;
    }
    req.body = result.data;
    next();
  };
}

// Query params can't use the same req.body-replacement trick: Express 5 made
// req.query a getter with no setter, so assigning to it is silently a no-op
// (verified directly — no error, but the reassignment never sticks). The
// validated/coerced result goes on res.locals.query instead; route handlers
// read it via `Response<unknown, { query: z.infer<typeof schema> }>`. See
// docs/architecture.md §19.
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new ValidationError('Invalid query parameters.', z.treeifyError(result.error)));
      return;
    }
    res.locals.query = result.data;
    next();
  };
}
