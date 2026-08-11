import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signAuthToken, verifyAuthToken } from '@/lib/jwt';
import { env } from '@/config/env';

describe('auth tokens', () => {
  it('signs a token that verifies back to the same user id', () => {
    const token = signAuthToken('user-123');
    const payload = verifyAuthToken(token);
    expect(payload.sub).toBe('user-123');
  });

  it('throws on a tampered token', () => {
    const token = signAuthToken('user-123');
    const lastChar = token.at(-1);
    const tampered = token.slice(0, -1) + (lastChar === 'a' ? 'b' : 'a');
    expect(() => verifyAuthToken(tampered)).toThrow();
  });

  it('throws on a token signed with a different secret', () => {
    const bogus = jwt.sign({ sub: 'user-123' }, 'a-completely-different-secret-thats-long-enough', {
      expiresIn: '1h',
    });
    expect(() => verifyAuthToken(bogus)).toThrow();
  });

  it('throws on an expired token', () => {
    const expired = jwt.sign({ sub: 'user-123' }, env.JWT_SECRET, { expiresIn: -10 });
    expect(() => verifyAuthToken(expired)).toThrow();
  });
});
