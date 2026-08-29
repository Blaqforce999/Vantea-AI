import { z } from 'zod';

export const categorySchema = z.enum([
  'HOME_AND_LAND',
  'CARS_AND_VEHICLES',
  'TECH',
  'MONEY',
  'JEWELRY_AND_LUXURY',
  'BUSINESS',
  'COLLECTIONS',
  'SKILLS',
  'PLACES',
  'PEOPLE',
  'OTHER',
]);

// Accepts a real URL (future object-storage path) or a compressed data: URI
// (today's "basic upload" — see .claude/plans/unified-crafting-charm.md
// Phase 15). Capped well above the ~500KB post-compression target to leave
// headroom without allowing arbitrarily large payloads into the DB.
const MAX_IMAGE_DATA_URI_LENGTH = 1_000_000;
const imageUrlSchema = z
  .string()
  .max(MAX_IMAGE_DATA_URI_LENGTH)
  .refine((v) => v.startsWith('https://') || v.startsWith('data:image/'), {
    message: 'Image must be an https:// URL or an image data URI',
  });

export const addItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: categorySchema,
  value: z.number().nonnegative().finite().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  acquiredDate: z.coerce.date().optional(),
  whyNote: z.string().max(500).optional(),
  imageUrl: imageUrlSchema.optional(),
});

export const editItemSchema = addItemSchema.partial().extend({
  id: z.string().cuid(),
});

export const deleteItemSchema = z.object({
  id: z.string().cuid(),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type EditItemInput = z.infer<typeof editItemSchema>;
