'use client';

import { useTransition } from 'react';

import { exportMyData } from '@/app/(app)/(with-nav)/privacy/actions';
import { useToast } from '@/components/ui/Toast';

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Data behavior, used from the avatar menu. Sign-out is intentionally
 * NOT bundled here — it's a destructive-ish action that needs a
 * confirmation step, and that confirmation's open/pending state has to live
 * in whichever component renders the ConfirmDialog, not in this hook.
 */
export function useProfileActions() {
  const { showToast } = useToast();
  const [exporting, startExport] = useTransition();

  function handleExport() {
    startExport(async () => {
      const result = await exportMyData();
      if (!result.ok) {
        showToast({ title: 'Could not export your data', description: result.error.message, variant: 'error' });
        return;
      }
      downloadJson(result.data, 'vantea-data-export.json');
      showToast({ title: 'Your data export is ready', variant: 'success' });
    });
  }

  return { exporting, handleExport };
}

/** The raw sign-out effect — call only after the user has confirmed. */
export async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/auth';
}
