'use client';

import { useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { ItemCardData } from '@/components/item/ItemCard';

import { ThingCard } from './ThingCard';

const PAGE_SIZE = 6;

/** Client-side pagination over server-fetched items — list rows on mobile, a 3-column grid on desktop. */
export function ThingsGrid({ items }: { items: ItemCardData[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="flex flex-col gap-16">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-h3 text-warm-ink">Your Things</h2>
        {pageCount > 1 && (
          <div className="flex items-center gap-4 text-caption text-on-surface-variant">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className="rounded-full p-4 hover:bg-surface-container disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span>
              {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              aria-label="Next page"
              className="rounded-full p-4 hover:bg-surface-container disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-8 md:grid md:grid-cols-3 md:gap-16">
        {visible.map((item) => (
          <ThingCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
