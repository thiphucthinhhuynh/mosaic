import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { sendError } from '@/lib/response';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    sendError(res, err.status, err.code, err.message, err.details);
    return;
  }

  console.error(err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong.');
}
