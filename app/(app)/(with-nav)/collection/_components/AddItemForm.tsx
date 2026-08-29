'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { addItem } from '@/app/(app)/(with-nav)/collection/actions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CATEGORY_OPTIONS } from '@/lib/constants';

export function AddItemForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const rawValue = formData.get('value');
    const rawDate = formData.get('acquiredDate');

    const result = await addItem({
      name: formData.get('name'),
      category: formData.get('category'),
      value: rawValue ? Number(rawValue) : undefined,
      currency: formData.get('currency') || undefined,
      acquiredDate: rawDate || undefined,
      whyNote: formData.get('whyNote') || undefined,
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
        Add something you&apos;ve built
      </Button>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <Input id="add-item-name" name="name" label="Name" required placeholder="MacBook Pro" />
        <Select id="add-item-category" name="category" label="Category" required options={CATEGORY_OPTIONS} />
        <div className="flex gap-16">
          <Input id="add-item-value" name="value" label="Personal value (optional)" type="number" min={0} step="0.01" />
          <Input id="add-item-currency" name="currency" label="Currency (optional)" placeholder="NGN" maxLength={3} />
        </div>
        <Input id="add-item-date" name="acquiredDate" label="Acquired date (optional)" type="date" />
        <Textarea id="add-item-why" name="whyNote" label="Why it mattered (optional)" maxLength={500} />
        {error && <p className="text-caption text-error">{error}</p>}
        <div className="flex justify-end gap-8">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
