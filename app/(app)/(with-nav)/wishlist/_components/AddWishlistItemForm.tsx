'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { addWishlistItem } from '@/app/(app)/(with-nav)/wishlist/actions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CATEGORY_OPTIONS } from '@/lib/constants';

const PRIORITY_OPTIONS = [
  { value: 'NOW', label: 'Now' },
  { value: 'SOON', label: 'Soon' },
  { value: 'SOMEDAY', label: 'Someday' },
];

export function AddWishlistItemForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const rawValue = formData.get('estimatedValue');

    const result = await addWishlistItem({
      name: formData.get('name'),
      category: formData.get('category'),
      estimatedValue: rawValue ? Number(rawValue) : undefined,
      currency: formData.get('currency') || undefined,
      priority: formData.get('priority') || undefined,
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
        Add something you want
      </Button>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <Input id="add-wishlist-name" name="name" label="Name" required placeholder="Tesla Model 3" />
        <Select id="add-wishlist-category" name="category" label="Category" required options={CATEGORY_OPTIONS} />
        <div className="flex gap-16">
          <Input
            id="add-wishlist-value"
            name="estimatedValue"
            label="Estimated value (optional)"
            type="number"
            min={0}
            step="0.01"
          />
          <Input id="add-wishlist-currency" name="currency" label="Currency (optional)" placeholder="NGN" maxLength={3} />
        </div>
        <Select id="add-wishlist-priority" name="priority" label="Priority" options={PRIORITY_OPTIONS} defaultValue="SOMEDAY" />
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
