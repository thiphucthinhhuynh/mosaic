import type { Request, Response } from 'express';
import type { z } from 'zod';
import { listStoresForOwner } from '@/modules/stores';
import { asyncHandler } from '@/lib/asyncHandler';
import { sendSuccess } from '@/lib/response';
import { getPublicUserById } from '@/modules/users/users.service';
import type { userIdParamsSchema } from '@/modules/users/users.schema';

type UserIdParams = z.infer<typeof userIdParamsSchema>;

export const getUserById = asyncHandler(async (req: Request<UserIdParams>, res: Response) => {
  const user = await getPublicUserById(req.params.id);
  sendSuccess(res, user);
});

export const listMyStoresHandler = asyncHandler(async (req: Request, res: Response) => {
  // req.user is guaranteed by requireAuth, which always runs before this
  // handler in users.routes.ts.
  const stores = await listStoresForOwner(req.user!.id);
  sendSuccess(res, stores);
});
