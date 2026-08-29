import { NextResponse } from 'next/server';

import { login } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { getClientKey, loginRateLimiter } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validators/auth';

export async function POST(req: Request) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Invalid request origin.' } }, { status: 403 });
  }

  const rateLimit = loginRateLimiter.check(getClientKey(req));
  if (!rateLimit.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
      { status: 429 },
    );
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check your details.' } },
      { status: 400 },
    );
  }

  try {
    const result = await login(parsed.data);
    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error('auth.login.route_failed', { error: err });
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not log in.' } },
      { status: 500 },
    );
  }
}
