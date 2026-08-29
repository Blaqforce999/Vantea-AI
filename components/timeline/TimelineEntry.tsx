import type { Category } from '@prisma/client';

import { CategoryBadge } from '@/components/item/CategoryBadge';

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

type TimelineEntryProps = {
  name: string;
  category: Category;
  date: Date;
};

export function TimelineEntry({ name, category, date }: TimelineEntryProps) {
  return (
    <li className="flex items-center justify-between gap-16 border-b border-outline-variant py-8 last:border-none">
      <div className="flex items-center gap-8">
        <span className="text-body-regular text-warm-ink">{name}</span>
        <CategoryBadge category={category} />
      </div>
      <span className="shrink-0 text-caption text-on-surface-variant">{dateFormatter.format(date)}</span>
    </li>
  );
}
