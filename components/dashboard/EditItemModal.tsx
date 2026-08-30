'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';

import { deleteItem, editItem } from '@/app/(app)/(with-nav)/collection/actions';
import { ItemFormFields, type ItemFormValues } from '@/components/ai/ItemFormFields';
import type { ItemCardData } from '@/components/item/ItemCard';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!open) return null;

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      const result = await deleteItem({ id: item.id });

      if (!result.ok) {
        setDeleting(false);
        setConfirmingDelete(false);
        setError(result.error.message);
        showToast({ title: 'Could not delete', description: result.error.message, variant: 'error' });
        return;
      }

      showToast({ title: `${item.name} removed from your things`, variant: 'success' });
      router.refresh();
      onClose();
    } catch {
      setDeleting(false);
      setConfirmingDelete(false);
      setError("Couldn't reach the server. Check your connection and try again.");
      showToast({ title: 'Could not delete. Check your connection', variant: 'error' });
    }
  }

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
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim-50 p-16" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`edit-${item.id}-title`}
        className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant bg-surface-bright p-24 shadow-[0_20px_60px_-15px_var(--color-shadow)] sm:p-32"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-16 top-16 rounded-md p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <h2 id={`edit-${item.id}-title`} className="text-center text-heading-h4 text-warm-ink">
          Edit item
        </h2>
        <div className="mt-16 border-t border-outline-variant" />

        <div className="mt-24">
          <ItemFormFields
            values={fields}
            onChange={setFields}
            disabled={saving || deleting}
            idPrefix={`edit-${item.id}`}
            variant="compact"
          />
        </div>

        {error && <p className="mt-12 text-caption text-error">{error}</p>}

        <div className="mt-24 flex flex-col-reverse gap-12 border-t border-outline-variant pt-20 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={saving || deleting}
            className="inline-flex items-center justify-center gap-6 self-start rounded-lg px-8 py-8 text-body-small font-medium text-error transition-colors hover:bg-error-container disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 size={16} aria-hidden="true" />
            {deleting ? 'Deleting…' : 'Delete item'}
          </button>
          <div className="flex justify-end gap-8">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving || deleting} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving || deleting || !fields.name.trim()}
              className="flex-1 sm:flex-none"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      open={confirmingDelete}
      title={`Delete ${item.name}?`}
      description="This permanently removes it from your things and adjusts your total worth. This can't be undone."
      confirmLabel="Delete item"
      destructive
      pending={deleting}
      onConfirm={handleDelete}
      onCancel={() => setConfirmingDelete(false)}
    />
    </>
  );
}
