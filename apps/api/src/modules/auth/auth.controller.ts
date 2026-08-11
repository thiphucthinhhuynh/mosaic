import type { Request, Response } from 'express';
import type { SignupInput, LoginInput } from '@mosaic/shared';
import { asyncHandler } from '@/lib/asyncHandler';
import { sendSuccess } from '@/lib/response';
import { setAuthCookie, clearAuthCookie } from '@/lib/cookies';
import * as authService from '@/modules/auth/auth.service';

export const signupHandler = asyncHandler(
  async (req: Request<object, unknown, SignupInput>, res: Response) => {
    const { user, token } = await authService.signup(req.body);
    setAuthCookie(res, token);
    sendSuccess(res, user, 201);
  },
);

export const loginHandler = asyncHandler(
  async (req: Request<object, unknown, LoginInput>, res: Response) => {
    const { user, token } = await authService.login(req.body);
    setAuthCookie(res, token);
    sendSuccess(res, user);
  },
);

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  sendSuccess(res, null);
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  // req.user is guaranteed by requireAuth, which always runs before this
  // handler in auth.routes.ts.
  const user = await authService.getMe(req.user!.id);
  sendSuccess(res, user);
});
