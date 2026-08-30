import { z } from 'zod';

import { imageUrlSchema } from '@/lib/validators/item';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  // Same JPEG/PNG/WebP data-URI-only contract as item images.
  avatarUrl: imageUrlSchema.nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email(),
  currentPassword: z.string().min(1),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
