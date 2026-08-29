'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { changeEmail } from '@/app/(app)/(with-nav)/profile/actions';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

type EmailChangeModalProps = {
  open: boolean;
  onClose: () => void;
  /** Fired after a successful change, before the modal closes — lets the parent track "a change was actually made." */
  onSaved?: () => void;
};

/**
 * A real two-step process rather than an instant change: enter the new
 * email + current password, then explicitly confirm before it's applied.
 * There's no working email-verification pipeline in this app (no email
 * provider configured — see lib/password-reset.ts), so a fake "check your
 * inbox" step would just be theater; confirming the current password is a
 * real, meaningful checkpoint instead.
 */
export function EmailChangeModal({ open, onClose, onSaved }: EmailChangeModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function handleClose() {
    setStep('form');
    setNewEmail('');
    setPassword('');
    setError(null);
    onClose();
  }

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStep('confirm');
  }

  async function handleConfirm() {
    setSaving(true);
    const result = await changeEmail({ newEmail: newEmail.trim(), currentPassword: password });
    setSaving(false);

    if (!result.ok) {
      setError(result.error.message);
      showToast({ title: 'Could not change your email', description: result.error.message, variant: 'error' });
      setStep('form');
      return;
    }

    showToast({ title: 'Email updated', variant: 'success' });
    router.refresh();
    onSaved?.();
    handleClose();
  }

  if (step === 'confirm') {
    return (
      <ConfirmDialog
        open
        title="Change your email?"
        description={`Your account email will change to ${newEmail.trim()}. You'll use this to log in from now on.`}
        confirmLabel="Change email"
        pending={saving}
        onConfirm={handleConfirm}
        onCancel={() => setStep('form')}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim-50 p-16" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface-bright p-24 shadow-[0_1px_2px_var(--color-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-heading-h4 text-warm-ink">Change email</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleContinue} className="mt-16 flex flex-col gap-16">
          <Input
            id="new-email"
            label="New email"
            type="email"
            required
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />
          <Input
            id="current-password"
            label="Current password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="text-caption text-error">{error}</p>}
          <div className="flex justify-end gap-8">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
