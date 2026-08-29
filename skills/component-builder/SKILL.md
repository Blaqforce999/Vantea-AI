# Component Builder Skill

Load this skill for any task that builds or changes a UI component in Vantea AI. It is the source of truth for how components are shaped, styled, animated, and made accessible. Do not build components from memory; the patterns here keep the codebase consistent and keep the reveal and the rest of the app smooth on the devices Vantea targets globally.

Read `.agents/rules/design-system.md` and `.agents/rules/code-style.md` alongside this skill — this skill assumes both.

## What This Skill Covers

- The standard component file shape.
- When a component is a server component vs. a client component.
- How to handle variants with `class-variance-authority` (`cva`).
- How to use the design tokens (CSS variables) instead of hardcoded values.
- How motion belongs to components, and how it degrades gracefully.
- Accessibility defaults.
- The Vantea-specific components you will build most often.

## Where Components Live

- Primitive (Button, Input, Badge, Card, ConfirmDialog) → `components/ui/`
- Item domain (ItemCard, CategoryBadge, WhyNote) → `components/item/`
- Reveal (RevealSequence, WorthFigure) → `components/reveal/`
- Timeline (TimelineEntry, DurationLabel) → `components/timeline/`
- Recap / share (RecapCard, YearOfBuildingCard) → `components/recap/`
- AI surfaces (ConversationalAdd, AskVantea, ParsePreview) → `components/ai/`
- Shared across domains (EmptyState, PageHeader, MilestoneCard) → `components/shared/`
- Used exactly once in a page and complex → `app/.../_components/` alongside that page

## Component Template

Every component starts from this shape: a named export, a `type` for props, a `className` prop merged with `cn()`.

```tsx
import { cn } from '@/lib/cn';

type ItemCardProps = {
  // required props first
  name: string;
  category: string;
  // optional props after
  value?: string;
  whyNote?: string;
  className?: string;
};

export function ItemCard({ name, category, value, whyNote, className }: ItemCardProps) {
  return (
    <article className={cn('rounded-xl border border-slate/20 bg-parchment p-4', className)}>
      {/* ... */}
    </article>
  );
}
```

Rules:
- **Named export, never default.**
- Always accept `className` and merge it with `cn()` so the component composes.
- Required props first, optional props after, in the type.
- No `any`. Use `unknown` + a type guard if you truly don't know the shape.

## Server vs. Client

Default to a **server component**. Add `"use client"` only if the component actually needs state, effects, browser APIs, or real event handlers. If you are unsure, start without `"use client"` and let TypeScript tell you when you need it.

In Vantea the split is clear:
- **Server components:** display-only cards — `ItemCard`, `TimelineEntry`, `MilestoneCard`, a static `RecapCard`.
- **Client components:** anything animated or interactive — `RevealSequence` (the animated ritual), the AI surfaces (`ConversationalAdd`, `AskVantea`, `ParsePreview`), editing controls, and `ConfirmDialog`.

The reveal genuinely needs the client. A card that only displays data does not. Keep the boundary tight so the app stays fast.

## Design Tokens, Not Hardcoded Values

Style with Tailwind classes backed by the design tokens (CSS variables). Never reach for a raw hex or arbitrary pixel value:

- Colors: `bg-parchment`, `text-warm-ink`, `text-slate`, and — for achievement/progress moments only — `text-gold`, `text-teal`.
- Spacing, radius, borders: use the token-backed scale, not arbitrary values.
- If you find yourself typing `text-[#B8862B]` or `p-[13px]`, stop — there is almost certainly a token. If there genuinely isn't one, ask the developer. Do not invent tokens.

Remember the color discipline: **gold is achievement only, teal is progress only, and they never appear in the same moment.** Never put gold on an ordinary button.

## Variants with `cva`

If a component has variants (sizes, colors, styles), use `class-variance-authority`. Do not stack conditional class strings.

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const button = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:ring-2 focus-visible:ring-brand',
  {
    variants: {
      variant: {
        primary: 'bg-warm-ink text-parchment',
        secondary: 'bg-parchment text-warm-ink border border-slate/30',
        ghost: 'text-warm-ink hover:bg-warm-ink/5',
        danger: 'bg-danger text-parchment', // destructive actions (delete) only
      },
      size: { sm: 'h-9 px-3 text-body-sm', md: 'h-11 px-4 text-body', lg: 'h-12 px-6 text-body' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { className?: string };

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
```

Note there is no `gold` button variant — gold is reserved for the reveal and milestone surfaces, which are their own components, not a routine button.

## Motion in Components

Motion lives in the client components, never in `lib/`.

- Use the chosen animation library (Framer Motion assumed) for the reveal, milestone mini-reveals, and share cards.
- Use Tailwind `transition` utilities for simple hover/focus states, under ~200ms.
- **Every animation must mean something** — reinforce progress or the ritual. No decorative motion.
- **Always respect `prefers-reduced-motion`.** Provide a calm, non-animated fallback that still delivers the reveal. On lower-end devices the animation must stay smooth or step down cleanly.

## Accessibility Defaults

Wire these every time, not as an afterthought:

- Interactive elements get a visible focus state (`focus-visible:ring-2 focus-visible:ring-brand`).
- Icon-only buttons get an `aria-label`.
- Form inputs get associated labels above the field; error text is linked with `aria-describedby`.
- Item images (when they ship) use the item name as `alt`; decorative images use `alt=""`.
- Touch targets on mobile are at least 44px.
- Check contrast on gold-on-dark and teal — they are the risky pairs.

## Vantea-Specific Components

You will build these repeatedly. Keep them consistent — they carry most of the product's meaning.

- **ItemCard** — the unit of the Collection. Name, CategoryBadge, personal value + currency (quiet sans, not the big serif), optional "why" note, optional date, edit/delete. Server component. Renders gracefully for unvalued items (Skills, Places, People).
- **WorthFigure** — the total, in the **display serif**, large, in gold at the peak. Labelled "Your Worth," never "net worth." Never in a mono.
- **RevealSequence** — the animated ritual. Items appear one at a time, the timeline resolves, the number lands last. Client component. Fires only past the item threshold; re-fires at milestones. Has a reduced-motion fallback.
- **TimelineEntry** — a point on Your Journey. Emphasizes count and duration alongside value. Server component. Progress states use teal.
- **MilestoneCard / MilestoneBadge** — recognition for an achieved milestone ("First thing," "Ten things," "One year"). The one place ordinary UI touches gold. Never framed as a financial reward.
- **RecapCard / YearOfBuildingCard** — the shareable, non-comparative growth artifact. Screenshot-native, stands alone in a feed. Gold for the highlight, teal for progress.
- **ParsePreview** — shows what the AI parsed from a conversational add/edit ("Add MacBook Pro, Tech, ₦3,500,000?") before anything is written. Pairs with `ConfirmDialog`.
- **ConfirmDialog** — every AI write and every delete goes through it. Shows exactly what will happen; clear confirm and cancel.
- **EmptyState** — warm, inviting empty states for an empty collection, wishlist, or goals list. Empty and loading states are first-class in Vantea; build them, don't leave blank screens or spinners.

## Common Mistakes

- Marking a display-only card `"use client"`. If there's no state, effect, handler, or browser API, it's a server component.
- Hardcoding colors or pixel values instead of using tokens.
- Putting gold on an ordinary button, or using gold and teal in the same moment.
- Rendering the Worth figure in a mono. It is the display serif, on purpose.
- Building a second slightly-different `Button` instead of adding a variant to the existing one.
- Skipping the parse preview or the confirm step on an AI write or a delete.
- Forgetting the empty and loading states.
- Animating without a `prefers-reduced-motion` fallback.
- Leaving a `console.log` behind. Use `lib/logger.ts`.

## Verify Before Committing

- [ ] Named export, `className` accepted and merged with `cn()`.
- [ ] No hardcoded colors or pixel values; tokens only.
- [ ] No `any`.
- [ ] No `"use client"` unless actually needed.
- [ ] Gold used only for achievement, teal only for progress, never together.
- [ ] Worth figure is the display serif, not a mono.
- [ ] AI writes and deletes go through ParsePreview / ConfirmDialog.
- [ ] Renders correctly at mobile width and scales up.
- [ ] Focus state visible; icon-only controls have `aria-label`.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] Empty and loading states handled where relevant.
