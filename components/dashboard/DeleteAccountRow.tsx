'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { deleteMyAccount } from '@/app/(app)/(with-nav)/privacy/actions';
import { PrivacyRow } from '@/components/dashboard/PrivacyRow';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function DeleteAccountRow() {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    const result = await deleteMyAccount();
    setDeleting(false);

    if (!result.ok) {
      showToast({ title: 'Could not delete your account', description: result.error.message, variant: 'error' });
      setConfirming(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <>
      <PrivacyRow
        icon={Trash2}
        title="Delete account"
        description="Permanently remove everything you've recorded. This can't be undone."
        onClick={() => setConfirming(true)}
        danger
      />
      <ConfirmDialog
        open={confirming}
        title="Delete your account?"
        description="This permanently removes everything you've recorded: your collection, worth history, wishlist, goals, and milestones. This cannot be undone."
        confirmLabel="Delete everything"
        destructive
        pending={deleting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
