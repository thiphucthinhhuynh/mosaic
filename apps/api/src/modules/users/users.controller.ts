import type { Request, Response } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { sendSuccess } from '@/lib/response';
import { getPublicUserById } from '@/modules/users/users.service';

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await getPublicUserById(req.params.id);
  sendSuccess(res, user);
});
