import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

// 7 days — no refresh token in V1, so this is the entire session lifetime.
// See docs/architecture.md §6.
export const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export type AuthTokenPayload = {
  sub: string;
};

export function signAuthToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: AUTH_TOKEN_TTL_SECONDS });
}

// Throws jsonwebtoken's own errors (e.g. TokenExpiredError, JsonWebTokenError)
// on an invalid/expired token — callers translate that into an AppError.
export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new jwt.JsonWebTokenError('Token payload missing sub claim.');
  }
  return { sub: decoded.sub };
}
