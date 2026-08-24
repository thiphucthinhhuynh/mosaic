import { Router } from 'express';
import { validateParams, validateQuery } from '@/middleware/validate';
import { storeIdParamsSchema, storesListQuerySchema } from '@/modules/stores/stores.schema';
import { listStoresHandler, getStoreByIdHandler } from '@/modules/stores/stores.controller';

export const storesRouter = Router();

storesRouter.get('/', validateQuery(storesListQuerySchema), listStoresHandler);
storesRouter.get('/:id', validateParams(storeIdParamsSchema), getStoreByIdHandler);
