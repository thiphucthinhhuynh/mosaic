import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';

// Runs against a real Postgres test database (see apps/api/.env.test) through
// the real Express app — no mocked Prisma — per docs/architecture.md §15.
describe('GET /api/v1/items/:id', () => {
  let ownerId: string;
  let storeId: string;
  let itemId: string;
  const ownerUsername = 'items_test_owner';

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: {
        username: ownerUsername,
        email: 'items-test-owner@example.com',
        passwordHash: 'not-a-real-hash::integration-test-fixture',
      },
    });
    ownerId = owner.id;

    const store = await prisma.store.create({
      data: { ownerId, name: 'Item Detail Test Store' },
    });
    storeId = store.id;

    const item = await prisma.item.create({
      data: {
        storeId,
        name: 'Detail Test Item',
        description: 'An item used for the detail-endpoint test.',
        price: '19.99',
        quantity: 3,
        category: 'Test Category',
        images: { create: [{ url: 'https://example.com/items/detail-1.png' }] },
      },
    });
    itemId = item.id;
  });

  afterAll(async () => {
    // onDelete: Cascade on User -> Store -> Item -> ItemImage means this
    // single delete also removes the store, item, and image — no separate
    // cleanup needed (verified in Milestone 4 step 1's cascade-delete test).
    await prisma.user.delete({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it('returns the item with its images and owning store/owner embedded', async () => {
    const res = await request(app).get(`/api/v1/items/${itemId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        id: itemId,
        name: 'Detail Test Item',
        description: 'An item used for the detail-endpoint test.',
        price: '19.99',
        quantity: 3,
        category: 'Test Category',
        createdAt: expect.any(String),
        images: [{ id: expect.any(String), url: 'https://example.com/items/detail-1.png' }],
        store: {
          id: storeId,
          name: 'Item Detail Test Store',
          owner: { id: ownerId, username: ownerUsername },
        },
      },
      error: null,
    });
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const res = await request(app).get('/api/v1/items/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      data: null,
      error: { code: 'NOT_FOUND', message: expect.any(String) },
    });
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/v1/items/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// Short on purpose: usernames are capped at 30 chars.
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

describe('item mutation routes (ownership through the store)', () => {
  const createdUserIds: string[] = [];
  let ownerAgent: ReturnType<typeof request.agent>;
  let otherAgent: ReturnType<typeof request.agent>;
  let storeId: string;

  // Fresh item per test so mutations never leak between cases.
  async function createItemFixture(): Promise<string> {
    const item = await prisma.item.create({
      data: {
        storeId,
        name: 'Fixture Item',
        price: '10.00',
        quantity: 2,
        category: 'Test Category',
        images: {
          create: [
            { url: 'https://example.com/items/fixture-1.png' },
            { url: 'https://example.com/items/fixture-2.png' },
          ],
        },
      },
    });
    return item.id;
  }

  beforeAll(async () => {
    ownerAgent = request.agent(app);
    createdUserIds.push(await signupViaApi(ownerAgent, 'items_mut_owner'));
    otherAgent = request.agent(app);
    createdUserIds.push(await signupViaApi(otherAgent, 'items_mut_other'));

    const store = await prisma.store.create({
      data: { ownerId: createdUserIds[0]!, name: 'Item Mutation Test Store' },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    // Cascades User -> Store -> Item -> ItemImage.
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  describe('PUT /api/v1/items/:id', () => {
    it('updates the item’s fields when the requester owns its store', async () => {
      const itemId = await createItemFixture();

      const res = await ownerAgent
        .put(`/api/v1/items/${itemId}`)
        .send({ name: 'Renamed Item', price: 12.5, quantity: 0 });

      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
      expect(res.body.data).toMatchObject({
        id: itemId,
        name: 'Renamed Item',
        price: '12.5',
        quantity: 0,
        category: 'Test Category',
      });
      // imageUrls omitted → existing images untouched.
      expect(res.body.data.images).toHaveLength(2);
    });

    it('replaces the image set when imageUrls is provided', async () => {
      const itemId = await createItemFixture();

      const res = await ownerAgent
        .put(`/api/v1/items/${itemId}`)
        .send({ imageUrls: ['https://example.com/items/replacement.png'] });

      expect(res.status).toBe(200);
      expect(res.body.data.images).toEqual([
        { id: expect.any(String), url: 'https://example.com/items/replacement.png' },
      ]);

      const stored = await prisma.itemImage.findMany({ where: { itemId } });
      expect(stored.map((image) => image.url)).toEqual([
        'https://example.com/items/replacement.png',
      ]);
    });

    it('clears all images when imageUrls is an empty array', async () => {
      const itemId = await createItemFixture();

      const res = await ownerAgent.put(`/api/v1/items/${itemId}`).send({ imageUrls: [] });

      expect(res.status).toBe(200);
      expect(res.body.data.images).toEqual([]);
      expect(await prisma.itemImage.count({ where: { itemId } })).toBe(0);
    });

    it('returns 403 when user B tries to edit user A’s item via user A’s store', async () => {
      const itemId = await createItemFixture();

      const res = await otherAgent.put(`/api/v1/items/${itemId}`).send({ name: 'Hijacked Item' });

      expect(res.status).toBe(403);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('FORBIDDEN');

      const stored = await prisma.item.findUnique({ where: { id: itemId } });
      expect(stored?.name).toBe('Fixture Item');
    });

    it('returns 401 when not authenticated', async () => {
      const itemId = await createItemFixture();

      const res = await request(app).put(`/api/v1/items/${itemId}`).send({ name: 'No Session' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 404 when the item does not exist', async () => {
      const res = await ownerAgent
        .put('/api/v1/items/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Does Not Matter' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for a malformed id', async () => {
      const res = await ownerAgent.put('/api/v1/items/not-a-valid-id').send({ name: 'x' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for an empty update body', async () => {
      const itemId = await createItemFixture();

      const res = await ownerAgent.put(`/api/v1/items/${itemId}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for a zero or negative price', async () => {
      const itemId = await createItemFixture();

      for (const price of [0, -5]) {
        const res = await ownerAgent.put(`/api/v1/items/${itemId}`).send({ price });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      }

      const stored = await prisma.item.findUnique({ where: { id: itemId } });
      expect(stored?.price.toString()).toBe('10');
    });

    it('returns 400 for a negative quantity', async () => {
      const itemId = await createItemFixture();

      const res = await ownerAgent.put(`/api/v1/items/${itemId}`).send({ quantity: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/items/:id', () => {
    it('deletes the item and its images when the requester owns its store', async () => {
      const itemId = await createItemFixture();

      const res = await ownerAgent.delete(`/api/v1/items/${itemId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: null, error: null });
      expect(await prisma.item.findUnique({ where: { id: itemId } })).toBeNull();
      expect(await prisma.itemImage.count({ where: { itemId } })).toBe(0);
    });

    it('returns 403 when user B tries to delete user A’s item', async () => {
      const itemId = await createItemFixture();

      const res = await otherAgent.delete(`/api/v1/items/${itemId}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(await prisma.item.findUnique({ where: { id: itemId } })).not.toBeNull();
    });

    it('returns 401 when not authenticated', async () => {
      const itemId = await createItemFixture();

      const res = await request(app).delete(`/api/v1/items/${itemId}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 404 when the item does not exist', async () => {
      const res = await ownerAgent.delete('/api/v1/items/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
