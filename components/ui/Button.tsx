import { forwardRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

// No "gold" variant, deliberately — gold is reserved for achievement moments
// (the reveal, milestones), not routine UI. See .agents/rules/design-system.md.
// Hover states use surface-container tints rather than a `bg-x/opacity`
// modifier: tokens/tokens.css bakes alpha into 8-digit hex, which Tailwind's
// color-opacity syntax cannot fade further.
const button = cva(
  'inline-flex items-center justify-center gap-8 rounded-lg text-button font-sans transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:opacity-90',
        secondary: 'bg-parchment text-warm-ink border border-slate hover:bg-surface-container',
        ghost: 'bg-transparent text-warm-ink border border-transparent hover:bg-surface-container',
        danger: 'bg-danger text-on-danger hover:opacity-90',
      },
      size: {
        sm: 'h-36 px-12',
        md: 'h-44 px-16',
        lg: 'h-48 px-24',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { className?: string };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, ...props },
  ref,
) {
  return <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />;
});
