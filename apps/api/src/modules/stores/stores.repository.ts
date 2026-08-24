import { prisma } from '@/lib/prisma';

export type PublicStore = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  createdAt: Date;
  owner: {
    id: string;
    username: string;
  };
};

// select (not include) for the owner relation too — this is what guarantees
// passwordHash/email never leave the database for this query, the same
// reasoning as users.repository's findPublicProfileById.
const publicStoreSelect = {
  id: true,
  name: true,
  description: true,
  location: true,
  createdAt: true,
  owner: { select: { id: true, username: true } },
} as const;

export async function findAllStores(params: {
  page: number;
  limit: number;
}): Promise<{ stores: PublicStore[]; total: number }> {
  const skip = (params.page - 1) * params.limit;

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: publicStoreSelect,
    }),
    prisma.store.count(),
  ]);

  return { stores, total };
}

export async function findStoreById(id: string): Promise<PublicStore | null> {
  return prisma.store.findUnique({
    where: { id },
    select: publicStoreSelect,
  });
}

export type NewStoreInput = {
  ownerId: string;
  name: string;
  description?: string;
  location?: string;
};

export async function createStore(input: NewStoreInput): Promise<PublicStore> {
  return prisma.store.create({
    data: input,
    select: publicStoreSelect,
  });
}
