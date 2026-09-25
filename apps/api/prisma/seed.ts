import { prisma } from '../src/lib/prisma';

// Obviously not a real bcrypt hash (those look like `$2b$10$...`) — auth
// isn't implemented until Milestone 2, so there's nothing real to hash yet.
const PLACEHOLDER_PASSWORD_HASH = 'placeholder-hash::not-a-real-credential';

const users = [
  { username: 'ada_lovelace', email: 'ada@example.com', profilePic: null },
  { username: 'grace_hopper', email: 'grace@example.com', profilePic: null },
  {
    username: 'linus_t',
    email: 'linus@example.com',
    profilePic: 'https://example.com/avatars/linus.png',
  },
];

// linus_t is deliberately left without a store, so the seed data also covers
// the "user owns nothing yet" case (e.g. GET /api/v1/users/me/stores empty).
const stores = [
  {
    ownerUsername: 'ada_lovelace',
    name: "Ada's Curiosities",
    description: 'A small shop of interesting things.',
    location: 'London, UK',
  },
  {
    ownerUsername: 'grace_hopper',
    name: 'Hopper Hardware',
    description: null,
    location: null,
  },
];

const items = [
  {
    storeName: "Ada's Curiosities",
    name: 'Brass Pocket Compass',
    description: 'A working antique-style compass.',
    price: '24.99',
    quantity: 5,
    category: 'Collectibles',
    imageUrls: ['https://example.com/items/compass-1.png'],
  },
  {
    storeName: "Ada's Curiosities",
    name: 'Vintage Typewriter',
    description: null,
    price: '150.00',
    quantity: 1,
    category: 'Antiques',
    imageUrls: [],
  },
  {
    storeName: 'Hopper Hardware',
    name: 'Adjustable Wrench',
    description: 'Standard 10-inch adjustable wrench.',
    price: '12.50',
    quantity: 20,
    category: 'Tools',
    imageUrls: ['https://example.com/items/wrench-1.png', 'https://example.com/items/wrench-2.png'],
  },
];

async function main() {
  const userIdByUsername = new Map<string, string>();
  for (const user of users) {
    // upsert keyed on username makes this safe to re-run — a second `prisma
    // db seed` updates nothing rather than failing on the unique constraint.
    const created = await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { ...user, passwordHash: PLACEHOLDER_PASSWORD_HASH },
    });
    userIdByUsername.set(user.username, created.id);
  }
  console.log(`Seeded ${users.length} users.`);

  // Store has no natural unique key to upsert on, so re-runs are made
  // idempotent by checking for an existing (ownerId, name) pair first.
  let storesCreated = 0;
  for (const store of stores) {
    const ownerId = userIdByUsername.get(store.ownerUsername);
    if (!ownerId) continue;

    const existing = await prisma.store.findFirst({
      where: { ownerId, name: store.name },
    });
    if (existing) continue;

    await prisma.store.create({
      data: {
        ownerId,
        name: store.name,
        description: store.description,
        location: store.location,
      },
    });
    storesCreated++;
  }
  console.log(`Seeded ${storesCreated} new store(s) (idempotent — existing ones left as-is).`);

  // Item has no natural unique key either, so re-runs are made idempotent by
  // checking for an existing (storeId, name) pair first, same as stores
  // above. Images are created together with their item in one transaction
  // (Milestone 4 step 3's "transactional multi-row create" pattern, used
  // here too so seeding exercises the same shape production code will).
  let itemsCreated = 0;
  for (const item of items) {
    const store = await prisma.store.findFirst({ where: { name: item.storeName } });
    if (!store) continue;

    const existing = await prisma.item.findFirst({
      where: { storeId: store.id, name: item.name },
    });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          storeId: store.id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
        },
      });
      if (item.imageUrls.length > 0) {
        await tx.itemImage.createMany({
          data: item.imageUrls.map((url) => ({ itemId: created.id, url })),
        });
      }
    });
    itemsCreated++;
  }
  console.log(`Seeded ${itemsCreated} new item(s) (idempotent — existing ones left as-is).`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
