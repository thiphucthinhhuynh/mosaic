import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '@/lib/errors';
import { verifyAuthToken } from '@/lib/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/cookies';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== 'string') {
    next(new UnauthorizedError('Authentication required.'));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired session.'));
  }
}
