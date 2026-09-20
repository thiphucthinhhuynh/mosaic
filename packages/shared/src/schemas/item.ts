import { z } from 'zod';

// price's max mirrors the Item model's DB column cap (Decimal(10, 2) — 8
// integer digits, 2 decimal digits) so an over-cap value gets a clean 400
// here instead of a raw DB error, same reasoning as store.ts's name/location
// max lengths.
export const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  price: z.number().positive().max(99999999.99),
  quantity: z.number().int().min(0),
  category: z.string().min(1).max(50),
  imageUrls: z.array(z.url()).optional(),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;
