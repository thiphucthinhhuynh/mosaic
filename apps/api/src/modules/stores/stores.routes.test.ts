import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';

// Runs against a real Postgres test database (see apps/api/.env.test) through
// the real Express app — no mocked Prisma — per docs/architecture.md §15.
describe('stores routes', () => {
  let ownerId: string;
  const ownerUsername = 'stores_test_owner';

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
});
