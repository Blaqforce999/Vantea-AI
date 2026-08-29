import { z } from 'zod';

// Mirrors the inline checklist shown on the signup form (components/auth/AuthForm.tsx):
// 8+ characters, 1 uppercase letter, 1 number, 1 special character. Keep both in sync.
const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(200)
  .regex(/[A-Z]/, 'At least 1 uppercase letter')
  .regex(/[0-9]/, 'At least 1 number')
  .regex(/[^A-Za-z0-9]/, 'At least 1 special character');

export const signupSchema = z.object({
  email: z.string().email().max(254),
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(200),
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
