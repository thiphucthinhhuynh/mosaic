import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { CreateStoreInput, UpdateStoreInput } from '@mosaic/shared';
import { asyncHandler } from '@/lib/asyncHandler';
import { sendSuccess } from '@/lib/response';
import {
  listStores,
  getStoreById,
  createStoreForOwner,
  updateStore,
  deleteStore,
} from '@/modules/stores/stores.service';
import type { storeIdParamsSchema, storesListQuerySchema } from '@/modules/stores/stores.schema';

type StoreIdParams = z.infer<typeof storeIdParamsSchema>;
type StoresListQuery = z.infer<typeof storesListQuerySchema>;

export const listStoresHandler = asyncHandler(
  async (_req: Request, res: Response<unknown, { query: StoresListQuery }>) => {
    const { page, limit } = res.locals.query;
    const { stores, total } = await listStores({ page, limit });
    sendSuccess(res, stores, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  },
);

export const getStoreByIdHandler = asyncHandler(
  async (req: Request<StoreIdParams>, res: Response) => {
    const store = await getStoreById(req.params.id);
    sendSuccess(res, store);
  },
);

export const createStoreHandler = asyncHandler(
  async (req: Request<object, unknown, CreateStoreInput>, res: Response) => {
    // req.user is guaranteed by requireAuth, which always runs before this
    // handler in stores.routes.ts.
    const store = await createStoreForOwner(req.user!.id, req.body);
    sendSuccess(res, store, 201);
  },
);

export const updateStoreHandler = asyncHandler(
  async (req: Request<StoreIdParams, unknown, UpdateStoreInput>, res: Response) => {
    // Existence and ownership are already enforced by requireOwnership,
    // which always runs before this handler in stores.routes.ts.
    const store = await updateStore(req.params.id, req.body);
    sendSuccess(res, store);
  },
);

export const deleteStoreHandler = asyncHandler(
  async (req: Request<StoreIdParams>, res: Response) => {
    await deleteStore(req.params.id);
    sendSuccess(res, null);
  },
);
