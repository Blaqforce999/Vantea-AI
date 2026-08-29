import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const badge = cva('inline-flex items-center gap-4 rounded-md px-8 py-2 text-caption', {
  variants: {
    variant: {
      neutral: 'bg-surface-container text-on-surface-variant',
      achievement: 'bg-achievement-container text-on-achievement-container',
      progress: 'bg-tertiary-container text-on-tertiary-container',
      danger: 'bg-error-container text-on-error-container',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge> & { className?: string };

export function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...props} />;
}
