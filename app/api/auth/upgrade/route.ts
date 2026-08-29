import { NextResponse } from 'next/server';

import { upgradeGuestToAccount } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { signupRateLimiter, getClientKey } from '@/lib/rate-limit';
import { signupSchema } from '@/lib/validators/auth';

export async function POST(req: Request) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Invalid request origin.' } }, { status: 403 });
  }

  const rateLimit = signupRateLimiter.check(getClientKey(req));
  if (!rateLimit.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
      { status: 429 },
    );
  }

  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check your details.' } },
      { status: 400 },
    );
  }

  try {
    const result = await upgradeGuestToAccount(parsed.data);
    if (!result.ok) {
      const status = result.error.code === 'EMAIL_TAKEN' ? 409 : result.error.code === 'UNAUTHENTICATED' ? 401 : 500;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error('auth.upgrade.route_failed', { error: err });
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not upgrade this session.' } },
      { status: 500 },
    );
  }
}
