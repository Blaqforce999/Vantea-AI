import type { MilestoneType } from '@prisma/client';

import { MILESTONE_DESCRIPTIONS, MILESTONE_LABELS } from '@/lib/constants';

type MilestoneCardProps = {
  type: MilestoneType;
  achievedAt: Date;
  payload?: { value?: string; currency?: string } | null;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

/**
 * The one place ordinary UI touches gold — recognition, never a financial
 * reward. Gold text needs a dark ground to clear WCAG AA (measured: gold on
 * `--color-achievement-container` is only 2.73:1 — fails; gold on
 * `--color-on-background`, reused here as a dark fill, is 5.35:1 — passes).
 * See .agents/rules/design-system.md "Accessibility".
 */
export function MilestoneCard({ type, achievedAt, payload }: MilestoneCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-on-background p-16">
      <p className="text-heading-h4 font-serif text-gold">{MILESTONE_LABELS[type]}</p>
      <p className="text-body-small text-inverse-on-surface">
        {MILESTONE_DESCRIPTIONS[type]}
        {type === 'NEW_HIGH' && payload?.value && payload?.currency && (
          <> {payload.currency} {Number(payload.value).toLocaleString()}.</>
        )}
      </p>
      <p className="text-caption text-inverse-primary">{dateFormatter.format(achievedAt)}</p>
    </div>
  );
}
