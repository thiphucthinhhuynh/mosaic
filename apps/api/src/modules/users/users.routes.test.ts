import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';

// Runs against a real Postgres test database (see apps/api/.env.test) through
// the real Express app — no mocked Prisma — per docs/architecture.md §15.
describe('GET /api/v1/users/:id', () => {
  let userId: string;
  const seedEmail = 'integration-test-user@example.com';

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        username: 'integration_test_user',
        email: seedEmail,
        passwordHash: 'not-a-real-hash::integration-test-fixture',
        profilePic: 'https://example.com/avatar.png',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('returns the public representation of an existing user', async () => {
    const res = await request(app).get(`/api/v1/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        id: userId,
        username: 'integration_test_user',
        profilePic: 'https://example.com/avatar.png',
      },
      error: null,
    });
  });

  it('never exposes passwordHash or email', async () => {
    const res = await request(app).get(`/api/v1/users/${userId}`);

    expect(res.body.data).not.toHaveProperty('passwordHash');
    expect(res.body.data).not.toHaveProperty('email');
    expect(JSON.stringify(res.body)).not.toContain(seedEmail);
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const res = await request(app).get('/api/v1/users/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      data: null,
      error: { code: 'NOT_FOUND', message: expect.any(String) },
    });
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/v1/users/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/users/me/stores', () => {
  const createdUserIds: string[] = [];

  // Short on purpose: usernames are capped at 30 chars, and test usernames
  // combine this with a descriptive prefix (e.g. "me_stores_happy").
  function uniqueSuffix(): string {
    return Math.random().toString(36).slice(2, 8);
  }

  async function signupViaApi(agent: ReturnType<typeof request.agent>, usernamePrefix: string) {
    const suffix = uniqueSuffix();
    const res = await agent.post('/api/v1/auth/signup').send({
      username: `${usernamePrefix}_${suffix}`,
      email: `${usernamePrefix}-${suffix}@example.com`,
      password: 'a-strong-password-123',
    });
    createdUserIds.push(res.body.data.id);
    return res.body.data.id as string;
  }

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  });

  it('returns only the authenticated user’s own stores', async () => {
    const agent = request.agent(app);
    const userId = await signupViaApi(agent, 'me_stores_happy');
    const otherOwnerId = await signupViaApi(request.agent(app), 'me_stores_other');

    await prisma.store.createMany({
      data: [
        { ownerId: userId, name: 'My Store One' },
        { ownerId: userId, name: 'My Store Two' },
        { ownerId: otherOwnerId, name: 'Someone Else’s Store' },
      ],
    });

    const res = await agent.get('/api/v1/users/me/stores');

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toHaveLength(2);
    const names = res.body.data.map((store: { name: string }) => store.name);
    expect(names.sort()).toEqual(['My Store One', 'My Store Two']);
  });

  it('returns an empty array when the user has no stores', async () => {
    const agent = request.agent(app);
    await signupViaApi(agent, 'me_stores_empty');

    const res = await agent.get('/api/v1/users/me/stores');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/v1/users/me/stores');

    expect(res.status).toBe(401);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
