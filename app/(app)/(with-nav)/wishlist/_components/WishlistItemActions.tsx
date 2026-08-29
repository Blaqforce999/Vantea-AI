'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { deleteWishlistItem, editWishlistItem } from '@/app/(app)/(with-nav)/wishlist/actions';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type WishlistItemActionsProps = {
  id: string;
  name: string;
  status: 'WANTED' | 'ACQUIRED' | 'ARCHIVED';
};

export function WishlistItemActions({ id, name, status }: WishlistItemActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function markAcquired() {
    setPending(true);
    await editWishlistItem({ id, status: 'ACQUIRED' });
    setPending(false);
    router.refresh();
  }

  async function handleDelete() {
    setPending(true);
    await deleteWishlistItem({ id });
    setPending(false);
    setConfirmingDelete(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-8">
      {status === 'WANTED' && (
        <Button variant="secondary" size="sm" onClick={markAcquired} disabled={pending}>
          Got it
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)} disabled={pending}>
        Remove
      </Button>
      <ConfirmDialog
        open={confirmingDelete}
        title={`Remove ${name}?`}
        description="This takes it off your wishlist. This can't be undone."
        confirmLabel="Remove"
        destructive
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
