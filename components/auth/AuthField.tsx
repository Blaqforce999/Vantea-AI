import { AlertCircle, Check } from 'lucide-react';

import { cn } from '@/lib/cn';

export type FieldState = 'neutral' | 'error' | 'success';

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  state?: FieldState;
  message?: string;
  /** Optional trailing element in the label row — e.g. a "Forgot password?" link. */
  labelAction?: React.ReactNode;
};

/**
 * The auth-specific field: a neutral/error/success border plus an inline
 * icon, on top of ui/Input's simpler error-only pattern. Kept separate from
 * the shared ui/Input rather than adding a success state there — every
 * other form in the app (Collection, Wishlist, Goals) already relies on
 * Input's current two-state behavior, and this only auth needs the third.
 */
export function AuthField({
  id,
  label,
  state = 'neutral',
  message,
  labelAction,
  className,
  required,
  ...props
}: AuthFieldProps) {
  const messageId = message ? `${id}-message` : undefined;

  const borderColor =
    state === 'error' ? 'border-error' : state === 'success' ? 'border-achievement' : 'border-outline-variant';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-8">
        <label htmlFor={id} className={cn('text-label', state === 'error' ? 'text-error' : 'text-on-surface')}>
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          required={required}
          aria-invalid={state === 'error'}
          aria-describedby={messageId}
          className={cn(
            'h-44 w-full rounded-xl border bg-surface px-12 pr-40 text-body-regular text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            borderColor,
            className,
          )}
          {...props}
        />
        {state === 'success' && (
          <Check className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-achievement" size={18} aria-hidden="true" />
        )}
        {state === 'error' && (
          <AlertCircle className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-error" size={18} aria-hidden="true" />
        )}
      </div>
      {state === 'error' && message && (
        <p id={messageId} className="text-caption text-error">
          {message}
        </p>
      )}
    </div>
  );
}
