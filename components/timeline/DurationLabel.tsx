import { formatDistanceToNowStrict } from 'date-fns';

type DurationLabelProps = {
  since: Date;
  startCount: number;
  currentCount: number;
};

/** "Three years ago, two things; today, fourteen." Time is first-class in Vantea. */
export function DurationLabel({ since, startCount, currentCount }: DurationLabelProps) {
  return (
    <p className="text-heading-h2 text-warm-ink">
      <span className="font-serif">{formatDistanceToNowStrict(since)}</span> ago, {startCount}{' '}
      {startCount === 1 ? 'thing' : 'things'}. Today, {currentCount}.
    </p>
  );
}
