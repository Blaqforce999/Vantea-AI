import { DurationLabel } from '@/components/timeline/DurationLabel';
import { TimelineEntry } from '@/components/timeline/TimelineEntry';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getFeaturedWorth } from '@/lib/worth';
import { Hourglass } from 'lucide-react';

// Live but intentionally unlinked from nav — not a page to index.
export const metadata = { robots: { index: false, follow: false } };

export default async function TimelinePage() {
  const session = await getSession();
  if (!session) return null;

  const items = await db.item.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'asc' },
  });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Hourglass}
        title="Your journey starts here"
        description="Add the first thing you've built to begin your timeline."
      />
    );
  }

  const { featured } = await getFeaturedWorth(session.userId);
  const snapshots = await db.worthSnapshot.findMany({
    where: { userId: session.userId, currency: featured.currency },
    orderBy: { capturedAt: 'asc' },
  });

  return (
    <div className="flex flex-col gap-32">
      <PageHeader title="Your Journey" description="How far you've come, not just what it's worth." />

      <DurationLabel since={items[0].createdAt} startCount={1} currentCount={items.length} />

      {snapshots.length > 0 && (
        <section className="flex flex-col gap-12">
          <h2 className="text-heading-h3 text-warm-ink">Growth over time ({featured.currency})</h2>
          <ul className="flex flex-col gap-8">
            {snapshots.map((snapshot) => (
              <li key={snapshot.id} className="flex justify-between text-body-small text-on-surface-variant">
                <span>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(snapshot.capturedAt)}</span>
                <span>
                  {snapshot.itemCount} {snapshot.itemCount === 1 ? 'thing' : 'things'} · {featured.currency}{' '}
                  {Number(snapshot.totalValue).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-12">
        <h2 className="text-heading-h3 text-warm-ink">Everything, in order</h2>
        <ul className="flex flex-col">
          {items.map((item) => (
            <TimelineEntry key={item.id} name={item.name} category={item.category} date={item.createdAt} />
          ))}
        </ul>
      </section>
    </div>
  );
}
