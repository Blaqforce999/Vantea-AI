import { db } from '@/lib/db';
import { getFeaturedWorth } from '@/lib/worth';

export type YearOfBuildingRecap = {
  year: number;
  itemsAddedCount: number;
  milestonesCount: number;
  currentWorth: { currency: string; total: string } | null;
  worthAtYearStart: string | null;
  highlightNote: { itemName: string; note: string } | null;
};

/**
 * Composes the current calendar year's recap entirely from the user's own
 * recorded data — no external information, nothing comparative. See
 * .agents/rules/design-system.md "Recap / Year of Building Card Layout".
 */
export async function getYearOfBuildingRecap(userId: string): Promise<YearOfBuildingRecap> {
  const now = new Date();
  const year = now.getFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));

  const [itemsThisYear, milestonesThisYear, { featured }, earliestSnapshotThisYear, itemWithNote] = await Promise.all([
    db.item.count({ where: { userId, createdAt: { gte: yearStart } } }),
    db.milestone.count({ where: { userId, achievedAt: { gte: yearStart } } }),
    getFeaturedWorth(userId),
    db.worthSnapshot.findFirst({
      where: { userId, capturedAt: { gte: yearStart } },
      orderBy: { capturedAt: 'asc' },
    }),
    db.item.findFirst({
      where: { userId, createdAt: { gte: yearStart }, whyNote: { not: null } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    year,
    itemsAddedCount: itemsThisYear,
    milestonesCount: milestonesThisYear,
    currentWorth: featured.itemCount > 0 ? { currency: featured.currency, total: featured.total } : null,
    worthAtYearStart: earliestSnapshotThisYear ? earliestSnapshotThisYear.totalValue.toFixed(2) : null,
    highlightNote: itemWithNote?.whyNote ? { itemName: itemWithNote.name, note: itemWithNote.whyNote } : null,
  };
}
