'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { editItem } from '@/app/(app)/(with-nav)/collection/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import type { ItemCardData } from '@/components/item/ItemCard';

type EditItemDialogProps = {
  item: ItemCardData;
  open: boolean;
  onClose: () => void;
};

export function EditItemDialog({ item, open, onClose }: EditItemDialogProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const rawValue = formData.get('value');
    const rawDate = formData.get('acquiredDate');

    const result = await editItem({
      id: item.id,
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

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim-50 p-16" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-bright p-24 shadow-[0_1px_2px_var(--color-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-heading-h4 text-warm-ink">Edit {item.name}</h2>
        <form onSubmit={handleSubmit} className="mt-16 flex flex-col gap-16">
          <Input id="edit-item-name" name="name" label="Name" required defaultValue={item.name} />
          <Select
            id="edit-item-category"
            name="category"
            label="Category"
            required
            defaultValue={item.category}
            options={CATEGORY_OPTIONS}
          />
          <div className="flex gap-16">
            <Input
              id="edit-item-value"
              name="value"
              label="Personal value (optional)"
              type="number"
              min={0}
              step="0.01"
              defaultValue={item.value ?? ''}
            />
            <Input
              id="edit-item-currency"
              name="currency"
              label="Currency (optional)"
              maxLength={3}
              defaultValue={item.currency ?? ''}
            />
          </div>
          <Input
            id="edit-item-date"
            name="acquiredDate"
            label="Acquired date (optional)"
            type="date"
            defaultValue={item.acquiredDate ? item.acquiredDate.toISOString().slice(0, 10) : ''}
          />
          <Textarea
            id="edit-item-why"
            name="whyNote"
            label="Why it mattered (optional)"
            maxLength={500}
            defaultValue={item.whyNote ?? ''}
          />
          {error && <p className="text-caption text-error">{error}</p>}
          <div className="flex justify-end gap-8">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
