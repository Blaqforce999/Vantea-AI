import { cn } from '@/lib/cn';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Adds a small shadow for surfaces that genuinely need to float (modals, popovers). Off by default. */
  elevated?: boolean;
  className?: string;
};

export function Card({ elevated, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant bg-surface p-16',
        elevated && 'shadow-[0_1px_2px_var(--color-shadow)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
