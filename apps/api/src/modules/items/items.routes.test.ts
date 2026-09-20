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
