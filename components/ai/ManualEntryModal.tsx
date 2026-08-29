'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { Category } from '@prisma/client';
import { X } from 'lucide-react';

import { addItem } from '@/app/(app)/(with-nav)/collection/actions';
import { ItemFormFields, type ItemFormValues } from '@/components/ai/ItemFormFields';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_CURRENCY, MILESTONE_DESCRIPTIONS, MILESTONE_LABELS } from '@/lib/constants';

const EMPTY_VALUES: ItemFormValues = {
  imageUrl: null,
  name: '',
  category: Category.OTHER,
  value: '',
  currency: '',
  acquiredDate: '',
  whyNote: '',
};

type ManualEntryModalProps = { open: boolean; onClose: () => void };

/**
 * The non-conversational path — add something directly, without describing
 * it in words first. Same fields, same visual language as the AI review
 * modal (ParsePreview/ItemFormFields), same subtle shadow convention as
 * every other modal in this app — just its own trigger and its own direct
 * call to addItem, no parse step in between.
 */
export function ManualEntryModal({ open, onClose }: ManualEntryModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [fields, setFields] = useState<ItemFormValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function handleClose() {
    setFields(EMPTY_VALUES);
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!fields.name.trim()) {
      setError('Give it a name before adding it.');
      return;
    }

    setSaving(true);
    setError(null);

    const trimmedValue = fields.value.trim();
    const trimmedCurrency = fields.currency.trim();

    try {
      const result = await addItem({
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
        showToast({ title: 'Could not save', description: result.error.message, variant: 'error' });
        return;
      }

      showToast({ title: `${fields.name.trim()} added to your things`, variant: 'success' });
      for (const milestone of result.data.newMilestones) {
        showToast({
          title: `${MILESTONE_LABELS[milestone.type]}!`,
          description: MILESTONE_DESCRIPTIONS[milestone.type],
          variant: 'milestone',
        });
      }

      router.refresh();
      handleClose();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      showToast({ title: 'Could not save. Check your connection', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim-50 p-16" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-outline-variant bg-surface-bright p-24 shadow-[0_1px_2px_var(--color-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-heading-h4 text-warm-ink">Add manually</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-8 text-body-small text-on-surface-variant">Add something without describing it in words first.</p>

        <div className="mt-16">
          <ItemFormFields values={fields} onChange={setFields} disabled={saving} idPrefix="manual" />
        </div>

        {error && <p className="mt-8 text-caption text-error">{error}</p>}

        <div className="mt-24 flex justify-end gap-8">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving || !fields.name.trim()}>
            {saving ? 'Adding…' : 'Add it'}
          </Button>
        </div>
      </div>
    </div>
  );
}
