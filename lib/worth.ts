import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import type { CurrencyTotal, PrismaTx } from '@/lib/types';

/**
 * Writes a silent WorthSnapshot for every currency the user currently holds
 * valued items in. Called inside the same db.$transaction as the item write
 * that triggered it, so the snapshot never drifts from the items it
 * summarizes. WorthSnapshot is append-only — never update or delete a row.
 *
 * If the user has no valued items yet (only unvalued Skills/Places/People
 * entries), there is nothing to snapshot.
 */
export async function recordWorthSnapshot(tx: PrismaTx, userId: string): Promise<void> {
  const totals = await tx.item.groupBy({
    by: ['currency'],
    where: { userId, value: { not: null }, currency: { not: null } },
    _sum: { value: true },
    _count: { _all: true },
  });

  const rows = totals.filter(
    (t): t is typeof t & { currency: string; _sum: { value: Prisma.Decimal } } =>
      t.currency !== null && t._sum.value !== null,
  );

  if (rows.length === 0) return;

  await tx.worthSnapshot.createMany({
    data: rows.map((t) => ({
      userId,
      currency: t.currency,
      totalValue: t._sum.value,
      itemCount: t._count._all,
    })),
  });
}

/**
 * Live per-currency totals, computed directly from Items (not from
 * snapshots) so "Your Worth" always reflects exactly what's currently
 * recorded. Never sums across currencies — see .agents/rules/architecture.md
 * "Currency Rules": V1 does no conversion.
 */
export async function getCurrentWorthByCurrency(userId: string): Promise<CurrencyTotal[]> {
  const totals = await db.item.groupBy({
    by: ['currency'],
    where: { userId, value: { not: null }, currency: { not: null } },
    _sum: { value: true },
    _count: { _all: true },
  });

  return totals
    .filter((t): t is typeof t & { currency: string } => t.currency !== null && t._sum.value !== null)
    .map((t) => ({
      currency: t.currency,
      total: t._sum.value!.toFixed(2),
      itemCount: t._count._all,
    }));
}

/**
 * The single total to feature large as the WorthFigure: the user's own
 * baseCurrency. Other currencies (if any) are shown in the breakdown
 * alongside it — never combined into one fabricated number.
 */
export async function getFeaturedWorth(
  userId: string,
): Promise<{ featured: CurrencyTotal; breakdown: CurrencyTotal[] }> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { baseCurrency: true } });
  const breakdown = await getCurrentWorthByCurrency(userId);

  const featured = breakdown.find((t) => t.currency === user.baseCurrency) ?? {
    currency: user.baseCurrency,
    total: '0.00',
    itemCount: 0,
  };

  return { featured, breakdown };
}

/** Category breakdown for a single currency — mixing currencies into one chart would misrepresent the data. */
export async function getCategoryBreakdown(
  userId: string,
  currency: string,
): Promise<{ category: string; total: string }[]> {
  const totals = await db.item.groupBy({
    by: ['category'],
    where: { userId, currency, value: { not: null } },
    _sum: { value: true },
  });

  return totals
    .filter((t): t is typeof t & { _sum: { value: Prisma.Decimal } } => t._sum.value !== null)
    .map((t) => ({ category: t.category, total: t._sum.value.toFixed(2) }));
}

/** Chronological WorthSnapshot series for one currency — the raw data behind the dashboard's line chart. */
export async function getWorthHistory(
  userId: string,
  currency: string,
): Promise<{ capturedAt: Date; totalValue: string }[]> {
  const snapshots = await db.worthSnapshot.findMany({
    where: { userId, currency },
    orderBy: { capturedAt: 'asc' },
    select: { capturedAt: true, totalValue: true },
  });

  return snapshots.map((s) => ({ capturedAt: s.capturedAt, totalValue: s.totalValue.toFixed(2) }));
}

const GROWTH_LOOKBACK_MIN_DAYS = 300;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type WorthGrowth = { percent: number; absolute: number };

/**
 * Change (percent and absolute) vs. the nearest snapshot at least ~300 days
 * old. Returns null (never a fabricated or mislabeled figure) when there
 * isn't yet a snapshot that old — the dashboard's "+X% This Year" chip and
 * "X more than last year" pill simply don't render in that case rather than
 * showing growth over some shorter, unlabeled window.
 */
export async function getWorthGrowth(userId: string, currency: string): Promise<WorthGrowth | null> {
  const cutoff = new Date(Date.now() - GROWTH_LOOKBACK_MIN_DAYS * MS_PER_DAY);

  const [current, past] = await Promise.all([
    db.worthSnapshot.findFirst({ where: { userId, currency }, orderBy: { capturedAt: 'desc' } }),
    db.worthSnapshot.findFirst({
      where: { userId, currency, capturedAt: { lte: cutoff } },
      orderBy: { capturedAt: 'desc' },
    }),
  ]);

  if (!current || !past) return null;

  const pastValue = Number(past.totalValue);
  if (pastValue === 0) return null;

  const currentValue = Number(current.totalValue);
  return { percent: ((currentValue - pastValue) / pastValue) * 100, absolute: currentValue - pastValue };
}
