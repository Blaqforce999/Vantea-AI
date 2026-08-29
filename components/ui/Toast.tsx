'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { AlertTriangle, Award, CheckCircle2, X, XCircle, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

type ToastVariant = 'success' | 'milestone' | 'warning' | 'error';
type ToastInput = { title: string; description?: string; variant?: ToastVariant };
type ToastRecord = ToastInput & { id: string };

type ToastContextValue = { showToast: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  milestone: Award,
  warning: AlertTriangle,
  error: XCircle,
};

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-tertiary',
  milestone: 'text-achievement',
  warning: 'text-achievement',
  error: 'text-error',
};

const AUTO_DISMISS_MS = 5000;

/**
 * Mounted once for authenticated screens (never the Reveal ritual or auth
 * pages). No toast/notification system existed before this — every variant
 * (success/milestone/warning/error) fires from real events already in the
 * app (item added, milestone awarded, action failed), not new ones invented
 * for this component.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-16 z-[100] flex flex-col items-center gap-8 px-16 sm:inset-x-auto sm:right-16 sm:items-end">
        {toasts.map((toast) => {
          const Icon = VARIANT_ICON[toast.variant ?? 'success'];
          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-start gap-12 rounded-xl border border-outline-variant bg-surface-bright p-16 shadow-[0_20px_60px_-15px_var(--color-shadow)]"
            >
              <Icon
                size={20}
                className={cn('mt-2 shrink-0', VARIANT_ICON_COLOR[toast.variant ?? 'success'])}
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-body-small font-medium text-warm-ink">{toast.title}</p>
                {toast.description && <p className="mt-2 text-caption text-on-surface-variant">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-2 text-on-surface-variant hover:text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
