'use server';

import { cookies } from 'next/headers';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/**
 * Everything Vantea stores about this user — the full export, no exceptions
 * and no external data. See .agents/rules/security.md "Privacy".
 */
export async function exportMyData(): Promise<ActionResult<Record<string, unknown>>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  try {
    const [user, items, snapshots, wishlist, goals, milestones] = await Promise.all([
      db.user.findUniqueOrThrow({
        where: { id: session.userId },
        select: { id: true, name: true, email: true, baseCurrency: true, isGuest: true, createdAt: true },
      }),
      db.item.findMany({ where: { userId: session.userId } }),
      db.worthSnapshot.findMany({ where: { userId: session.userId } }),
      db.wishlistItem.findMany({ where: { userId: session.userId } }),
      db.goal.findMany({ where: { userId: session.userId } }),
      db.milestone.findMany({ where: { userId: session.userId } }),
    ]);

    // Server Actions serialize their return value across the server/client
    // boundary the same way Server Components do — a raw Prisma Decimal
    // instance (Item.value, WorthSnapshot.totalValue,
    // WishlistItem.estimatedValue, Goal.targetValue/currentProgress) fails
    // that with "Only plain objects can be passed to Client Components."
    // Every Decimal must be serialized to a string first.
    const exportData = {
      user,
      items: items.map((item) => ({ ...item, value: item.value?.toFixed(2) ?? null })),
      snapshots: snapshots.map((s) => ({ ...s, totalValue: s.totalValue.toFixed(2) })),
      wishlist: wishlist.map((w) => ({ ...w, estimatedValue: w.estimatedValue?.toFixed(2) ?? null })),
      goals: goals.map((g) => ({
        ...g,
        targetValue: g.targetValue?.toFixed(2) ?? null,
        currentProgress: g.currentProgress?.toFixed(2) ?? null,
      })),
      milestones,
    };

    logger.info('privacy.export', { userId: session.userId });
    return { ok: true, data: exportData };
  } catch (err) {
    logger.error('privacy.export.failed', { userId: session.userId, error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not export your data.' } };
  }
}

/**
 * Hard-deletes the user row. onDelete: Cascade on every child relation
 * removes items, snapshots, wishlist, goals, milestones, and sessions in the
 * same operation — this is a real delete, not a soft-delete flag.
 */
export async function deleteMyAccount(): Promise<ActionResult<null>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  try {
    await db.user.delete({ where: { id: session.userId } });

    const cookieStore = await cookies();
    cookieStore.delete('vantea_session');

    logger.info('privacy.account_deleted', { userId: session.userId });
    return { ok: true, data: null };
  } catch (err) {
    logger.error('privacy.account_delete.failed', { userId: session.userId, error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not delete your account. Nothing was changed.' } };
  }
}
