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
