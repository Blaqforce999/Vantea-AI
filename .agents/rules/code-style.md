# Code Style Rules

These are the code-style rules for Vantea AI. They exist so the codebase reads the same way no matter who (or which agent) wrote a given file. Consistency matters more than personal preference.

## Language

TypeScript everywhere. No JavaScript files in `app/`, `components/`, or `lib/`. Configuration files like `next.config.mjs` and `tailwind.config.ts` are the only exceptions, and even `tailwind.config.ts` is TypeScript.

Strict mode is on. Do not disable `strict`, `noImplicitAny`, or `strictNullChecks` to make an error go away. Fix the type instead.

## Naming

- Components are `PascalCase` in `PascalCase.tsx` files. `ItemCard.tsx` exports `ItemCard`.
- Hooks start with `use` and live in `hooks/` or alongside the component that uses them if scoped.
- Utility functions are `camelCase` in `camelCase.ts` files.
- Constants are `SCREAMING_SNAKE_CASE` when they represent fixed configuration values, `camelCase` otherwise.
- Database models in Prisma are `PascalCase` singular: `User`, `Item`, `WorthSnapshot`, `WishlistItem`, `Goal`, `Milestone`. Table columns are `snake_case` in the database, mapped to `camelCase` in the Prisma client.
- Boolean variables read as yes/no questions: `isRevealUnlocked`, `hasProfile`, `isGuest`, `isConfirmed`, not `reveal`, `profile`, `guest`.

## File Organization

One component per file. If a helper function is only used inside one component, define it in the same file below the component. If it gets used anywhere else, lift it to `lib/`.

Order inside a component file:
1. Imports (React first, third-party next, local last, separated by blank lines)
2. Types and interfaces
3. Constants
4. The component itself
5. Helper functions used only by this component

## TypeScript

Prefer `type` over `interface` unless you need declaration merging. Keep types close to where they are used. When a type is shared across the app, put it in `lib/types.ts` or a domain-specific types file.

Do not use `any`. If you genuinely do not know the shape of something, use `unknown` and narrow it with a type guard. `any` is a last resort and should have a comment explaining why. This matters most in the AI layer: what the model returns is untyped until you validate it, so parse it with zod and narrow — never cast an AI response straight to a domain type.

Use zod for anything that comes from outside the app: form inputs, API request bodies, URL parameters, environment variables, and **AI model output**. Do not trust the compiler's types at these boundaries, because the data comes from outside TypeScript's reach.

## React

Write function components, not class components. Use hooks. Destructure props in the function signature. Give every component an explicit return type only when it improves clarity; most of the time inference is fine.

Server components are the default. Add `"use client"` only when the component actually needs interactivity, browser APIs, or client state. If a component is marked `"use client"` but has no `useState`, `useEffect`, `onClick`, or browser-only code, it should not be a client component. The reveal sequence, the AI surfaces, and editing controls are genuinely client components — the animated reveal needs the client. But a display-only `ItemCard` or `TimelineEntry` is a server component. Every unnecessary `"use client"` is weight the product does not need, especially on the constrained connections and lower-end devices Vantea targets globally.

Keep components small. If a component file is longer than about 200 lines, look for pieces to extract. The reveal sequence is the likely exception — even so, break it into named sub-parts rather than one giant file.

## Formatting

Prettier handles formatting. Do not argue with it. The config lives at the project root. Two-space indentation, single quotes for strings, semicolons required, trailing commas where valid.

Imports are sorted: Node built-ins, then third-party packages, then local imports (aliased with `@/`), with a blank line between each group. The ESLint config enforces this.

## Comments

Write comments that explain *why*, not *what*. The code already says what it does. If a comment is paraphrasing the line below it, delete it.

Good comment: `// Snapshots are written silently on every worth-changing write so the timeline has history retroactively, even before the timeline UI existed.`

Bad comment: `// Save the snapshot.`

JSDoc blocks are worth writing for public utility functions in `lib/`, especially anything in `worth.ts`, `milestones.ts`, `ai.ts`, `auth.ts`, or validation. For internal components, the types usually tell the story.

## Error Handling

Use try/catch around anything that can throw: database calls, the Anthropic API call, JSON parsing. Catch the error, log it with enough context to debug, and return the structured error response defined in `architecture.md`.

Never swallow errors silently. A bare `catch (e) {}` with no log and no rethrow is a bug waiting to happen.

Never expose raw error messages to the end user. They may contain stack traces, file paths, database details, or fragments of a prompt that should not leak.

## Async Code

Prefer `async`/`await` over `.then()` chains. It reads better and makes error handling cleaner.

Do not fire off a promise without awaiting it unless you mean to. If you are intentionally running something in the background, add a comment saying so.

## Imports

Use the `@/` alias for local imports. `import { Button } from '@/components/ui/Button'`, not `import { Button } from '../../../components/ui/Button'`.

Do not import from `app/` into `components/` or `lib/`. Dependencies flow one way: `lib` is the foundation, `components` sits on top of `lib`, and `app` sits on top of both.

## Styling

Tailwind classes only, referencing the project's design tokens. No inline styles, no CSS modules, no styled-components. The color, spacing, border, typography, and gradient tokens live as CSS variables (see `design-system.md`) and are wired into `tailwind.config.ts`; use the token-backed classes rather than raw hex or arbitrary pixel values. If a pattern repeats, extract it into a component, not a CSS class.

Class order follows the standard Tailwind convention: layout, then box model, then typography, then visual. The Prettier plugin for Tailwind enforces this.

## Animation

Motion is central to Vantea, so treat it as first-class code, not decoration.

- Use the chosen animation library (Framer Motion assumed) for the reveal and other meaningful motion. Use Tailwind `transition` utilities for simple hover/focus states.
- **Motion must mean something.** Animation reinforces progress and the ritual of the reveal. Do not add movement that carries no meaning.
- **Degrade gracefully.** Respect `prefers-reduced-motion` and provide a calm, non-animated fallback that still lands the reveal. On lower-end devices the experience must stay smooth or step down cleanly — never janky.
- Keep animation logic out of `lib/`. Motion belongs in the client components under `components/reveal/` and friends.

## What Not to Do

- Do not add Lodash. Modern JavaScript handles most of what people used Lodash for.
- Do not add Moment. Use `date-fns` if you need date handling — duration and "how long you've been building" are first-class in Vantea, so date logic should be correct and testable.
- Do not add a component library (MUI, Chakra, Ant, shadcn/ui). We build our own with Tailwind and follow `design-system.md`.
- Do not use floating-point math on values. Use the `Decimal` type (see `db-migration-runner/SKILL.md`) so totals are exact even though the numbers are estimates.
- Do not leave `console.log` calls in committed code. Use the logger in `lib/logger.ts`.
- Do not add dependencies without discussing with the developer. Every dependency is a long-term cost.
