'use client';

import { useState } from 'react';

import type { ItemCardData } from '@/components/item/ItemCard';
import { CategoryArt } from '@/components/ui/CategoryArt';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/constants';
import { formatMoney } from '@/lib/format';

import { EditItemModal } from './EditItemModal';

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' });

/**
 * The dashboard's "Your Things" card — a real photo when Item.imageUrl is
 * set, a tasteful category-colored icon placeholder when it isn't (no fake
 * stock photos). Deliberately separate from the plain ItemCard used on
 * /collection: the visual language differs enough (photo-first tile vs. a
 * bordered text card) that adapting one component responsively would fight
 * itself. Row layout on mobile, photo-top tile on desktop, via one set of
 * responsive classes rather than two components. Clicking the card opens
 * the same field set used by ParsePreview/Manual Entry, pre-filled.
 */
export function ThingCard({ item }: { item: ItemCardData }) {
  const [editing, setEditing] = useState(false);
  const Icon = CATEGORY_ICONS[item.category];
  const colors = CATEGORY_COLORS[item.category];

  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${item.name}`}
        className="flex w-full items-center gap-12 overflow-hidden rounded-xl border border-outline-variant bg-surface p-12 text-left transition-colors hover:border-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex-col md:items-stretch md:gap-0 md:p-0"
      >
        <div className="relative h-64 w-64 shrink-0 md:h-auto md:w-full md:aspect-video">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- item photos are data: URIs or arbitrary https URLs, not a known remote-image domain set.
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full rounded-lg object-cover md:rounded-none md:rounded-t-xl"
            />
          ) : (
            <CategoryArt category={item.category} className="h-full w-full rounded-lg md:rounded-none md:rounded-t-xl" />
          )}
          <span className="absolute left-6 top-6 flex h-24 w-24 items-center justify-center rounded-md bg-surface-container-lowest shadow-[0_1px_2px_var(--color-shadow)] md:left-8 md:top-8 md:h-28 md:w-28">
            <Icon size={14} className={colors.text} aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0 flex-1 md:p-16">
          <div className="flex items-start justify-between gap-8">
            <p className="truncate text-body-regular font-medium text-warm-ink">{item.name}</p>
          </div>
          <div className="flex items-center justify-between gap-8">
            {item.acquiredDate && (
              <p className="text-caption text-on-surface-variant">Added {dateFormatter.format(item.acquiredDate)}</p>
            )}
            {item.value !== null && item.currency && (
              <p className="shrink-0 font-mono text-body-small font-medium text-tertiary">{formatMoney(item.value, item.currency)}</p>
            )}
          </div>
        </div>
      </button>
      <EditItemModal item={item} open={editing} onClose={() => setEditing(false)} />
    </>
  );
}
