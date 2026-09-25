import { Router } from 'express';
import { updateItemSchema } from '@mosaic/shared';
import { validateBody, validateParams } from '@/middleware/validate';
import { requireAuth } from '@/middleware/requireAuth';
import { requireOwnership } from '@/middleware/requireOwnership';
import { itemIdParamsSchema } from '@/modules/items/items.schema';
import { findItemOwnerId } from '@/modules/items/items.repository';
import {
  getItemByIdHandler,
  updateItemHandler,
  deleteItemHandler,
} from '@/modules/items/items.controller';

export const itemsRouter = Router();

itemsRouter.get('/:id', validateParams(itemIdParamsSchema), getItemByIdHandler);

// Same middleware order as the store routes — authorization runs before body
// validation, so a non-owner's request 403s without revealing whether its
// payload would have been valid. The owner is resolved through the item's
// store (findItemOwnerId), not a column on the item itself.
itemsRouter.put(
  '/:id',
  validateParams(itemIdParamsSchema),
  requireAuth,
  requireOwnership(findItemOwnerId),
  validateBody(updateItemSchema),
  updateItemHandler,
);

itemsRouter.delete(
  '/:id',
  validateParams(itemIdParamsSchema),
  requireAuth,
  requireOwnership(findItemOwnerId),
  deleteItemHandler,
);
