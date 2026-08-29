'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

type MenuProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  panelClassName?: string;
};

/**
 * The app's first dropdown primitive — button trigger + `role="menu"` panel,
 * click-outside and Escape to close. Follows ConfirmDialog's existing
 * focus/keyboard conventions rather than inventing a new interaction model.
 */
export function Menu({ trigger, children, align = 'right', panelClassName }: MenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            'absolute top-full z-50 mt-8 w-224 rounded-xl border border-outline-variant bg-surface-bright p-8 shadow-[0_20px_60px_-15px_var(--color-shadow)]',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

type MenuItemProps = {
  icon?: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
};

export function MenuItem({ icon: Icon, label, href, onClick, danger }: MenuItemProps) {
  const className = cn(
    'flex w-full items-center gap-12 rounded-lg px-12 py-10 text-left text-body-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    danger ? 'text-error hover:bg-error-container' : 'text-warm-ink hover:bg-surface-container',
  );
  const content = (
    <>
      {Icon && <Icon size={18} aria-hidden="true" />}
      {label}
    </>
  );

  if (href) {
    // Internal routes use next/link; mailto:/external links stay plain <a>.
    if (href.startsWith('/')) {
      return (
        <Link href={href} role="menuitem" className={className}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} role="menuitem" className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
