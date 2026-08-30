import { Boxes } from 'lucide-react';

import { AddItemForm } from '@/app/(app)/(with-nav)/collection/_components/AddItemForm';
import { ItemActions } from '@/app/(app)/(with-nav)/collection/_components/ItemActions';
import { ConversationalAdd } from '@/components/ai/ConversationalAdd';
import { ItemCard, type ItemCardData } from '@/components/item/ItemCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from '@/lib/constants';
import { db } from '@/lib/db';
import type { Category } from '@prisma/client';

// Live but intentionally unlinked from nav — not a page to index.
export const metadata = { robots: { index: false, follow: false } };

export default async function CollectionPage() {
  const session = await getSession();
  if (!session) return null; // (app)/layout.tsx handles guest bootstrapping before this ever renders

  const items = await db.item.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  const itemCards: ItemCardData[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    value: item.value ? item.value.toFixed(2) : null,
    currency: item.currency,
    acquiredDate: item.acquiredDate,
    whyNote: item.whyNote,
    imageUrl: item.imageUrl,
  }));

  const byCategory = new Map<Category, ItemCardData[]>();
  for (const item of itemCards) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const orderedCategories = CATEGORY_OPTIONS.map((o) => o.value as Category).filter((c) => byCategory.has(c));

  return (
    <div className="flex flex-col gap-32">
      <PageHeader
        title="Your Collection"
        description="Everything you've built, acquired, saved, or learned, in one place."
      />

      <AddItemForm />
      <ConversationalAdd />

      {itemCards.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Your collection is empty"
          description="Add the first thing you've built or acquired to start your journey."
        />
      ) : (
        orderedCategories.map((category) => (
          <section key={category} className="flex flex-col gap-16">
            <h2 className="text-heading-h3 text-warm-ink">{CATEGORY_LABELS[category]}</h2>
            <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
              {byCategory.get(category)!.map((item) => (
                <ItemCard key={item.id} item={item} actions={<ItemActions item={item} />} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
