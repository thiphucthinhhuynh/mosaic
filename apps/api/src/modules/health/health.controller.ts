import type { Request, Response } from 'express';
import type { HealthStatus } from '@mosaic/shared';
import { sendSuccess } from '@/lib/response';
import { asyncHandler } from '@/lib/asyncHandler';

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const status: HealthStatus = { status: 'ok', timestamp: new Date().toISOString() };
  sendSuccess(res, status);
});
