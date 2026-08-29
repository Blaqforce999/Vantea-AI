import { Target } from 'lucide-react';

import { AddGoalForm } from '@/app/(app)/(with-nav)/goals/_components/AddGoalForm';
import { GoalActions } from '@/app/(app)/(with-nav)/goals/_components/GoalActions';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function GoalsPage() {
  const session = await getSession();
  if (!session) return null;

  const goals = await db.goal.findMany({
    where: { userId: session.userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-32">
      <PageHeader title="Goals" description="Personal targets. No pressure, just progress." />

      <AddGoalForm />

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No active goals" description="Set a goal to work toward, whenever you're ready." />
      ) : (
        <div className="flex flex-col gap-16">
          {goals.map((goal) => {
            const target = goal.targetValue ? Number(goal.targetValue) : null;
            const progress = goal.currentProgress ? Number(goal.currentProgress) : 0;
            const percent = target && target > 0 ? Math.min(100, (progress / target) * 100) : null;

            return (
              <Card key={goal.id} className="flex flex-col gap-8">
                <div className="flex items-start justify-between gap-8">
                  <h3 className="text-heading-h4 text-warm-ink">{goal.title}</h3>
                  <GoalActions id={goal.id} title={goal.title} />
                </div>
                {target !== null && (
                  <>
                    <div className="h-8 rounded-md bg-surface-container">
                      <div className="h-8 rounded-md bg-teal" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-body-small text-on-surface-variant">
                      {goal.currency} {progress.toLocaleString()} of {target.toLocaleString()}
                    </p>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
