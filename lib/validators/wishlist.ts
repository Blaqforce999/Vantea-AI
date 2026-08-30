import { z } from 'zod';

import { categorySchema, MAX_MONEY } from '@/lib/validators/item';

export const prioritySchema = z.enum(['NOW', 'SOON', 'SOMEDAY']);
export const wishlistStatusSchema = z.enum(['WANTED', 'ACQUIRED', 'ARCHIVED']);

export const addWishlistItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: categorySchema,
  estimatedValue: z.number().nonnegative().finite().max(MAX_MONEY).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  priority: prioritySchema.default('SOMEDAY'),
});

export const editWishlistItemSchema = addWishlistItemSchema.partial().extend({
  id: z.string().cuid(),
  status: wishlistStatusSchema.optional(),
});

export const deleteWishlistItemSchema = z.object({ id: z.string().cuid() });

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type EditWishlistItemInput = z.infer<typeof editWishlistItemSchema>;
