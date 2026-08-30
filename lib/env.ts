import { z } from 'zod';

/**
 * Validated at import time. If a required variable is missing, the process
 * throws immediately rather than letting the app run half-configured.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Optional, not required: the current session model (lib/auth.ts) is a
  // stateful opaque-token design — a 256-bit random token in the cookie,
  // its SHA-256 in the DB — with no signing or encryption secret anywhere.
  // Nothing reads SESSION_SECRET. It's kept in the schema (validated only
  // when present) so a future stateless/signed session design has a slot,
  // without letting its absence 500 the routes that import this module.
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
  // Only referenced in a not-yet-built password-reset email template. csrf.ts
  // deliberately checks the request's own Host instead of this. Optional so
  // an unset value doesn't crash the module at import time.
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  // Password reset stays feature-flagged off (see lib/password-reset.ts)
  // until both are set — no email provider is wired up yet.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. See logged field errors above.');
}

export const env = parsed.data;
