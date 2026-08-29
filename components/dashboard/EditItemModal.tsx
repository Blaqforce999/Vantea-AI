'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { editItem } from '@/app/(app)/(with-nav)/collection/actions';
import { ItemFormFields, type ItemFormValues } from '@/components/ai/ItemFormFields';
import type { ItemCardData } from '@/components/item/ItemCard';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_CURRENCY } from '@/lib/constants';

type EditItemModalProps = { item: ItemCardData; open: boolean; onClose: () => void };

function toFormValues(item: ItemCardData): ItemFormValues {
  return {
    imageUrl: item.imageUrl,
    name: item.name,
    category: item.category,
    value: item.value ?? '',
    currency: item.currency ?? '',
    acquiredDate: item.acquiredDate ? item.acquiredDate.toISOString().slice(0, 10) : '',
    whyNote: item.whyNote ?? '',
  };
}

/**
 * Opened by clicking a "Your Things" card — every field editable, including
 * the photo, through the same ItemFormFields used by ParsePreview and
 * Manual Entry. Saves through the existing editItem action.
 */
export function EditItemModal({ item, open, onClose }: EditItemModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [fields, setFields] = useState<ItemFormValues>(() => toFormValues(item));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!fields.name.trim()) {
      setError('Give it a name before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    const trimmedValue = fields.value.trim();
    const trimmedCurrency = fields.currency.trim();

    try {
      const result = await editItem({
        id: item.id,
        name: fields.name.trim(),
        category: fields.category,
        value: trimmedValue ? Number(trimmedValue) : undefined,
        currency: trimmedValue ? (trimmedCurrency || DEFAULT_CURRENCY).toUpperCase() : undefined,
        acquiredDate: fields.acquiredDate.trim() || undefined,
        whyNote: fields.whyNote.trim() || undefined,
        imageUrl: fields.imageUrl ?? undefined,
      });

      if (!result.ok) {
        setError(result.error.message);
        showToast({ title: 'Could not save changes', description: result.error.message, variant: 'error' });
        return;
      }

      showToast({ title: 'Changes saved', variant: 'success' });
      router.refresh();
      onClose();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      showToast({ title: 'Could not save. Check your connection', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim-50 p-16" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-outline-variant bg-surface-bright p-24 shadow-[0_1px_2px_var(--color-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-heading-h4 text-warm-ink">Edit {item.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-16">
          <ItemFormFields values={fields} onChange={setFields} disabled={saving} idPrefix={`edit-${item.id}`} />
        </div>

        {error && <p className="mt-8 text-caption text-error">{error}</p>}

        <div className="mt-24 flex justify-end gap-8">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving || !fields.name.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
