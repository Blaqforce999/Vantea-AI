import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * A warm invitation, not a dead end. An empty collection, wishlist, or goals
 * list is a first-class state in Vantea, not an afterthought — see
 * .agents/rules/design-system.md.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-8 rounded-xl border border-dashed border-outline-variant p-48 text-center', className)}>
      <Icon size={32} className="text-slate" aria-hidden="true" />
      <h3 className="text-heading-h4 text-warm-ink">{title}</h3>
      <p className="max-w-sm text-body-regular text-on-surface-variant">{description}</p>
      {action}
    </div>
  );
}
