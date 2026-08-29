'use client';

import { useState } from 'react';

import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { deleteItem } from '@/app/(app)/(with-nav)/collection/actions';
import { EditItemDialog } from '@/app/(app)/(with-nav)/collection/_components/EditItemDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { ItemCardData } from '@/components/item/ItemCard';

export function ItemActions({ item }: { item: ItemCardData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteItem({ id: item.id });
    setDeleting(false);
    setConfirmingDelete(false);
    if (result.ok) router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-4">
      <button
        type="button"
        aria-label={`Edit ${item.name}`}
        onClick={() => setEditing(true)}
        className="rounded-md p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`Delete ${item.name}`}
        onClick={() => setConfirmingDelete(true)}
        className="rounded-md p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>

      <EditItemDialog item={item} open={editing} onClose={() => setEditing(false)} />
      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete ${item.name}?`}
        description="This removes it from your collection. This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
