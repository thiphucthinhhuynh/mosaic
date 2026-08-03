import { Router } from 'express';
import { validateParams } from '@/middleware/validate';
import { userIdParamsSchema } from '@/modules/users/users.schema';
import { getUserById } from '@/modules/users/users.controller';

export const usersRouter = Router();

usersRouter.get('/:id', validateParams(userIdParamsSchema), getUserById);
