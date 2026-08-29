# Workflow: Creating a New Component

Follow this workflow when you need to build a new React component for Vantea AI. It chains the relevant rules and skills together so you end up with something that fits the codebase, feels like a calm journal, and stays smooth on the devices Vantea targets globally.

## Before You Touch Any File

**Step 1. Check whether the component already exists.**

Search `components/` for anything with a similar name or purpose. If a similar component exists, the right move is almost always to extend it (add a variant, add a prop) rather than create a new one. Two slightly different `Button` components is the start of a mess.

**Step 2. Decide where it goes.**

- Primitive (Button, Input, Badge, Card, ConfirmDialog) → `components/ui/`
- Item domain (ItemCard, CategoryBadge, WhyNote) → `components/item/`
- Reveal (RevealSequence, WorthFigure) → `components/reveal/`
- Timeline (TimelineEntry, DurationLabel) → `components/timeline/`
- Recap / share (RecapCard, YearOfBuildingCard) → `components/recap/`
- AI surfaces (ConversationalAdd, AskVantea, ParsePreview) → `components/ai/`
- Composite used in multiple domains (EmptyState, PageHeader, MilestoneCard) → `components/shared/`
- Used exactly once in a page and complex → `app/.../_components/` alongside that page

**Step 3. Load the right context.**

Open and read these files in order:

1. `.agents/rules/design-system.md` — the tokens (CSS variables), the color discipline, typography, motion, and component patterns.
2. `.agents/rules/code-style.md` — naming, file organization, TypeScript conventions, and the animation rules.
3. `skills/component-builder/SKILL.md` — the component template and the variant patterns.

Do not skip these. They are short and they are the difference between a component that fits and one that does not.

## Build It

**Step 4. Create the file.**

Use the template from `skills/component-builder/SKILL.md`. The shape is:

```tsx
import { cn } from '@/lib/cn';

type ComponentNameProps = {
  // required props first
  // optional props after
  className?: string;
};

export function ComponentName({ /* ... */, className }: ComponentNameProps) {
  return (
    <div className={cn('base-classes-here', className)}>
      {/* ... */}
    </div>
  );
}
```

**Step 5. Decide server vs. client.**

Default to a server component. Add `"use client"` only if the component actually needs state, effects, browser APIs, or real event handlers. Display-only cards (`ItemCard`, `TimelineEntry`, `MilestoneCard`) are server components. Animated or interactive components (`RevealSequence`, the AI surfaces, editing controls, `ConfirmDialog`) are client components. If you are unsure, start without `"use client"` and let TypeScript tell you if you need it.

**Step 6. Style with design tokens.**

Tailwind classes, no inline styles, no custom CSS. Use the token-backed classes (`bg-parchment`, `text-warm-ink`, `text-slate`, and `text-gold` / `text-teal` for achievement / progress only). Remember the discipline: **gold is achievement only, teal is progress only, they never share a moment, and gold is never on an ordinary button.** If you find yourself reaching for an arbitrary value like `text-[#B8862B]` or `p-[13px]`, pause and check for a token. There almost always is one. If there genuinely isn't, ask the developer — do not invent tokens.

If the component shows the Worth figure, render it in the **display serif**, not a mono.

**Step 7. Handle variants with `cva` if needed.**

If the component has variants (sizes, colors, styles), use `class-variance-authority`. See the Button example in `skills/component-builder/SKILL.md`. Do not stack conditional class strings.

**Step 8. Wire motion, if the component animates.**

If it is a reveal, milestone, or share surface, use the animation library and make the motion meaningful. **Add a `prefers-reduced-motion` fallback** that still delivers the moment, and confirm it stays smooth (or steps down cleanly) on a lower-end device. Ordinary components use simple transitions only.

**Step 9. Wire accessibility.**

- Interactive elements get a visible focus state (`focus-visible:ring-2 focus-visible:ring-brand`).
- Icon-only buttons get `aria-label`.
- Form inputs get associated labels above the field.
- Item images (when they ship) get the item name as `alt` text; decorative images get `alt=""`.
- Check contrast on gold-on-dark and teal.

**Step 10. Handle the empty and loading states.**

Vantea treats empty and loading states as first-class. If the component can render with no data (an empty collection, wishlist, or goals list), build the warm "invite them to dream" empty state and the skeleton now — do not leave a blank screen or a spinner. If the component is an AI write surface or a delete control, wire the `ParsePreview` / `ConfirmDialog` step; nothing writes or deletes without confirmation.

## Check Your Work

**Step 11. Manually verify.**

If it is a primitive, import it into `app/_dev/page.tsx` and render every variant, size, and state. View it at mobile viewport width and scale up. Tab into it to check the focus state. Hover over it.

If it is a domain component, view it in the page that uses it. Resize to mobile. Check keyboard navigation. For an animated component, toggle `prefers-reduced-motion` and confirm the fallback still lands. For a `WorthFigure`, confirm it uses the serif and says "Your Worth," never "net worth." For any AI or delete surface, confirm the confirm step fires.

**Step 12. Cross-check against the rules.**

- [ ] Named export, not default.
- [ ] `className` prop accepted and merged with `cn()`.
- [ ] No hardcoded colors or pixel values — tokens only.
- [ ] Gold used only for achievement, teal only for progress, never together; no gold on ordinary buttons.
- [ ] Worth figure is the display serif, not a mono.
- [ ] No `any` types.
- [ ] No `"use client"` unless actually needed.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] AI writes and deletes go through ParsePreview / ConfirmDialog.
- [ ] Works on a mobile-width screen and scales up.
- [ ] Focus state visible; icon-only controls labelled.
- [ ] Empty / loading states handled where relevant.
- [ ] No `console.log` left behind.

**Step 13. Commit.**

Descriptive commit message. If the component is non-trivial, mention the intended use case in the message body so future you or future agents know why it exists.

## When Things Go Wrong

If you are stuck on something that does not fit the design system, do not invent new tokens or patterns. Ask the developer. The whole point of a design system — especially one built on locked CSS variables and a five-color discipline — is that it does not grow unchecked. And if a component starts to feel like a finance dashboard rather than a calm journal, stop: that is a signal it has drifted from the product.
