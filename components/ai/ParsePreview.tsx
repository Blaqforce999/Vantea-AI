'use client';

import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ItemFormFields, type ItemFormValues } from '@/components/ai/ItemFormFields';
import type { ParsedItem } from '@/lib/ai';
import { DEFAULT_CURRENCY } from '@/lib/constants';

type ParsePreviewProps = {
  preview: ParsedItem;
  imageUrl: string | null;
  pending?: boolean;
  onConfirm: (edited: ParsedItem, imageUrl: string | null) => void;
  onCancel: () => void;
};

/**
 * Shows what was understood from what the user typed — and now attached —
 * as a fully editable form: every field, including the photo, since the
 * local parser is a heuristic, not a real model, and a photo can be wrong
 * or missing just as easily as a category. Nothing is saved until the user
 * confirms. See .agents/rules/architecture.md "Conversational Adding".
 */
export function ParsePreview({ preview, imageUrl, pending, onConfirm, onCancel }: ParsePreviewProps) {
  const [fields, setFields] = useState<ItemFormValues>({
    imageUrl,
    name: preview.name,
    category: preview.category,
    value: preview.value !== undefined ? String(preview.value) : '',
    currency: preview.currency ?? '',
    acquiredDate: preview.acquiredDate ?? '',
    whyNote: preview.whyNote ?? '',
  });

  function handleConfirm() {
    const trimmedValue = fields.value.trim();
    const trimmedCurrency = fields.currency.trim();

    onConfirm(
      {
        name: fields.name.trim() || preview.name,
        category: fields.category,
        value: trimmedValue ? Number(trimmedValue) : undefined,
        currency: trimmedValue ? (trimmedCurrency || DEFAULT_CURRENCY).toUpperCase() : undefined,
        acquiredDate: fields.acquiredDate.trim() || undefined,
        whyNote: fields.whyNote.trim() || undefined,
      },
      fields.imageUrl,
    );
  }

  return (
    <ConfirmDialog
      open
      title="Review before adding"
      description="Here's what I understood. Edit anything that's not quite right, including the photo."
      confirmLabel="Add it"
      pending={pending}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      <ItemFormFields values={fields} onChange={setFields} disabled={pending} idPrefix="preview" />
    </ConfirmDialog>
  );
}
