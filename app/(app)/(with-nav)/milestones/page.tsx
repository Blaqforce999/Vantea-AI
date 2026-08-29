import { Award } from 'lucide-react';

import { MilestoneCard } from '@/components/shared/MilestoneCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function MilestonesPage() {
  const session = await getSession();
  if (!session) return null;

  const milestones = await db.milestone.findMany({
    where: { userId: session.userId },
    orderBy: { achievedAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-32">
      <PageHeader title="Milestones" description="Small moments worth marking." />

      {milestones.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No milestones yet"
          description="Keep adding to your collection. Your first milestone isn't far off."
        />
      ) : (
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              type={milestone.type}
              achievedAt={milestone.achievedAt}
              payload={milestone.payload as { value?: string; currency?: string } | null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
