import { Router } from 'express';
import { createStoreSchema, updateStoreSchema } from '@mosaic/shared';
import { validateBody, validateParams, validateQuery } from '@/middleware/validate';
import { requireAuth } from '@/middleware/requireAuth';
import { requireOwnership } from '@/middleware/requireOwnership';
import { storeIdParamsSchema, storesListQuerySchema } from '@/modules/stores/stores.schema';
import { findStoreOwnerId } from '@/modules/stores/stores.repository';
import {
  listStoresHandler,
  getStoreByIdHandler,
  createStoreHandler,
  updateStoreHandler,
  deleteStoreHandler,
} from '@/modules/stores/stores.controller';

export const storesRouter = Router();

storesRouter.get('/', validateQuery(storesListQuerySchema), listStoresHandler);
storesRouter.get('/:id', validateParams(storeIdParamsSchema), getStoreByIdHandler);
storesRouter.post('/', requireAuth, validateBody(createStoreSchema), createStoreHandler);

storesRouter.put(
  '/:id',
  validateParams(storeIdParamsSchema),
  requireAuth,
  requireOwnership(findStoreOwnerId),
  validateBody(updateStoreSchema),
  updateStoreHandler,
);

storesRouter.delete(
  '/:id',
  validateParams(storeIdParamsSchema),
  requireAuth,
  requireOwnership(findStoreOwnerId),
  deleteStoreHandler,
);
