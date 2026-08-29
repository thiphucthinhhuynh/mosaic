import { Router } from 'express';
import { validateParams } from '@/middleware/validate';
import { requireAuth } from '@/middleware/requireAuth';
import { userIdParamsSchema } from '@/modules/users/users.schema';
import { getUserById, listMyStoresHandler } from '@/modules/users/users.controller';

export const usersRouter = Router();

usersRouter.get('/me/stores', requireAuth, listMyStoresHandler);
usersRouter.get('/:id', validateParams(userIdParamsSchema), getUserById);
