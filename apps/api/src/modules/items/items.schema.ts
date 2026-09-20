import { z } from 'zod';

export const itemIdParamsSchema = z.object({
  id: z.uuid(),
});
