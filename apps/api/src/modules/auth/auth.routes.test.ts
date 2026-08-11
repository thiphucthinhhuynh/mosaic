import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';

// Runs against a real Postgres test database (see apps/api/.env.test) through
// the real Express app — no mocked Prisma — per docs/architecture.md §15.
const createdUserIds: string[] = [];

// Short on purpose: usernames are capped at 30 chars, and several test
// usernames combine this with a descriptive prefix (e.g. "signup_happy_").
function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

// @types/superagent declares every header as a plain string, but Node's http
// module special-cases set-cookie as string[] at runtime — the type is wrong,
// not the behavior.
function getSetCookieHeader(res: { headers: Record<string, string> }): string[] | undefined {
  return res.headers['set-cookie'] as unknown as string[] | undefined;
}

async function signupViaApi(
  overrides: Partial<{ username: string; email: string; password: string }> = {},
) {
  const suffix = uniqueSuffix();
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({
      username: overrides.username ?? `auth_test_${suffix}`,
      email: overrides.email ?? `auth-test-${suffix}@example.com`,
      password: overrides.password ?? 'a-strong-password-123',
    });
  if (typeof res.body.data?.id === 'string') createdUserIds.push(res.body.data.id);
  return res;
}

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/signup', () => {
  it('creates a user and returns the public shape with a session cookie', async () => {
    const email = `signup-happy-${uniqueSuffix()}@example.com`;
    const res = await signupViaApi({
      username: `signup_happy_${uniqueSuffix()}`,
      email,
      password: 'a-strong-password-123',
    });

    expect(res.status).toBe(201);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toMatchObject({ profilePic: null });
    expect(res.body.data).not.toHaveProperty('email');
    expect(res.body.data).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain(email);

    const setCookie = getSetCookieHeader(res);
    expect(setCookie).toBeDefined();
    expect(setCookie?.join(';')).toContain('mosaic_token=');
    expect(setCookie?.join(';')).toMatch(/HttpOnly/i);
  });

  it('rejects a duplicate email with 409', async () => {
    const email = `signup-dup-${uniqueSuffix()}@example.com`;
    const first = await signupViaApi({ email });
    expect(first.status).toBe(201);

    const second = await signupViaApi({ email });
    expect(second.status).toBe(409);
    expect(second.body).toEqual({
      data: null,
      error: { code: 'CONFLICT', message: expect.any(String) },
    });
  });

  it('rejects a duplicate username with 409, case-insensitively', async () => {
    const username = `CaseTest_${uniqueSuffix()}`;
    const first = await signupViaApi({ username });
    expect(first.status).toBe(201);

    const second = await signupViaApi({ username: username.toLowerCase() });
    expect(second.status).toBe(409);
  });

  it('rejects an invalid signup body with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'ab', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials and returns a session cookie', async () => {
    const email = `login-happy-${uniqueSuffix()}@example.com`;
    const password = 'a-strong-password-123';
    await signupViaApi({ email, password });

    const res = await request(app).post('/api/v1/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    const setCookie = getSetCookieHeader(res);
    expect(setCookie?.join(';')).toContain('mosaic_token=');
  });

  it('rejects a wrong password with 401', async () => {
    const email = `login-wrongpw-${uniqueSuffix()}@example.com`;
    await signupViaApi({ email, password: 'a-strong-password-123' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'totally-wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      data: null,
      error: { code: 'UNAUTHORIZED', message: expect.any(String) },
    });
  });

  it('rejects an unknown email with 401 and the same message as a wrong password', async () => {
    const email = `login-compare-${uniqueSuffix()}@example.com`;
    await signupViaApi({ email, password: 'a-strong-password-123' });
    const wrongPasswordRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'nope' });

    const unknownEmailRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `does-not-exist-${uniqueSuffix()}@example.com`, password: 'nope' });

    expect(unknownEmailRes.status).toBe(401);
    expect(unknownEmailRes.body.error.message).toBe(wrongPasswordRes.body.error.message);
  });

  it('rejects an invalid login body with 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the current user for a valid session', async () => {
    const agent = request.agent(app);
    const username = `me_happy_${uniqueSuffix()}`;
    const signupRes = await agent.post('/api/v1/auth/signup').send({
      username,
      email: `me-happy-${uniqueSuffix()}@example.com`,
      password: 'a-strong-password-123',
    });
    if (typeof signupRes.body.data?.id === 'string') createdUserIds.push(signupRes.body.data.id);

    const res = await agent.get('/api/v1/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ username });
  });

  it('returns 401 without a session cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      data: null,
      error: { code: 'UNAUTHORIZED', message: expect.any(String) },
    });
  });

  it('returns 401 for a garbage cookie', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', 'mosaic_token=not-a-real-jwt');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('clears the session so a subsequent /me fails', async () => {
    const agent = request.agent(app);
    const signupRes = await agent.post('/api/v1/auth/signup').send({
      username: `logout_happy_${uniqueSuffix()}`,
      email: `logout-happy-${uniqueSuffix()}@example.com`,
      password: 'a-strong-password-123',
    });
    if (typeof signupRes.body.data?.id === 'string') createdUserIds.push(signupRes.body.data.id);

    const logoutRes = await agent.post('/api/v1/auth/logout');
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toEqual({ data: null, error: null });

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(401);
  });

  it('returns 401 without a session cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
  });
});
