import { ChevronRight, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

type PrivacyRowProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  danger?: boolean;
  children?: React.ReactNode;
};

/**
 * The icon-chip + title + description + trailing-chevron row pattern
 * (adapted from a settings-page reference the user provided) — no
 * directive itself so it works both as a plain server-rendered
 * informational row and, wrapped by a client component supplying onClick,
 * as an interactive one. No toggle variant: nothing in this app's privacy
 * surface is a binary on/off setting, so that part of the reference wasn't
 * carried over.
 */
export function PrivacyRow({ icon: Icon, title, description, onClick, danger, children }: PrivacyRowProps) {
  const body = (
    <>
      <div className="flex items-start gap-16">
        <span
          className={cn(
            'flex h-40 w-40 shrink-0 items-center justify-center rounded-lg',
            danger ? 'bg-error-container text-error' : 'bg-surface-container-high text-warm-ink',
          )}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className={cn('text-body-regular font-medium', danger ? 'text-error' : 'text-warm-ink')}>{title}</p>
          <p className="mt-4 text-body-small text-on-surface-variant">{description}</p>
        </div>
        {onClick && <ChevronRight size={20} className="mt-8 shrink-0 text-outline" aria-hidden="true" />}
      </div>
      {children}
    </>
  );

  const baseClassName = 'flex w-full flex-col gap-16 rounded-xl border border-outline-variant bg-surface-container-low p-20 text-left';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          baseClassName,
          'transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={baseClassName}>{body}</div>;
}
