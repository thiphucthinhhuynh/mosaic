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
