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

// Same field constraints as createItemSchema, all optional — a PUT can change
// any subset of fields (same convention as updateStoreSchema). Rejects an
// empty body outright rather than silently accepting a no-op update.
//
// imageUrls is a *replacement* set, not a patch: when present, the item's
// images become exactly this list (an empty array clears them); when omitted,
// the existing images are left untouched. This matches how the edit form
// works — it submits the full pre-filled list of URLs — and avoids inventing
// add/remove-by-id semantics for a milestone that only needs URL inputs.
export const updateItemSchema = createItemSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
