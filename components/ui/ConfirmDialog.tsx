'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use for delete and other genuinely destructive actions. */
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional extra content (e.g. editable fields) rendered between the description and the button row. */
  children?: React.ReactNode;
};

/**
 * Every AI write and every delete goes through this. It must always show
 * exactly what will happen before it happens — see
 * .agents/rules/architecture.md "Core Operating Principle" (Understand →
 * Show → Confirm → Execute) and .agents/rules/security.md.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  pending,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center bg-scrim-50 p-16')}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-outline-variant bg-surface-bright p-24 shadow-[0_1px_2px_var(--color-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-heading-h4 text-warm-ink">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-8 text-body-regular text-on-surface-variant">
          {description}
        </p>
        {children && <div className="mt-16">{children}</div>}
        <div className="mt-24 flex justify-end gap-8">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
