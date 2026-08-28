import { z } from 'zod';

// max lengths mirror the Store model's DB column caps (name: VARCHAR(100),
// location: VARCHAR(255)) — Zod rejects an over-length value with a clean
// 400 before it ever reaches Postgres, which would otherwise reject it with
// a raw DB error. description has no DB-level cap (Text), so 2000 is an
// application-level choice to keep an otherwise-unbounded field reasonable.
export const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  location: z.string().max(255).optional(),
});
export type CreateStoreInput = z.infer<typeof createStoreSchema>;

// Same field constraints as createStoreSchema, all optional — a PUT can
// change any subset of fields. Rejects an empty body outright rather than
// silently accepting a no-op update.
export const updateStoreSchema = createStoreSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
