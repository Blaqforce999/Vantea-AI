import { useId } from 'react';

import type { Category } from '@prisma/client';

import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/constants';
import { cn } from '@/lib/cn';

type CategoryArtProps = { category: Category; className?: string; iconSize?: number };

/**
 * The guaranteed fallback visual for any item without a real photo —
 * "compulsory" is enforced here at the presentation layer (every render
 * site shows this when imageUrl is null), not by writing a fake imageUrl
 * into the database. That keeps it in sync automatically if a category
 * ever changes and avoids storing redundant, purely-derived data.
 *
 * Built entirely from existing tokens: the category's own container tint
 * (CATEGORY_COLORS, already used for badges), a faint dot-texture in that
 * same color, and a large centered icon. No new colors, no external images,
 * no paid image-generation API — see the plan's "Path A vs Path B" note for
 * why that's the deliberate choice here.
 */
export function CategoryArt({ category, className, iconSize = 28 }: CategoryArtProps) {
  const Icon = CATEGORY_ICONS[category];
  const colors = CATEGORY_COLORS[category];
  const patternId = `category-art-${useId()}`;

  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', colors.bg, className)}>
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" className={colors.text} fill="currentColor" opacity="0.12" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <Icon size={iconSize} strokeWidth={1.25} className={cn('relative', colors.text)} aria-hidden="true" />
    </div>
  );
}
