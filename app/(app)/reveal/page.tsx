import { formatDistanceToNowStrict } from 'date-fns';
import { Sparkles } from 'lucide-react';

import { RevealSequence } from '@/components/reveal/RevealSequence';
import { EmptyState } from '@/components/shared/EmptyState';
import { getSession } from '@/lib/auth';
import { REVEAL_ITEM_THRESHOLD } from '@/lib/constants';
import { db } from '@/lib/db';
import { getFeaturedWorth } from '@/lib/worth';

export default async function RevealPage() {
  const session = await getSession();
  if (!session) return null;

  const items = await db.item.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'asc' },
  });

  if (items.length < REVEAL_ITEM_THRESHOLD) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Your reveal is still ahead"
        description={`Add ${REVEAL_ITEM_THRESHOLD - items.length} more thing${
          REVEAL_ITEM_THRESHOLD - items.length === 1 ? '' : 's'
        } to your collection to unlock it.`}
      />
    );
  }

  const earliest = items[0].createdAt;
  const durationLabel = `${formatDistanceToNowStrict(earliest)} of building`;

  const { featured } = await getFeaturedWorth(session.userId);
  const worth = featured.itemCount > 0 ? featured : null;

  return (
    <RevealSequence
      items={items.map((item) => ({ id: item.id, name: item.name, category: item.category }))}
      durationLabel={durationLabel}
      worth={worth}
    />
  );
}
