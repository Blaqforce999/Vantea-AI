import { NextResponse } from 'next/server';

import { isTrustedOrigin } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { EMAIL_ENABLED, resetPassword } from '@/lib/password-reset';
import { getClientKey, resetPasswordRateLimiter } from '@/lib/rate-limit';
import { resetPasswordSchema } from '@/lib/validators/auth';

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

  const rateLimit = await resetPasswordRateLimiter.check(getClientKey(req));
  if (!rateLimit.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
      { status: 429 },
    );
  }

  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Please check your details.' } }, { status: 400 });
  }

  try {
    const result = await resetPassword(parsed.data.token, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error('auth.reset_password.route_failed', { error: err });
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not reset your password.' } },
      { status: 500 },
    );
  }
}
