import type { Request, Response } from 'express';
import type { z } from 'zod';
import { asyncHandler } from '@/lib/asyncHandler';
import { sendSuccess } from '@/lib/response';
import { getPublicUserById } from '@/modules/users/users.service';
import type { userIdParamsSchema } from '@/modules/users/users.schema';

type UserIdParams = z.infer<typeof userIdParamsSchema>;

export const getUserById = asyncHandler(async (req: Request<UserIdParams>, res: Response) => {
  const user = await getPublicUserById(req.params.id);
  sendSuccess(res, user);
});
