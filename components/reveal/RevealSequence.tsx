'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { WorthFigure } from '@/components/reveal/WorthFigure';
import { CATEGORY_LABELS } from '@/lib/constants';
import type { Category } from '@prisma/client';

export type RevealItem = { id: string; name: string; category: Category };

type RevealSequenceProps = {
  items: RevealItem[];
  durationLabel: string;
  worth: { currency: string; total: string } | null;
};

// Cap how many items animate individually so a large collection doesn't drag
// the ritual out — the moment should stay unhurried, not tedious.
const MAX_SEQUENCE_ITEMS = 8;

/**
 * The signature moment: items appear one at a time, the timeline resolves,
 * the number lands last in gold. Respects prefers-reduced-motion with a
 * dignified, non-animated version that still delivers the same information
 * in the same order. See .agents/rules/design-system.md "Reveal Ritual Layout".
 */
export function RevealSequence({ items, durationLabel, worth }: RevealSequenceProps) {
  const prefersReducedMotion = useReducedMotion();
  const shown = items.slice(0, MAX_SEQUENCE_ITEMS);

  const stagger = prefersReducedMotion ? 0 : 0.35;
  const leadIn = prefersReducedMotion ? 0 : 0.6;
  const afterItems = leadIn + shown.length * stagger + 0.3;
  const worthDelay = afterItems + 0.9;

  return (
    // A flat dark ground, not the gradient token: measured contrast for gold
    // and teal text against gradient-dark's midpoint is ~1.1:1 (fails WCAG
    // badly) because a light-to-dark gradient's middle band is a low-contrast
    // gray. Gradients are for small decorative accents, never full
    // text-bearing backgrounds — see .agents/rules/design-system.md.
    <div className="flex min-h-screen flex-col items-center justify-center gap-24 bg-inverse-surface p-24 text-center">
      <motion.p
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-body-large text-inverse-on-surface"
      >
        Let&apos;s look at what you&apos;ve built.
      </motion.p>

      <ul className="flex flex-col gap-8">
        {shown.map((item, index) => (
          <motion.li
            key={item.id}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: leadIn + index * stagger, duration: 0.5 }}
            className="text-heading-h4 text-inverse-on-surface"
          >
            {item.name}
            <span className="ml-8 text-caption text-inverse-primary">{CATEGORY_LABELS[item.category]}</span>
          </motion.li>
        ))}
      </ul>

      <motion.p
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: afterItems, duration: 0.6 }}
        className="text-body-regular text-inverse-primary"
      >
        {durationLabel}
      </motion.p>

      {worth && (
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: worthDelay, duration: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-label uppercase tracking-wide text-inverse-on-surface">Your Worth</p>
          <WorthFigure currency={worth.currency} total={worth.total} />
        </motion.div>
      )}
    </div>
  );
}
