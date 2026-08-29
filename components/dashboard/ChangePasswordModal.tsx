'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';

import { X } from 'lucide-react';

import { AuthField } from '@/components/auth/AuthField';
import { Button } from '@/components/ui/Button';

// Mirrors AuthForm's password rules / lib/validators/auth.ts's passwordSchema.
const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: '1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: '1 number', test: (p) => /[0-9]/.test(p) },
  { label: '1 special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

type ChangePasswordModalProps = { open: boolean; onClose: () => void };

/**
 * UI and interaction flow only, per explicit instruction — this does not
 * verify the current password or write a new one yet. That's intentionally
 * deferred alongside the rest of the account-security email flow (see
 * ForgotPasswordForm's identical note) until Resend is connected. The form,
 * validation, and success state are all real; only the final write is
 * simulated.
 */
export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const rulesPass = PASSWORD_RULES.every((rule) => rule.test(newPassword));
  const showChecklist = focused || (touched && newPassword.length > 0 && !rulesPass);

  function handleClose() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTouched(false);
    setError(null);
    setSuccess(false);
    onClose();
  }

  function handleFieldChange(setter: (value: string) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      if (error) setError(null);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (!rulesPass) {
      setTouched(true);
      setError('Your new password does not meet the requirements below.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setPending(false);
    setSuccess(true);
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
          <h2 className="text-heading-h4 text-warm-ink">Change password</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {success ? (
          <div
            role="status"
            className="mt-16 flex flex-col items-center gap-8 rounded-xl bg-tertiary-container px-16 py-24 text-center text-on-tertiary-container"
          >
            <p className="text-body-regular font-medium">Password updated</p>
            <p className="text-body-small">Use your new password next time you log in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-16 flex flex-col gap-16">
            <AuthField
              id="change-password-current"
              label="Current password"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={handleFieldChange(setCurrentPassword)}
              disabled={pending}
            />

            <div>
              <AuthField
                id="change-password-new"
                label="New password"
                type="password"
                required
                autoComplete="new-password"
                state={touched && newPassword && rulesPass ? 'success' : 'neutral'}
                value={newPassword}
                onChange={handleFieldChange(setNewPassword)}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  setTouched(true);
                }}
                disabled={pending}
              />
              {showChecklist && (
                <ul className="mt-8 grid grid-cols-2 gap-x-16 gap-y-4">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(newPassword);
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-8 text-caption ${passed ? 'text-achievement' : 'text-outline'}`}
                      >
                        <span aria-hidden="true">{passed ? '✓' : '○'}</span>
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <AuthField
              id="change-password-confirm"
              label="Confirm new password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleFieldChange(setConfirmPassword)}
              disabled={pending}
            />

            {error && <p className="text-caption text-error">{error}</p>}

            <div className="flex justify-end gap-8">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
