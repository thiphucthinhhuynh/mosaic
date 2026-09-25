import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export type PublicItemImage = {
  id: string;
  url: string;
};

// price stays a Prisma.Decimal here (not a plain number/string) — this is
// the pre-serialization, server-side shape. Decimal.js's toJSON() kicks in
// when the response is actually sent, turning it into a JSON string (e.g.
// "24.99") rather than a floating-point number, avoiding float precision
// loss for currency — see docs/architecture.md §19.
export type PublicItem = {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  quantity: number;
  category: string;
  createdAt: Date;
  images: PublicItemImage[];
};

export type PublicItemDetail = PublicItem & {
  store: {
    id: string;
    name: string;
    owner: { id: string; username: string };
  };
};

const itemListSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  quantity: true,
  category: true,
  createdAt: true,
  images: { select: { id: true, url: true } },
} as const;

// Adds the owning store (and its owner) — the item-list-within-a-store
// endpoint doesn't need this since the store is already known from the URL,
// but a standalone item detail page does.
const itemDetailSelect = {
  ...itemListSelect,
  store: { select: { id: true, name: true, owner: { select: { id: true, username: true } } } },
} as const;

export async function findItemsByStoreId(
  storeId: string,
  params: { page: number; limit: number },
): Promise<{ items: PublicItem[]; total: number }> {
  const skip = (params.page - 1) * params.limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: { storeId },
      skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: itemListSelect,
    }),
    prisma.item.count({ where: { storeId } }),
  ]);

  return { items, total };
}

export async function findItemById(id: string): Promise<PublicItemDetail | null> {
  return prisma.item.findUnique({
    where: { id },
    select: itemDetailSelect,
  });
}

export type NewItemInput = {
  storeId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: string;
  imageUrls?: string[];
};

// The item and its images are created in one transaction, per this
// milestone's DoD, so a failure partway through (e.g. an image insert
// failing) can never leave an item with no images or a half-populated set —
// either both writes land or neither does.
export async function createItem(input: NewItemInput): Promise<PublicItem> {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.create({
      data: {
        storeId: input.storeId,
        name: input.name,
        description: input.description,
        price: input.price,
        quantity: input.quantity,
        category: input.category,
      },
    });

    if (input.imageUrls && input.imageUrls.length > 0) {
      await tx.itemImage.createMany({
        data: input.imageUrls.map((url) => ({ itemId: item.id, url })),
      });
    }

    return tx.item.findUniqueOrThrow({ where: { id: item.id }, select: itemListSelect });
  });
}

// Loader for requireOwnership. An item has no ownerId column — ownership is
// derived through its store — so this selects the store's ownerId and
// flattens it into the `{ ownerId }` shape the middleware expects. This is
// the whole "ownership through a relation" mechanism: the middleware itself
// stays unaware that the owner is one hop away.
export async function findItemOwnerId(id: string): Promise<{ ownerId: string } | null> {
  const item = await prisma.item.findUnique({
    where: { id },
    select: { store: { select: { ownerId: true } } },
  });
  return item ? { ownerId: item.store.ownerId } : null;
}

export type ItemUpdate = {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
  imageUrls?: string[];
};

// Like createItem, this is one transaction: replacing the image set is a
// delete followed by an insert, and a failure between the two must not leave
// the item with its old images gone and no new ones. imageUrls undefined
// means "leave images alone" — distinct from [], which clears them.
export async function updateItemById(id: string, input: ItemUpdate): Promise<PublicItem> {
  const { imageUrls, ...fields } = input;

  return prisma.$transaction(async (tx) => {
    await tx.item.update({ where: { id }, data: fields });

    if (imageUrls !== undefined) {
      await tx.itemImage.deleteMany({ where: { itemId: id } });
      if (imageUrls.length > 0) {
        await tx.itemImage.createMany({ data: imageUrls.map((url) => ({ itemId: id, url })) });
      }
    }

    return tx.item.findUniqueOrThrow({ where: { id }, select: itemListSelect });
  });
}

// ItemImage rows go with it via onDelete: Cascade.
export async function deleteItemById(id: string): Promise<void> {
  await prisma.item.delete({ where: { id } });
}
