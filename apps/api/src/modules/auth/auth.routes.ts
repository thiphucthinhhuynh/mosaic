import { Router } from 'express';
import { signupSchema, loginSchema } from '@mosaic/shared';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/requireAuth';
import {
  signupHandler,
  loginHandler,
  logoutHandler,
  meHandler,
} from '@/modules/auth/auth.controller';

export const authRouter = Router();

authRouter.post('/signup', validateBody(signupSchema), signupHandler);
authRouter.post('/login', validateBody(loginSchema), loginHandler);
authRouter.post('/logout', requireAuth, logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
