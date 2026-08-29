'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { addGoal } from '@/app/(app)/(with-nav)/goals/actions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function AddGoalForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const rawTarget = formData.get('targetValue');
    const rawProgress = formData.get('currentProgress');

    const result = await addGoal({
      title: formData.get('title'),
      targetValue: rawTarget ? Number(rawTarget) : undefined,
      currentProgress: rawProgress ? Number(rawProgress) : undefined,
      currency: formData.get('currency') || undefined,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    event.currentTarget.reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="self-start">
        Set a goal
      </Button>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <Input id="add-goal-title" name="title" label="Goal" required placeholder="Save toward a rental property" />
        <div className="flex gap-16">
          <Input id="add-goal-target" name="targetValue" label="Target (optional)" type="number" min={0} step="0.01" />
          <Input id="add-goal-progress" name="currentProgress" label="Current progress (optional)" type="number" min={0} step="0.01" />
        </div>
        <Input id="add-goal-currency" name="currency" label="Currency (optional)" placeholder="NGN" maxLength={3} />
        {error && <p className="text-caption text-error">{error}</p>}
        <div className="flex justify-end gap-8">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Set goal'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
