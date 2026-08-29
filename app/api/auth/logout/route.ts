import { NextResponse } from 'next/server';

import { logout } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Invalid request origin.' } }, { status: 403 });
  }

  try {
    await logout();
    return NextResponse.json({ ok: true, data: null }, { status: 200 });
  } catch (err) {
    logger.error('auth.logout.failed', { error: err });
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not log out.' } },
      { status: 500 },
    );
  }
}
