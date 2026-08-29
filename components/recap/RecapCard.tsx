import { WorthFigure } from '@/components/reveal/WorthFigure';
import { cn } from '@/lib/cn';

type RecapCardProps = {
  headline: string;
  itemsAddedCount: number;
  milestonesCount: number;
  worth: { currency: string; total: string } | null;
  highlightNote?: { itemName: string; note: string } | null;
  className?: string;
};

/**
 * The primary shareable, non-comparative growth artifact. Screenshot-native
 * by design — gold for the achievement highlight, teal for progress, never
 * a comparison to anyone else. See .agents/rules/design-system.md.
 */
export function RecapCard({ headline, itemsAddedCount, milestonesCount, worth, highlightNote, className }: RecapCardProps) {
  return (
    // Flat dark ground, not the gradient token — see RevealSequence for the
    // measured contrast failure (~1.1:1) that rules out a gradient behind text.
    <div className={cn('flex flex-col items-center gap-16 rounded-2xl bg-inverse-surface p-48 text-center', className)}>
      <p className="text-heading-h2 font-serif text-inverse-on-surface">{headline}</p>

      <div className="flex gap-32">
        <div className="flex flex-col items-center">
          <p className="text-heading-h2 font-serif text-tertiary">{itemsAddedCount}</p>
          <p className="text-caption text-inverse-primary">added</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-heading-h2 font-serif text-achievement">{milestonesCount}</p>
          <p className="text-caption text-inverse-primary">milestones</p>
        </div>
      </div>

      {worth && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-label uppercase tracking-wide text-inverse-on-surface">Your Worth</p>
          <WorthFigure currency={worth.currency} total={worth.total} size="medium" />
        </div>
      )}

      {highlightNote && (
        <p className="max-w-sm text-body-small italic text-inverse-on-surface">
          &ldquo;{highlightNote.note}&rdquo; · {highlightNote.itemName}
        </p>
      )}
    </div>
  );
}
