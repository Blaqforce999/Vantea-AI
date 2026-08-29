# Design System Rules

Vantea AI has its own visual language. It is a beautiful personal journal, not a finance dashboard. The intended feeling is calm, intelligent, aspirational and rewarding — a quiet space where a user steps back and feels proud. Richness comes from restraint, not decoration. The design must earn emotional trust, because that trust is the whole product.

## Source of Truth: CSS Variables

The design tokens — colors, spacing, borders, typography, gradients, and the logo — already exist as **CSS variables** in the project's tokens stylesheet (e.g. `app/globals.css` or `styles/tokens.css`) and are wired into `tailwind.config.ts`. **That stylesheet is the source of truth.** This file documents what the tokens *mean* and *how to use them*; it does not redefine them.

Agents must:

- Use the token-backed Tailwind classes (or `var(--token)` where a class does not exist), never raw hex, raw pixel values, or arbitrary values that duplicate an existing token.
- If a value seems to be missing a token, stop and ask the developer before inventing one. The palette and scale are intentionally small; adding to them is a conversation, not a solo decision.
- Treat the variable names below as the *semantic roles*. If the actual variable names in the stylesheet differ, the stylesheet wins — match it.

## Design Principles — Calm Pride

Vantea sits between cold financial trackers and doing nothing at all. Financial apps say "here is your number." Vantea says "here is your journey." The intended feeling is **a private diary that happens to add up** — calm, personal, and quietly rewarding.

**The reveal is the product.** Invest disproportionately in that moment. Everything else supports it.

**Time is first class.** Surface duration and progress everywhere — how long you have been building, what has changed — not just the number.

**Calm over dense.** Generous whitespace, nothing intimidating, nothing that feels like a finance terminal.

**Personal, never comparative.** You against yourself, never you against others. There is no comparison UI in Vantea, by design.

**Every card should be screenshot-worthy on its own.** People screenshot rituals and milestones, not dashboards. Design each card to stand alone in a feed.

**Motion with meaning.** Animation reinforces progress; it is never decoration for its own sake.

**Useful skeletons and warm empty states.** An empty collection or wishlist is an invitation to dream, not a dead end.

## Color System

Five tokens, no more. If a sixth is ever needed, the layout is the problem, not the palette. The discipline: gold appears only in moments of achievement, which is what makes it feel expensive. Values below describe the roles; the exact hex values live in the CSS variables.

| Role (token) | Value | Meaning | Rule |
|---|---|---|---|
| Warm Ink (`--color-warm-ink`) | `#14120F` | Primary / brand | The logo color. All headings, body text, and strong surfaces. Never looks cheap, never dates. |
| Parchment (`--color-parchment`) | `#FAF8F5` | Base surface | Default background. Warm off-white, never pure white. Reads as paper, not as a web app. |
| Antique Gold (`--color-gold`) | `#B8862B` | Accent one — achievement | The reveal, milestones, and the Worth figure **only**. Never on ordinary buttons or routine UI. |
| Deep Teal (`--color-teal`) | `#1E4D48` | Accent two — progress | Progress and growth states only. **Never appears in the same moment as gold.** |
| Soft Slate (`--color-slate`) | `#6B655C` | Secondary | Muted text, metadata, and hairline borders. |

Color semantics, memorize them: **Warm Ink = brand and interface, Parchment = the paper, Gold = earned achievement, Teal = progress, Slate = quiet detail.** Gold and teal are *earned accents*, never default UI color, and they never share a moment.

Primary is Warm Ink; it anchors the logo and the entire interface. A **dark mode** — flipping the base to a warm near-black with gold on top — is recommended, because it makes the reveal genuinely cinematic. Build with dark mode in mind for the reveal and share cards especially.

### Gradients

Gradient tokens exist in the stylesheet for selected moments — chiefly the reveal and the share cards. Use them sparingly and never behind text-heavy reading surfaces; the Collection and item details must stay maximally legible. Gradients are a "cinematic accent," not a background default.

## Typography

Three roles. A display serif carries personality and the screenshot moments, a quiet sans carries the interface, and — deliberately — the Worth figure is rendered large in the **serif, not a mono**, so it reads as an achievement rather than a technical readout. Do not introduce a fourth typeface for variety.

| Typeface | Role | Use |
|---|---|---|
| **Display serif** (e.g. Fraunces or Instrument Serif) | Brand personality | Wordmark, the reveal, hero headlines, the recap cards, and **the Worth figure at large sizes.** Not for routine UI copy. |
| **Quiet sans** (e.g. Geist or Inter) | UI + body | Navigation, cards, forms, labels, and general interface. Carries most product information. |
| **Mono** (optional, minimal) | Metadata | Small dates and technical metadata only, if used at all. |

Typography rules:
- The display serif creates brand recognition. Do not use it for routine UI copy.
- The quiet sans carries most product information and interaction.
- **Let the serif, not a mono, carry the large Worth figure**, so value feels human rather than financial. This is the opposite of a finance app on purpose.
- Do not introduce more typefaces to create variety. Consistency comes from repeated roles, scale, weight, spacing, and placement.

Font sizes, line heights, and weights are defined as tokens in the stylesheet — use them. Fall back to a system stack so text is never blank while a font loads (fonts must not block first paint).

## Spacing

Use the project's spacing tokens (built on the Tailwind 4px scale). Be generous with whitespace — a cramped interface reads as a finance tool; a spacious one reads as a calm journal. Use the spacing, border-radius, and border tokens from the stylesheet rather than arbitrary values.

## Components

Primitives live in `components/ui/`. Compose them, do not replicate them.

### Button

Variants: `primary`, `secondary`, `ghost`, plus a `danger` variant reserved for genuinely destructive actions (delete an item). Sizes `sm`, `md`, `lg`; default `md`.

- Primary: filled with Warm Ink, on-brand text.
- Secondary: Parchment/warm surface, Warm Ink text, Slate border.
- Ghost: transparent, Warm Ink text, no border until hover.

**Gold is never a button color for ordinary actions.** It belongs to achievement moments only. If a button feels like it needs gold, it is probably a reveal or a share action, which is a different, special component — not a routine button.

### Input

Single input style. Label sits above the input, not inside it. Placeholder text is never a substitute for a label. Error messages appear below the input in a muted danger treatment, with a small icon. Focused state uses a Warm Ink (or brand) ring. Inputs are at least 44px tall on mobile to meet touch-target guidelines.

### Card

Rounded corners and a subtle Slate border, no heavy drop shadow by default. Add a small shadow only when a card genuinely needs to float. The ItemCard and the RecapCard are the workhorse cards (see layouts below).

### ConfirmDialog

Because the AI always confirms before it writes, and because deletes must be confirmed, `ConfirmDialog` is a first-class primitive. It shows exactly what will happen ("Add MacBook Pro, Tech, ₦3,500,000?" or "Delete your old phone?") with a clear confirm and cancel. Never destructive or AI-write action skips it.

### Badges

- **CategoryBadge** — a quiet label for an item's category (Tech, Cars and Vehicles, and so on). Neutral, never loud.
- **MilestoneBadge** — the one place ordinary UI touches gold. Marks an achieved milestone ("First thing," "Ten things," "One year"). Recognition, never a financial reward.

## Item Card Layout

The ItemCard is the unit of the Collection. It must feel like a journal entry, not a line item:

1. Item name.
2. CategoryBadge.
3. Personal value and currency (in the quiet sans at card scale — the serif is reserved for the big Worth figure, not every card).
4. Optional "why it mattered" note, if present — this is what makes the collection personal and feeds the recap.
5. Optional acquired date.
6. Edit / delete controls (delete goes through ConfirmDialog).

Items in the universal categories (Skills, Places, People) may have no value — render them gracefully without a number.

## Reveal Ritual Layout

This is the most important moment in the product. It fires only after a minimum threshold (recommended five items) so it lands with weight, and re-fires at milestones, not on every visit.

1. A calm, slow lead-in — the screen quiets before the reveal.
2. Items appear **one at a time**, sequential and unhurried.
3. The timeline resolves — how long you have been building.
4. **The number lands last**, in the display serif, in gold. This is the emotional peak.
5. It ends on a screenshot-worthy card. The number can be hidden if the user prefers.

Respect `prefers-reduced-motion` with a dignified, non-animated version that still delivers the reveal.

## Your Worth Layout

1. The total, presented as **"Your Worth," never "net worth,"** in the display serif at large size, in gold at the peak moments.
2. Always framed as a personal estimate based on the user's own entries.
3. A category breakdown showing where the worth comes from — this uses Deep Teal for progress/proportion, never gold.
4. Static by default. The figure only changes when the user changes it.

## Timeline Layout ("Your Journey")

1. Duration front and center — "three years ago, two things; today, fourteen."
2. Items and worth snapshots plotted over time.
3. Emphasize count and duration alongside value, not value alone.
4. Progress states use Deep Teal.

## Recap / Year of Building Card Layout

The primary shareable, non-comparative growth artifact.

1. A warm, personal headline ("Your Year of Building," "Your August").
2. What was added, milestones hit, progress made — drawn partly from the "why" notes.
3. Designed to stand alone in a social feed: clean, screenshot-native, and never comparative.
4. Gold for the achievement highlight; teal for progress. The share action generates a token via `lib/share.ts`.

## Iconography

Lucide React. One icon library, no mixing. Icons are 20px inside buttons, 24px in nav, 16px inline with text. Icons always have an accessible label via `aria-label` or visible text.

## Motion

Motion is not optional polish here — it is the product. But it is disciplined.

- The reveal, milestone mini-reveals, and share cards carry the heavy, meaningful animation.
- Ordinary UI uses restrained transitions (hover, focus) under ~200ms.
- Every animation must reinforce progress or the ritual. No movement for its own sake.
- Respect `prefers-reduced-motion` everywhere, and degrade gracefully on lower-end devices.
- Provide useful skeletons and warm empty states instead of spinners.

## Accessibility

Every interactive element is reachable by keyboard. Focus states are visible and use the brand ring. Color contrast meets WCAG AA — check gold-on-dark and teal carefully, they are the risky pairs. Form inputs have associated labels, and error messages are linked with `aria-describedby`. Buttons have text or an `aria-label`. Item images (when they ship) use the item name as `alt`; decorative images use `alt=""`. Animation-heavy surfaces must work with reduced motion.

## What Not to Do

- Do not use "net worth" anywhere in the interface. Always "Your Worth."
- Do not build any comparison, ranking, or leaderboard UI. Vantea is non-comparative by design.
- Do not put gold on ordinary buttons or routine UI. Gold is earned achievement only, and never shares a moment with teal.
- Do not add a sixth color. If you feel you need one, the layout is the problem.
- Do not render the Worth figure in a mono. The serif is deliberate — value should feel human, not technical.
- Do not add skeuomorphism, glassmorphism, or neumorphism. They date fast and cost performance.
- Do not use more than two font weights on a single screen (regular and bold, plus semibold for headings where needed).
- Do not let a value or figure appear to change on its own. Movement in a number must come from the user's own edit.
- Do not skip the confirm step on an AI write or a delete.
- Do not invent new tokens. If it isn't in the CSS variables, ask the developer.
