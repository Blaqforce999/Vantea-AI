# Architecture Rules

These rules describe how Vantea AI is put together. Every agent building features must follow this architecture. Do not introduce new patterns without discussing them with the developer first.

## The Stack

Vantea is a Next.js application using the App Router, written in TypeScript, backed by PostgreSQL on Neon through Prisma. Styling is handled by Tailwind CSS, wired to the project's CSS-variable design tokens. Motion is handled by an animation library (Framer Motion is the working assumption; confirm at build). The AI layer calls the Anthropic API. There is no separate backend service — everything lives in the Next.js app, using server components, server actions, and route handlers. It ships as a Progressive Web App and deploys on Vercel.

The stack is locked. Do not reach for an alternative database, ORM, UI library, animation library, or backend service. They are superseded by the stack above.

## Directory Layout

```
app/
├── (marketing)/               public landing page, the shared-reveal experience for new visitors
├── (app)/                     the product itself, grouped by layout
│   ├── collection/            the Collection — items grouped by category (heart of the product)
│   ├── reveal/                the reveal ritual (animated unveil)
│   ├── worth/                 Your Worth + category breakdown
│   ├── timeline/              Your Journey — duration and growth over time
│   ├── milestones/            milestone recognition and mini-reveal cards
│   ├── wishlist/              What I Want
│   ├── goals/                 active targets and progress
│   ├── recap/                 the recap moment + Year of Building card
│   ├── ask/                   Ask Vantea (AI over the user's own data)
│   └── privacy/               the privacy center (what's stored, export, delete)
├── api/
│   ├── auth/                  login, signup, logout, guest-session route handlers
│   ├── items/                 item read endpoints where client-driven fetching is needed
│   ├── ai/                    AI endpoints (parse, ask) — own-data-only, confirm-before-write
│   └── share/                 public read for a shared recap/milestone card
├── share/[token]/             public, indexable shared-card page (the growth loop's landing)
└── layout.tsx                 root layout

components/
├── ui/                        primitive components (Button, Input, Card, Badge, ConfirmDialog, etc.)
├── item/                      item-specific components (ItemCard, CategoryBadge, WhyNote)
├── reveal/                    the reveal sequence and its parts (RevealSequence, WorthFigure)
├── timeline/                  timeline components (TimelineEntry, DurationLabel)
├── recap/                     recap and share-card components (RecapCard, YearOfBuildingCard)
├── ai/                        AI surfaces (ConversationalAdd, AskVantea, ParsePreview)
└── shared/                    shared across domains (EmptyState, PageHeader, MilestoneCard)

lib/
├── db.ts                      Prisma client singleton
├── auth.ts                    session, guest-session, and auth helpers
├── worth.ts                   worth totalling + silent snapshot logic (no valuation, just arithmetic)
├── milestones.ts              deterministic milestone evaluation
├── ai.ts                      Anthropic API wrapper — own-data-only, confirm-before-write
├── share.ts                   share-token generation for recap/milestone cards
├── storage.ts                 object-storage wrapper for optional item images (deferred)
├── env.ts                     zod-validated environment config
└── validators/                zod schemas for input validation

prisma/
├── schema.prisma              single source of truth for the database
└── migrations/                generated migration files

public/                        static assets, PWA manifest, icons
```

## Rendering Rules

The **reveal ritual** and the **share/recap cards** are the product's signature moments. The reveal is a client-side animated sequence — items appear one at a time, the timeline resolves, the number lands last — so it lives in client components under `components/reveal/`. Invest disproportionately here; it degrades gracefully on lower-end devices (see `code-style.md`), but it is where the magic is.

The **shared-card page** at `/share/[token]` must be server-rendered. It is the growth loop's landing page — what a new visitor opens from a shared link — so it must load fast, produce good Open Graph previews for social feeds, and be cleanly indexable. It opens the reveal experience for visitors with no install wall.

Everything else — the Collection, Worth, Timeline — renders on the server for first paint, with client interactivity layered on top only where it is needed (the animated reveal, the AI surfaces, editing). Data fetching happens on the server. Do not fetch from API routes inside client components when a server component can pass the data down directly.

## Data Flow

There is no payment flow, no bank connection, no checkout, and no webhook in Vantea. Data flow is: a lot of the user's own reads, a modest number of the user's own writes, and an AI layer that always confirms before it writes.

1. **The user's own reads** — Collection, Worth, Timeline, milestones, wishlist, goals — are served by server components. A user can only ever read their own data.

2. **The user's own writes** — add / edit / delete an item, add a wishlist item, set a goal — go through **server actions**. The action validates input with zod, writes through Prisma, updates the worth total and writes a silent `WorthSnapshot`, runs the milestone check, and revalidates the relevant cache tags. **A user can only mutate their own resources.**

3. **AI writes** go through the AI layer and always **parse → confirm → write**. The user says "I bought a MacBook Pro for 3.5 million naira"; `lib/ai.ts` parses it into `{ name, category, value, currency }`; the UI shows a `ParsePreview`; only after the user confirms does the same server action that a form would call actually write the row. The AI never silently rewrites user data.

4. **Shared cards** — a recap or milestone card the user chooses to share — generate a share token via `lib/share.ts`. The public `/share/[token]` page reads only the fields baked into that card. Sharing is always the user's explicit choice, and shared cards are non-comparative by construction.

There are no public-facing writes and no third-party integrations that push data in.

## The AI Layer

The AI layer is core to the product, but it is tightly scoped. It exists to remove entry friction and answer questions over the user's own data — never to advise, value, or compare.

- All AI calls go through `lib/ai.ts`. Do not call the Anthropic API directly from a component or scatter API calls across the codebase.
- **Own data only.** The only context the AI ever receives is the requesting user's own records. Never pass another user's data, aggregate data, or external data into a prompt.
- **Confirm before every write.** Conversational add, edit, and delete all resolve to a preview the user confirms. No silent mutation.
- **No advice, no valuation.** The AI does not recommend financial products, does not tell the user what to buy or sell, and does not generate values the user did not enter. Insights are gentle and observational only ("You've added seven things since you joined"), never comparative and never advisory.

## Worth and Snapshots

"Your Worth" is the sum of the user's own estimated item values — arithmetic on numbers they typed, nothing more. It is **static by default**: it changes only when the user adds, edits, or deletes an item, never on its own from markets or the passage of time.

Every change that affects the total writes a silent `WorthSnapshot` (total, item count, currency, timestamp). Snapshots are what make the timeline possible; they are written from the very first save, even before the timeline UI ships, so history exists retroactively when the UI arrives. Worth totalling and snapshot writing live in `lib/worth.ts`, not in components or routes.

Because V1 does no currency conversion, totals are computed **within a single currency**. When a user has mixed currencies, show a per-currency breakdown rather than fabricating a converted grand total. Do not invent an exchange rate.

## State Management

There is no global state library. React state and server data are enough. The reveal sequence's animation state, the conversational-add draft, and the parse preview can live in local client state. Do not reach for Redux, Zustand, or Jotai. If you feel the urge to add one, stop and reconsider.

## Database Access

All database access goes through Prisma. Raw SQL is only allowed in migration files. Every query that takes user input must use Prisma's parameterized query builder, never string interpolation.

The Prisma client is imported from `lib/db.ts`, which exports a singleton. Do not instantiate `new PrismaClient()` anywhere else; creating multiple clients exhausts the connection pool in development and on serverless.

## Authentication

Vantea is **guest-first**. A visitor can add items and reach the reveal before being asked to sign up — friction there kills the core loop. A guest session is created on first use and can later be upgraded to a real account, carrying the guest's data with it.

Sessions are cookie-based. Cookies are `httpOnly`, `secure` in production, and `sameSite: lax`. The session helper in `lib/auth.ts` exposes `getSession()` (which resolves either a guest or an account session) for server components and server actions. Client components that need auth state receive it as a prop from their parent server component. Every mutation checks that the session owns the resource it is touching.

## Error Handling

Server actions and route handlers return structured responses. Success is `{ ok: true, data }` and failure is `{ ok: false, error: { code, message } }`. The client never receives raw exception messages, stack traces, or Prisma error objects. Log the full error on the server, return a sanitized message to the user.

## Environments

- `development` runs locally against a local PostgreSQL (or a Neon dev branch).
- `production` runs on Vercel against the production Neon database.

There is no staging environment yet. When we add one, it will use a separate production-shaped Neon branch.

## What Not to Do

- Do not add GraphQL. REST route handlers and server actions are enough.
- Do not add a separate Node or Express backend. Everything stays in Next.js.
- Do not reach for microservices. This is one app.
- Do not add bank connections, open-banking APIs, payment processing, or anything that moves money. Vantea is a memory and progress layer.
- Do not add a valuation engine, market-price lookups, internet research, or photo identification in V1. Every value is a user estimate.
- Do not build any comparison, leaderboard, or ranking feature. Vantea is non-comparative by design.
- Do not let a value change on its own. No auto-refresh of a figure from markets or time.
- Do not call the Anthropic API from anywhere but `lib/ai.ts`, and never let the AI write without a user confirmation.
- Do not add a global state library. React state and server data are enough.
- Do not store item images on the filesystem if/when images ship. Use the configured storage provider (`lib/storage.ts`). The filesystem is ephemeral on Vercel.
- Do not introduce a new framework, database, UI library, or animation library without an explicit engineering decision.
