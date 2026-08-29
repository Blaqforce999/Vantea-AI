import { Gift } from 'lucide-react';

import { AddWishlistItemForm } from '@/app/(app)/(with-nav)/wishlist/_components/AddWishlistItemForm';
import { WishlistItemActions } from '@/app/(app)/(with-nav)/wishlist/_components/WishlistItemActions';
import { CategoryBadge } from '@/components/item/CategoryBadge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const PRIORITY_LABELS = { NOW: 'Now', SOON: 'Soon', SOMEDAY: 'Someday' };

export default async function WishlistPage() {
  const session = await getSession();
  if (!session) return null;

  const items = await db.wishlistItem.findMany({
    where: { userId: session.userId, status: 'WANTED' },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-32">
      <PageHeader title="What I Want" description="Things you're working toward next." />

      <AddWishlistItemForm />

      {items.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nothing on your list yet"
          description="Add something you're hoping to build or acquire next."
        />
      ) : (
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col gap-8">
              <div className="flex items-start justify-between gap-8">
                <h3 className="text-heading-h4 text-warm-ink">{item.name}</h3>
                <WishlistItemActions id={item.id} name={item.name} status={item.status} />
              </div>
              <div className="flex gap-8">
                <CategoryBadge category={item.category} />
                <span className="text-caption text-on-surface-variant">{PRIORITY_LABELS[item.priority]}</span>
              </div>
              {item.estimatedValue && (
                <p className="text-body-regular text-warm-ink">
                  {item.currency} {Number(item.estimatedValue).toLocaleString()}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
