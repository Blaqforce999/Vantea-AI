import { z } from 'zod';

// Same "https:// or a compressed data: URI" contract as item images — see
// lib/validators/item.ts.
const MAX_IMAGE_DATA_URI_LENGTH = 1_000_000;
const avatarUrlSchema = z
  .string()
  .max(MAX_IMAGE_DATA_URI_LENGTH)
  .refine((v) => v.startsWith('https://') || v.startsWith('data:image/'), {
    message: 'Avatar must be an https:// URL or an image data URI',
  });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatarUrl: avatarUrlSchema.nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email(),
  currentPassword: z.string().min(1),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
