import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { UpdateItemInput } from '@mosaic/shared';
import { asyncHandler } from '@/lib/asyncHandler';
import { sendSuccess } from '@/lib/response';
import { getItemById, updateItem, deleteItem } from '@/modules/items/items.service';
import type { itemIdParamsSchema } from '@/modules/items/items.schema';

type ItemIdParams = z.infer<typeof itemIdParamsSchema>;

export const getItemByIdHandler = asyncHandler(
  async (req: Request<ItemIdParams>, res: Response) => {
    const item = await getItemById(req.params.id);
    sendSuccess(res, item);
  },
);

export const updateItemHandler = asyncHandler(
  async (req: Request<ItemIdParams, unknown, UpdateItemInput>, res: Response) => {
    // Existence and ownership are already enforced by requireOwnership,
    // which always runs before this handler in items.routes.ts.
    const item = await updateItem(req.params.id, req.body);
    sendSuccess(res, item);
  },
);

export const deleteItemHandler = asyncHandler(async (req: Request<ItemIdParams>, res: Response) => {
  await deleteItem(req.params.id);
  sendSuccess(res, null);
});
