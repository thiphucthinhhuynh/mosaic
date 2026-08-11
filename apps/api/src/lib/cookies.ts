import type { Response } from 'express';
import { env } from '@/config/env';
import { AUTH_TOKEN_TTL_SECONDS } from '@/lib/jwt';

export const AUTH_COOKIE_NAME = 'mosaic_token';

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME);
}
