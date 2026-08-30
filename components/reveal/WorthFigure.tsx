import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

type WorthFigureProps = {
  currency: string;
  total: string;
  /** 'large' for the reveal/peak moment, 'medium' for secondary displays. */
  size?: 'large' | 'medium';
  className?: string;
};

/**
 * Always "Your Worth," never "net worth." Always the display serif — never a
 * mono — so the figure reads as an achievement, not a technical readout. See
 * .agents/rules/design-system.md. Uses formatMoney for a real currency
 * symbol (₦3,650,000) rather than a plain code prefix (NGN 3,650,000).
 */
export function WorthFigure({ currency, total, size = 'large', className }: WorthFigureProps) {
  return (
    <p
      className={cn(
        'font-serif text-gold',
        size === 'large' ? 'text-worth-medium sm:text-worth-large' : 'text-worth-medium',
        className,
      )}
    >
      {formatMoney(total, currency)}
    </p>
  );
}
