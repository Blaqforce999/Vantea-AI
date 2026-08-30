import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  cursor: z.string().cuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } }, { status: 401 });
    }

    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid request.' } }, { status: 400 });
    }

    const items = await db.item.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(parsed.data.cursor && { cursor: { id: parsed.data.cursor }, skip: 1 }),
    });

    const serialized = items.map((item) => ({
      ...item,
      value: item.value ? item.value.toFixed(2) : null,
    }));

    return NextResponse.json({ ok: true, data: { items: serialized } }, { status: 200 });
  } catch (err) {
    logger.error('items.list.failed', { error: err instanceof Error ? err.message : 'unknown' });
    return NextResponse.json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } }, { status: 500 });
  }
}
