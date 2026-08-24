import type { CreateStoreInput } from '@mosaic/shared';
import { NotFoundError } from '@/lib/errors';
import {
  findAllStores,
  findStoreById,
  createStore,
  type PublicStore,
} from '@/modules/stores/stores.repository';

export async function listStores(params: {
  page: number;
  limit: number;
}): Promise<{ stores: PublicStore[]; total: number }> {
  return findAllStores(params);
}

export async function getStoreById(id: string): Promise<PublicStore> {
  const store = await findStoreById(id);
  if (!store) {
    throw new NotFoundError(`No store found with id "${id}".`);
  }
  return store;
}

// ownerId comes from the caller's authenticated session (req.user.id), never
// from the request body — createStoreSchema has no ownerId field, so there's
// nothing for a client to spoof even if it tried.
export async function createStoreForOwner(
  ownerId: string,
  input: CreateStoreInput,
): Promise<PublicStore> {
  return createStore({ ownerId, ...input });
}
