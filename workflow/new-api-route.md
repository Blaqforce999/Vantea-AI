# Workflow: Creating a New API Route

Follow this workflow when you need to add a new API route, server action, or AI endpoint to Vantea AI. It chains the architecture, security, and code-style rules with the route scaffolder skill so the new endpoint fits the codebase and does not introduce a security or privacy hole. Vantea moves no money and connects to no bank, so there is no payment or webhook path here — the sensitive surfaces are the user's private records, the AI layer, and the worth/timeline history.

## Before You Touch Any File

**Step 1. Decide: route handler, server action, or AI endpoint?**

- Called by our own UI as a form submit or UI-triggered mutation (add/edit/delete item, wishlist, goal, profile) → **server action** in `app/.../actions.ts`.
- Called as a read API or by client-driven fetching (fetch-more items, shared-card read) → **route handler** in `app/api/.../route.ts`.
- An AI operation (parse a conversational add/edit, answer Ask Vantea) → **route handler** in `app/api/ai/.../route.ts` that calls `lib/ai.ts`. **AI endpoints parse and answer; they never write.** The write happens through the ordinary server action after the user confirms.

Server actions are the default for the user's own writes. Route handlers are for read APIs and AI operations.

**Step 2. Decide on the data model.**

Sketch the input and the output before writing code. What fields come in? What gets validated? What rows are read or written? What does success look like? What does failure look like?

If the endpoint changes the user's worth (add, edit-value, delete), the sketch must include the **silent `WorthSnapshot`** and the **milestone check**. If the endpoint can be called twice for the same thing, the sketch must include idempotency — not to avoid double-charging (there is no money) but to avoid duplicate rows and double-awarded milestones. See `skills/db-migration-runner/SKILL.md`.

**Step 3. Load the right context.**

Open and read in order:

1. `.agents/rules/architecture.md` — where the route lives, data-flow conventions, the AI layer, worth/snapshots.
2. `.agents/rules/security.md` — the non-negotiables for input validation, auth, ownership, privacy, and AI-layer safety.
3. `.agents/rules/code-style.md` — naming, error handling, logging patterns.
4. `skills/api-route-scaffolder/SKILL.md` — the route/action/AI templates and the envelope convention.
5. If the route changes the schema: `skills/db-migration-runner/SKILL.md`.

## Build It

**Step 4. Create the file.**

Use the appropriate template from `skills/api-route-scaffolder/SKILL.md`. Route handlers go at `app/api/<resource>/<action>/route.ts`. AI endpoints go at `app/api/ai/<operation>/route.ts`. Server actions go in a sibling `actions.ts` of the page that triggers them, with `"use server"` at the top.

**Step 5. Write the zod schema first.**

Before any business logic, define the `inputSchema`. Every field the endpoint accepts is in the schema. Nothing outside the schema is trusted. If the client sends a field you did not declare, zod strips it. For AI endpoints, also plan to validate the **model's output** with zod before it becomes a preview — a raw completion is untrusted input.

**Step 6. Authenticate, then authorize.**

Authenticate: is there a valid session (guest or account)? If not, return `401`.

Authorize: **every read and write is scoped to `session.userId`.** A user can only ever touch their own items, snapshots, wishlist, goals, and milestones. Check ownership explicitly (`item.userId === session.userId`); never rely on the URL shape — a crafted URL can target any row. There is no admin or cross-user access anywhere in Vantea.

**Step 7. Validate again at the boundaries.**

If the route accepts a URL parameter or query string (a share token, a cursor, a filter), validate it too. The principle: all outside input gets validated, not just JSON bodies — and AI output counts as outside input.

**Step 8. Do the work.**

Keep the body of the try block short. If it is more than ~30 lines, extract the core logic into a function in `lib/` — worth totalling in `lib/worth.ts`, milestone evaluation in `lib/milestones.ts`, AI calls in `lib/ai.ts`. Endpoints are thin.

If the endpoint changes worth, wrap the item write and the `recordWorthSnapshot` call in one `db.$transaction` so the snapshot never drifts from the items. Run the milestone check after the transaction commits. Use `db.$transaction` whenever two or more writes must succeed together.

For AI endpoints: call `lib/ai.ts`, which builds the prompt from **only this user's own data** and holds the API key server-side. Return a preview or an answer. **Do not write to the database from an AI endpoint** — the write is a separate, confirmed server action.

**Step 9. Return the consistent envelope.**

Success: `{ ok: true, data }`.
Failure: `{ ok: false, error: { code, message } }`.

Use proper HTTP status codes: `200` success, `400` invalid input, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict, `429` rate limited, `500` server error. Never return a raw exception, a Prisma object, or a raw AI completion.

**Step 10. Log the right things — and never the sensitive ones.**

On success, a single structured log line: `logger.info('item.created', { userId, itemId })`.
On failure, log the error with context: `logger.error('item.create.failed', { userId, error })`.
**Never log** item names, values, "why" notes, wishlist/goal contents, passwords, session tokens, the Anthropic key, or **any AI prompt or completion.** The data is intimate; the logs must not leak it.

**Step 11. Revalidate caches (server actions only).**

If the action mutates data displayed elsewhere (the collection, the worth total, the timeline, milestones), call `revalidateTag` or `revalidatePath` so the cache updates. Forget this and the UI serves stale data.

## Check Your Work

**Step 12. Walk the security checklist.**

- [ ] Input validated with zod (body, params, query, and AI output).
- [ ] Session checked (guest or account).
- [ ] Ownership scoped to `session.userId` on every read and write.
- [ ] AI endpoints parse/answer only — no direct writes; confirm happens in the UI.
- [ ] Silent `WorthSnapshot` written on worth-changing writes, inside a transaction.
- [ ] Milestone check run where relevant; once-only milestones guarded against double-award.
- [ ] Rate limit considered for auth and AI endpoints.
- [ ] No raw error messages, Prisma objects, or AI completions returned to the client.
- [ ] No item names, values, notes, or AI content logged.
- [ ] Database writes that must happen together are in a `db.$transaction`.

**Step 13. Test the happy path and the unhappy paths.**

Hit the route with valid input. Confirm success.
Hit it with missing fields. Confirm the 400.
Hit it without a session. Confirm the 401.
Hit it with a session that does not own the target resource. Confirm the 403 (or that it simply can't see the row).
If the route changes worth, confirm a `WorthSnapshot` was written and the total is correct.
For an AI endpoint, confirm it returns a preview/answer and writes nothing to the database.
If the route can award a once-only milestone, trigger it twice and confirm it is not double-awarded.

**Step 14. Check the network tab.**

Confirm the actual HTTP status code matches what you intended. Confirm the response body matches the envelope. Confirm no item values, notes, other user data, or internal fields leak in the response.

**Step 15. Commit.**

Commit message says what the route does in one line. If it is part of a larger feature, reference the feature in the body.

## When Things Go Wrong

If the route starts to do too many things (writing an item, snapshotting worth, evaluating milestones, calling the AI, revalidating five caches), stop. That is a sign the logic should move into service functions in `lib/` (`worth.ts`, `milestones.ts`, `ai.ts`) that the route thinly wraps. Endpoints translate a request into function calls; they don't orchestrate.

If you find yourself wanting an AI endpoint to write directly, or to skip the confirm step "just this once," stop. That path does not exist in Vantea by design — parse, show, confirm, then write through the ordinary action. And if you need to change the database schema to support this route, stop and read `skills/db-migration-runner/SKILL.md` before touching `prisma/schema.prisma`. Schema changes deserve their own commit and their own migration.
