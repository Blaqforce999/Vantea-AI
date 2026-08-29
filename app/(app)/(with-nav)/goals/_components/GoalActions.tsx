'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { deleteGoal, editGoal } from '@/app/(app)/(with-nav)/goals/actions';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function GoalActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function markComplete() {
    setPending(true);
    await editGoal({ id, status: 'COMPLETED' });
    setPending(false);
    router.refresh();
  }

  async function handleDelete() {
    setPending(true);
    await deleteGoal({ id });
    setPending(false);
    setConfirmingDelete(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-8">
      <Button variant="secondary" size="sm" onClick={markComplete} disabled={pending}>
        Mark complete
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)} disabled={pending}>
        Remove
      </Button>
      <ConfirmDialog
        open={confirmingDelete}
        title={`Remove "${title}"?`}
        description="This removes the goal. This can't be undone. Your goal is still here whenever you're ready. Removing it is a separate choice from letting it sit."
        confirmLabel="Remove"
        destructive
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
