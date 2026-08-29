# API Route Scaffolder Skill

Load this skill for any task that adds or changes a route handler, server action, or AI endpoint in Vantea AI. It is the source of truth for how endpoints are shaped, validated, authenticated, and how they return data. Do not scaffold endpoints from memory.

Read `.agents/rules/architecture.md`, `.agents/rules/security.md`, and `.agents/rules/code-style.md` alongside this skill — this skill assumes all three.

## Route Handler, Server Action, or AI Endpoint?

- **Called by our own UI as a form submit or UI-triggered mutation** (add/edit/delete item, add wishlist item, set goal, update profile) → **server action** in a sibling `actions.ts` of the page that triggers it, with `"use server"` at the top.
- **Called as a read API or by client-driven fetching** (fetch-more items, share-card read) → **route handler** in `app/api/.../route.ts`.
- **An AI operation** (parse a conversational add/edit, answer an Ask Vantea question) → **route handler** in `app/api/ai/.../route.ts` that calls `lib/ai.ts`. AI endpoints **parse and answer; they do not write.** The write happens through the ordinary server action *after* the user confirms.

Server actions are the default for the user's own writes. There are no payment endpoints, no bank-connection endpoints, and no webhooks in Vantea.

## The Response Envelope

Every route handler and server action returns the same shape.

Success: `{ ok: true, data }`
Failure: `{ ok: false, error: { code, message } }`

The client never receives raw exceptions, stack traces, Prisma error objects, or raw AI responses. Use proper HTTP status codes in route handlers: `200` success, `400` invalid input, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict, `429` rate limited, `500` server error.

## Route Handler Template

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const inputSchema = z.object({
  cursor: z.string().cuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(); // resolves a guest or account session
    if (!session) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } }, { status: 401 });
    }

    const parsed = inputSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid request.' } }, { status: 400 });
    }

    // a user can only ever read their own data
    const items = await db.item.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ ok: true, data: { items } }, { status: 200 });
  } catch (err) {
    logger.error('items.list.failed', { error: err });
    return NextResponse.json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } }, { status: 500 });
  }
}
```

## Server Action Template

```ts
'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordWorthSnapshot } from '@/lib/worth';
import { checkMilestones } from '@/lib/milestones';
import { logger } from '@/lib/logger';

const inputSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum([
    'HOME_AND_LAND', 'CARS_AND_VEHICLES', 'TECH', 'MONEY', 'JEWELRY_AND_LUXURY',
    'BUSINESS', 'COLLECTIONS', 'SKILLS', 'PLACES', 'PEOPLE', 'OTHER',
  ]),
  value: z.number().nonnegative().optional(),   // personal estimate; optional for unvalued categories
  currency: z.string().length(3).optional(),
  acquiredDate: z.coerce.date().optional(),
  whyNote: z.string().max(500).optional(),
});

export async function addItem(raw: unknown) {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };

  try {
    const item = await db.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: { ...parsed.data, userId: session.userId },
      });
      await recordWorthSnapshot(tx, session.userId); // silent snapshot on every worth-changing write
      return created;
    });

    await checkMilestones(session.userId); // deterministic; may award "first thing", "ten things", etc.
    revalidateTag(`collection:${session.userId}`);
    revalidateTag(`worth:${session.userId}`);

    logger.info('item.created', { userId: session.userId, itemId: item.id }); // no name, no value, no note
    return { ok: true, data: { id: item.id } };
  } catch (err) {
    logger.error('item.create.failed', { userId: session.userId, error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not add this.' } };
  }
}
```

## AI Endpoint Template (parse only — never writes)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { parseItemFromText } from '@/lib/ai';   // wraps the Anthropic API, own-data-only
import { logger } from '@/lib/logger';

const inputSchema = z.object({ text: z.string().min(1).max(1000) });

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } }, { status: 401 });
    }

    const parsed = inputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid request.' } }, { status: 400 });
    }

    // The AI parses into a preview. It does NOT write. The client shows a ParsePreview +
    // ConfirmDialog, then calls the ordinary addItem server action on confirm.
    const preview = await parseItemFromText(parsed.data.text); // validated with zod inside lib/ai.ts
    return NextResponse.json({ ok: true, data: { preview } }, { status: 200 });
  } catch (err) {
    logger.error('ai.parse.failed', { error: err }); // never log the text or the completion
    return NextResponse.json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Could not read that.' } }, { status: 500 });
  }
}
```

## The Rules of a Good Endpoint

**1. Validate first.** Define the `inputSchema` before any business logic. Every accepted field is in the schema; anything outside it is stripped and never trusted. Validate URL params and query strings too. For AI endpoints, also validate the *model's output* with zod before it becomes a preview — never trust a raw completion.

**2. Authenticate, then authorize.** Is there a valid session (guest or account)? If not, `401`. Then: **does this session own the specific resource?** Every read and write is scoped to `session.userId`. A user can only ever touch their own data. Check ownership explicitly (`item.userId === session.userId`); never rely on the URL shape.

**3. Keep the body thin.** If the work is more than ~30 lines, extract it into a function in `lib/` — worth totalling lives in `lib/worth.ts`, milestone evaluation in `lib/milestones.ts`, AI calls in `lib/ai.ts`. Endpoints translate a request into a function call; they don't orchestrate.

**4. Use a transaction when writes must succeed together.** Adding or editing an item and writing its `WorthSnapshot` must be one `db.$transaction` — the snapshot must never drift from the items it summarizes.

**5. Write a silent snapshot on every worth-changing write.** Add, edit-value, and delete all call `recordWorthSnapshot`. This is what makes the timeline possible. Never skip it.

**6. Handle idempotency where a repeat is possible.** Vantea has no payments, so idempotency is about avoiding duplicate rows, not double-charging. Once-only milestones ("first thing," "ten things," "one year") must not be awarded twice — the milestone engine checks before it inserts. Recurring milestones like "new high" are the exception and are handled explicitly.

**7. Confirm before an AI write.** AI endpoints parse and answer; they never mutate. The write goes through the ordinary server action *after* the user confirms in the UI. There is no code path where the model writes directly.

**8. Return the envelope and the right status code.**

**9. Log the right things — and never the sensitive ones.** One structured line on success (`logger.info('item.created', { userId, itemId })`), the error with context on failure. **Never log item names, values, "why" notes, wishlist/goal contents, or any AI prompt or completion.**

**10. Revalidate caches (server actions only).** If the action mutates data displayed elsewhere (the collection, the worth total, the timeline), call `revalidateTag` / `revalidatePath` so the UI doesn't serve stale data.

## AI Endpoints in Detail

The two AI operations are **parse** (conversational add/edit) and **ask** (Ask Vantea).

- Both call `lib/ai.ts`, which builds the prompt from **only the requesting user's own data** and holds the API key server-side.
- Both are read-only with respect to the database. Parse produces a preview; ask produces an answer. Neither writes.
- Rate-limit them — they call a paid third-party API.
- Validate the model's structured output with zod. If the model returns something malformed, return a clean error or re-prompt; never write an unvalidated shape.
- The model gives no advice and no valuations — enforce this in the system prompt inside `lib/ai.ts`.

## Read Endpoints

The user's own reads are scoped to their `userId`. The one public read is the **shared card** at `/share/[token]`: validate the token, and return **only** the fields baked into that card. Never let a share endpoint expose the user's whole collection or any field they didn't choose to share.

## Common Mistakes

- Skipping the zod schema and trusting `req.json()` — or trusting a raw AI completion.
- Relying on the URL shape for ownership instead of an explicit `userId` check.
- Fat endpoints doing five things — move logic to `lib/`.
- Forgetting the silent `WorthSnapshot` on a worth-changing write.
- Letting an AI endpoint write to the database directly, or skipping the confirm step.
- Awarding a once-only milestone twice.
- Logging item names, values, notes, or AI content.
- Forgetting `revalidateTag` after a mutation, so the collection or worth total shows stale data.
- Adding a payment, bank, order, or transaction endpoint. Vantea moves no money.

## Security Checklist Before Committing

- [ ] Input validated with zod (body, params, query, and AI output).
- [ ] Session checked (guest or account).
- [ ] Ownership scoped to `session.userId` on every read and write.
- [ ] AI endpoints parse/answer only — no direct writes; confirm happens in the UI.
- [ ] Silent `WorthSnapshot` written on worth-changing writes, inside a transaction.
- [ ] Once-only milestones guarded against double-award.
- [ ] Rate limit in place for auth and AI endpoints.
- [ ] No raw error messages, Prisma objects, or AI completions returned to the client.
- [ ] No item names, values, notes, or AI content logged.
- [ ] Multi-writes wrapped in `db.$transaction`.
