import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { parseItemFromText } from '@/lib/ai';
import { isTrustedOrigin } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { aiRateLimiter, getClientKey } from '@/lib/rate-limit';

const inputSchema = z.object({ text: z.string().min(1).max(1000) });

// Parses and returns a preview only — never writes to the database. The
// client shows a ParsePreview + ConfirmDialog, then calls the ordinary
// addItem server action on confirm. See .agents/rules/architecture.md.
export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Invalid request origin.' } }, { status: 403 });
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } }, { status: 401 });
    }

    const rateLimit = await aiRateLimiter.check(`${getClientKey(req)}:${session.userId}`);
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

    const result = await parseItemFromText(parsed.data.text);
    return NextResponse.json({ ok: true, data: { result } }, { status: 200 });
  } catch (err) {
    // Never log the input text or the model's completion — see .agents/rules/security.md "Logging".
    logger.error('ai.parse.failed', { error: err instanceof Error ? err.message : 'unknown' });
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: "Couldn't read that. Try describing it differently." } },
      { status: 500 },
    );
  }
}
