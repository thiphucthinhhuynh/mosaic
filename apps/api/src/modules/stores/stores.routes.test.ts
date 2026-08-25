import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';

// Runs against a real Postgres test database (see apps/api/.env.test) through
// the real Express app — no mocked Prisma — per docs/architecture.md §15.
// Short on purpose: usernames are capped at 30 chars, and test usernames
// combine this with a descriptive prefix (e.g. "stores_create_").
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
  return res.body.data.id as string;
}

describe('stores routes', () => {
  let ownerId: string;
  const ownerUsername = 'stores_test_owner';
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: {
        username: ownerUsername,
        email: 'stores-test-owner@example.com',
        passwordHash: 'not-a-real-hash::integration-test-fixture',
      },
    });
    ownerId = owner.id;
  });

  afterAll(async () => {
    // onDelete: Cascade on Store.owner means this also removes every store
    // created below — no separate store cleanup needed (verified in
    // Milestone 3 step 1's cascade-delete test).
    await prisma.user.delete({ where: { id: ownerId } });
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  });

  describe('GET /api/v1/stores/:id', () => {
    let storeId: string;

    beforeAll(async () => {
      const store = await prisma.store.create({
        data: {
          ownerId,
          name: 'Detail Test Store',
          description: 'A store used for the detail-endpoint test.',
          location: 'Testville',
        },
      });
      storeId = store.id;
    });

    it('returns the store with its owner embedded', async () => {
      const res = await request(app).get(`/api/v1/stores/${storeId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: {
          id: storeId,
          name: 'Detail Test Store',
          description: 'A store used for the detail-endpoint test.',
          location: 'Testville',
          createdAt: expect.any(String),
          owner: { id: ownerId, username: ownerUsername },
        },
        error: null,
      });
    });

    it('returns 404 for a well-formed id that does not exist', async () => {
      const res = await request(app).get('/api/v1/stores/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        data: null,
        error: { code: 'NOT_FOUND', message: expect.any(String) },
      });
    });

    it('returns 400 for a malformed id', async () => {
      const res = await request(app).get('/api/v1/stores/not-a-valid-id');

      expect(res.status).toBe(400);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/stores', () => {
    beforeAll(async () => {
      // Three stores for one owner makes pagination with limit=2 predictable:
      // page 1 has 2 items, page 2 has 1.
      await prisma.store.createMany({
        data: [
          { ownerId, name: 'Pagination Store A' },
          { ownerId, name: 'Pagination Store B' },
          { ownerId, name: 'Pagination Store C' },
        ],
      });
    });

    it('returns a page of stores with pagination meta', async () => {
      const res = await request(app).get('/api/v1/stores').query({ limit: 2, page: 1 });

      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 2 });
      expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it('returns the remainder on the next page', async () => {
      const firstPage = await request(app).get('/api/v1/stores').query({ limit: 2, page: 1 });
      const secondPage = await request(app).get('/api/v1/stores').query({ limit: 2, page: 2 });

      expect(secondPage.status).toBe(200);
      const firstPageIds = firstPage.body.data.map((store: { id: string }) => store.id);
      const secondPageIds = secondPage.body.data.map((store: { id: string }) => store.id);
      expect(secondPageIds.every((id: string) => !firstPageIds.includes(id))).toBe(true);
    });

    it('applies default pagination when no query params are given', async () => {
      const res = await request(app).get('/api/v1/stores');

      expect(res.status).toBe(200);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 20 });
    });

    it('never exposes owner passwordHash or email', async () => {
      const res = await request(app).get('/api/v1/stores').query({ limit: 100 });

      for (const store of res.body.data) {
        expect(store.owner).not.toHaveProperty('passwordHash');
        expect(store.owner).not.toHaveProperty('email');
      }
    });

    it('returns 400 for an invalid query param', async () => {
      const res = await request(app).get('/api/v1/stores').query({ page: 'not-a-number' });

      expect(res.status).toBe(400);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/stores', () => {
    it('creates a store owned by the authenticated user', async () => {
      const agent = request.agent(app);
      const userId = await signupViaApi(agent, 'stores_create_happy');
      createdUserIds.push(userId);

      const res = await agent.post('/api/v1/stores').send({
        name: 'A Brand New Store',
        description: 'Created via the authenticated endpoint.',
        location: 'Newtown',
      });

      expect(res.status).toBe(201);
      expect(res.body.error).toBeNull();
      expect(res.body.data).toMatchObject({
        name: 'A Brand New Store',
        description: 'Created via the authenticated endpoint.',
        location: 'Newtown',
        owner: { id: userId },
      });

      const stored = await prisma.store.findUnique({ where: { id: res.body.data.id } });
      expect(stored?.ownerId).toBe(userId);
    });

    it('ignores an ownerId in the request body and uses the session user instead', async () => {
      const agent = request.agent(app);
      const userId = await signupViaApi(agent, 'stores_create_spoof');
      createdUserIds.push(userId);

      const res = await agent.post('/api/v1/stores').send({ name: 'Spoof Attempt Store', ownerId });

      expect(res.status).toBe(201);
      expect(res.body.data.owner.id).toBe(userId);
      expect(res.body.data.owner.id).not.toBe(ownerId);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/v1/stores').send({ name: 'No Session Store' });

      expect(res.status).toBe(401);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 400 when name is missing', async () => {
      const agent = request.agent(app);
      await signupViaApi(agent, 'stores_create_invalid').then((id) => createdUserIds.push(id));

      const res = await agent.post('/api/v1/stores').send({ description: 'No name given.' });

      expect(res.status).toBe(400);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
