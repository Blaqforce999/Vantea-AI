import { NextResponse } from 'next/server';

import { isTrustedOrigin } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { EMAIL_ENABLED, requestPasswordReset } from '@/lib/password-reset';
import { forgotPasswordRateLimiter, getClientKey } from '@/lib/rate-limit';
import { forgotPasswordSchema } from '@/lib/validators/auth';

export async function POST(req: Request) {
  if (!EMAIL_ENABLED) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_AVAILABLE', message: 'This feature is not available yet.' } },
      { status: 404 },
    );
  }

  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Invalid request origin.' } }, { status: 403 });
  }

  const rateLimit = forgotPasswordRateLimiter.check(getClientKey(req));
  if (!rateLimit.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
      { status: 429 },
    );
  }

  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Please enter a valid email.' } }, { status: 400 });
  }

  try {
    await requestPasswordReset(parsed.data.email);
  } catch (err) {
    // Still returns the generic success message below — never lets a
    // send failure signal anything about whether the email exists.
    logger.error('auth.forgot_password.failed', { error: err });
  }

  // Same response whether or not the email exists — see requestPasswordReset.
  return NextResponse.json(
    { ok: true, data: { message: 'If that email has an account, a reset link is on its way.' } },
    { status: 200 },
  );
}
