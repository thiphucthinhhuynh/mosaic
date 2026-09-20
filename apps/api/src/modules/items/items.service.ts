import type { CreateItemInput } from '@mosaic/shared';
import { NotFoundError } from '@/lib/errors';
import {
  findItemsByStoreId,
  findItemById,
  createItem,
  type PublicItem,
  type PublicItemDetail,
} from '@/modules/items/items.repository';

export async function listItemsForStore(
  storeId: string,
  params: { page: number; limit: number },
): Promise<{ items: PublicItem[]; total: number }> {
  return findItemsByStoreId(storeId, params);
}

export async function getItemById(id: string): Promise<PublicItemDetail> {
  const item = await findItemById(id);
  if (!item) {
    throw new NotFoundError(`No item found with id "${id}".`);
  }
  return item;
}

export async function createItemForStore(
  storeId: string,
  input: CreateItemInput,
): Promise<PublicItem> {
  return createItem({ storeId, ...input });
}
