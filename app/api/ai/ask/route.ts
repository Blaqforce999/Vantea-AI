import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { askVantea } from '@/lib/ai';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { aiRateLimiter, getClientKey } from '@/lib/rate-limit';

const inputSchema = z.object({ question: z.string().min(1).max(500) });

// Read-only: answers using only the requesting user's own data. Never writes.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } }, { status: 401 });
    }

    const rateLimit = aiRateLimiter.check(`${getClientKey(req)}:${session.userId}`);
    if (!rateLimit.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
        { status: 429 },
      );
    }

    const parsed = inputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid request.' } }, { status: 400 });
    }

    const answer = await askVantea(session.userId, parsed.data.question);
    return NextResponse.json({ ok: true, data: { answer } }, { status: 200 });
  } catch (err) {
    logger.error('ai.ask.failed', { error: err instanceof Error ? err.message : 'unknown' });
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: "Couldn't answer that right now." } },
      { status: 500 },
    );
  }
}
