import { Router } from 'express';
import { createStoreSchema } from '@mosaic/shared';
import { validateBody, validateParams, validateQuery } from '@/middleware/validate';
import { requireAuth } from '@/middleware/requireAuth';
import { storeIdParamsSchema, storesListQuerySchema } from '@/modules/stores/stores.schema';
import {
  listStoresHandler,
  getStoreByIdHandler,
  createStoreHandler,
} from '@/modules/stores/stores.controller';

export const storesRouter = Router();

storesRouter.get('/', validateQuery(storesListQuerySchema), listStoresHandler);
storesRouter.get('/:id', validateParams(storeIdParamsSchema), getStoreByIdHandler);
storesRouter.post('/', requireAuth, validateBody(createStoreSchema), createStoreHandler);
