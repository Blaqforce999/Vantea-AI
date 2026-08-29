import { Category, MilestoneType, Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const ALL_CATEGORIES = Object.values(Category);
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Every type except NEW_HIGH is once-only; NEW_HIGH is the deliberate
// recurring exception (see skills/db-migration-runner/SKILL.md). Do not add a
// blanket @@unique([userId, type]) to the Milestone model — it would break
// NEW_HIGH.
const ONCE_ONLY_TYPES: MilestoneType[] = [
  MilestoneType.FIRST_THING,
  MilestoneType.TEN_THINGS,
  MilestoneType.FIRST_PROPERTY,
  MilestoneType.CATEGORY_FILLED,
  MilestoneType.ONE_YEAR,
];

/**
 * Evaluates every milestone deterministically and awards any newly-earned
 * ones inside a single transaction, so a re-run (or a concurrent call) never
 * double-awards a once-only milestone. Call this after the item write (and
 * its WorthSnapshot) has already committed.
 */
export type AwardedMilestone = { type: MilestoneType; payload?: Prisma.InputJsonValue };

export async function checkMilestones(userId: string): Promise<AwardedMilestone[]> {
  return db.$transaction(async (tx) => {
    const [itemCount, categoryRows, propertyCount, user, existing, currentTotals] = await Promise.all([
      tx.item.count({ where: { userId } }),
      tx.item.findMany({ where: { userId }, distinct: ['category'], select: { category: true } }),
      tx.item.count({ where: { userId, category: Category.HOME_AND_LAND } }),
      tx.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } }),
      tx.milestone.findMany({ where: { userId }, select: { type: true, payload: true } }),
      tx.item.groupBy({
        by: ['currency'],
        where: { userId, value: { not: null }, currency: { not: null } },
        _sum: { value: true },
      }),
    ]);

    const alreadyAwarded = new Set(
      existing.filter((m) => ONCE_ONLY_TYPES.includes(m.type)).map((m) => m.type),
    );

    const toAward: AwardedMilestone[] = [];

    const award = (type: MilestoneType, payload?: Prisma.InputJsonValue) => {
      if (ONCE_ONLY_TYPES.includes(type) && alreadyAwarded.has(type)) return;
      toAward.push({ type, payload });
    };

    if (itemCount >= 1) award(MilestoneType.FIRST_THING);
    if (itemCount >= 10) award(MilestoneType.TEN_THINGS);
    if (propertyCount >= 1) award(MilestoneType.FIRST_PROPERTY);
    if (categoryRows.length >= ALL_CATEGORIES.length) award(MilestoneType.CATEGORY_FILLED);
    if (Date.now() - user.createdAt.getTime() >= ONE_YEAR_MS) award(MilestoneType.ONE_YEAR);

    // NEW_HIGH: compare the current live total per currency against the
    // highest value ever awarded as a NEW_HIGH for that currency. Tracking
    // "prior high" via past NEW_HIGH payloads (rather than WorthSnapshot
    // rows) keeps this idempotent no matter how many times checkMilestones
    // is called for the same underlying state — a snapshot-position-based
    // comparison would re-fire on every redundant call since nothing marks
    // a total as "already the recorded high."
    const priorMaxByCurrency = new Map<string, Prisma.Decimal>();
    for (const m of existing) {
      if (m.type !== MilestoneType.NEW_HIGH || !m.payload || typeof m.payload !== 'object') continue;
      const payload = m.payload as { value?: string; currency?: string };
      if (!payload.value || !payload.currency) continue;
      const value = new Prisma.Decimal(payload.value);
      const current = priorMaxByCurrency.get(payload.currency) ?? new Prisma.Decimal(0);
      if (value.greaterThan(current)) priorMaxByCurrency.set(payload.currency, value);
    }

    for (const total of currentTotals) {
      if (!total.currency || total._sum.value === null) continue;
      const priorMax = priorMaxByCurrency.get(total.currency) ?? new Prisma.Decimal(0);
      if (total._sum.value.greaterThan(priorMax)) {
        award(MilestoneType.NEW_HIGH, { value: total._sum.value.toFixed(2), currency: total.currency });
      }
    }

    if (toAward.length === 0) return toAward;

    await tx.milestone.createMany({
      data: toAward.map((m) => ({ userId, type: m.type, payload: m.payload })),
    });

    logger.info('milestones.awarded', { userId, types: toAward.map((m) => m.type) });
    return toAward;
  });
}
