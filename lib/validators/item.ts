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

// Today's "basic upload" stores the browser-compressed photo as a data: URI
// directly (see .claude/plans/unified-crafting-charm.md Phase 15). Only the
// three raster types lib/image.ts can actually produce are accepted —
// SVG is rejected outright (it can carry script; see .agents/rules/
// security.md "File Uploads"), and so is any external URL, since nothing in
// the app generates one and it would let a hand-crafted write plant a
// tracking pixel that fires whenever the owner views their own dashboard.
// Capped well above the ~500KB post-compression target.
const MAX_IMAGE_DATA_URI_LENGTH = 1_000_000;
export const imageUrlSchema = z
  .string()
  .max(MAX_IMAGE_DATA_URI_LENGTH)
  .refine((v) => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(v), {
    message: 'Image must be a JPEG, PNG, or WebP data URI',
  });

// Fits comfortably inside the Item.value column's Decimal(18,2) so an
// oversized number is a clean validation error, not a mid-transaction DB
// write failure surfaced as a generic "could not save".
export const MAX_MONEY = 1e15;

export const addItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: categorySchema,
  value: z.number().nonnegative().finite().max(MAX_MONEY).optional(),
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
