import type { Category } from '@prisma/client';

import { CategoryBadge } from '@/components/item/CategoryBadge';
import { WhyNote } from '@/components/item/WhyNote';
import { Card } from '@/components/ui/Card';
import { CategoryArt } from '@/components/ui/CategoryArt';

export type ItemCardData = {
  id: string;
  name: string;
  category: Category;
  value: string | null; // Decimal serialized to a string — never pass a Decimal instance to a client component
  currency: string | null;
  acquiredDate: Date | null;
  whyNote: string | null;
  imageUrl: string | null;
};

type ItemCardProps = {
  item: ItemCardData;
  /** The edit/delete controls, rendered by the caller as a client component slot. */
  actions?: React.ReactNode;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

/**
 * The unit of the Collection — a journal entry, not a line item. Stays a
 * server component; interactive edit/delete controls are passed in as a
 * `actions` slot so this component never needs "use client" itself.
 */
export function ItemCard({ item, actions }: ItemCardProps) {
  return (
    <Card className="flex flex-col gap-8">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- item photos are data: URIs or arbitrary https URLs, not a known remote-image domain set.
        <img src={item.imageUrl} alt="" className="h-120 w-full rounded-lg object-cover" />
      ) : (
        <CategoryArt category={item.category} className="h-120 w-full rounded-lg" iconSize={32} />
      )}
      <div className="flex items-start justify-between gap-8">
        <h3 className="text-heading-h4 text-warm-ink">{item.name}</h3>
        {actions}
      </div>
      <CategoryBadge category={item.category} />
      {item.value !== null && (
        <p className="text-body-regular text-warm-ink">
          {item.currency} {Number(item.value).toLocaleString()}
        </p>
      )}
      {item.whyNote && <WhyNote note={item.whyNote} />}
      {item.acquiredDate && (
        <p className="text-caption text-on-surface-variant">Acquired {dateFormatter.format(item.acquiredDate)}</p>
      )}
    </Card>
  );
}
