import { cn } from '@/lib/cn';

type StatChipProps = { value: string; label: string; tone?: 'neutral' | 'positive' };

export function StatChip({ value, label, tone = 'neutral' }: StatChipProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl px-12 py-6',
        tone === 'positive' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container-low text-warm-ink',
      )}
    >
      <span className="text-body-regular font-semibold">{value}</span>
      {/* text-[11px] is a deliberate one-off below text-caption (12px), the
          smallest size in the type scale — there's no smaller token to
          reuse here. */}
      <span
        className={cn(
          'text-[11px] leading-none',
          tone === 'positive' ? 'text-on-tertiary-container' : 'text-on-surface-variant',
        )}
      >
        {label}
      </span>
    </div>
  );
}
