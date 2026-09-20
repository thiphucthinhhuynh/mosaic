import type { Request, Response } from 'express';
import type { z } from 'zod';
import { asyncHandler } from '@/lib/asyncHandler';
import { sendSuccess } from '@/lib/response';
import { getItemById } from '@/modules/items/items.service';
import type { itemIdParamsSchema } from '@/modules/items/items.schema';

type ItemIdParams = z.infer<typeof itemIdParamsSchema>;

export const getItemByIdHandler = asyncHandler(
  async (req: Request<ItemIdParams>, res: Response) => {
    const item = await getItemById(req.params.id);
    sendSuccess(res, item);
  },
);
