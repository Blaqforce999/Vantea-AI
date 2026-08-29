import { NextResponse } from 'next/server';

import { getOrCreateSession } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { getClientKey, guestSessionRateLimiter } from '@/lib/rate-limit';

export async function POST(req: Request) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Invalid request origin.' } }, { status: 403 });
  }

  const rateLimit = guestSessionRateLimiter.check(getClientKey(req));
  if (!rateLimit.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
      { status: 429 },
    );
  }

  try {
    const session = await getOrCreateSession();
    return NextResponse.json({ ok: true, data: { isGuest: session.isGuest } }, { status: 200 });
  } catch (err) {
    logger.error('auth.guest_session.failed', { error: err });
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not start a session.' } },
      { status: 500 },
    );
  }
}
