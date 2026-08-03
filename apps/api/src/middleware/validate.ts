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
