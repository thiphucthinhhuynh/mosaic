import { Router } from 'express';
import { validateParams } from '@/middleware/validate';
import { itemIdParamsSchema } from '@/modules/items/items.schema';
import { getItemByIdHandler } from '@/modules/items/items.controller';

export const itemsRouter = Router();

itemsRouter.get('/:id', validateParams(itemIdParamsSchema), getItemByIdHandler);
