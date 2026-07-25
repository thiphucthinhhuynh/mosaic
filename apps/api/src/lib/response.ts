import type { Response } from 'express';
import type { ApiResponse } from '@mosaic/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): void {
  const body: ApiResponse<T> = meta ? { data, error: null, meta } : { data, error: null };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ApiResponse<never> = { data: null, error: { code, message, details } };
  res.status(status).json(body);
}
