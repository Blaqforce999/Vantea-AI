# Security Rules

Vantea AI handles something intimate: a private record of everything a person has built, and their own estimate of what it is worth. Privacy is not a settings page here — it is the headline promise. The core principle is simple: **your things, your number, your data.** A security or privacy mistake is not just a bug; it is a broken promise. Every agent working on this codebase must follow these rules without exception.

Vantea collects **no payment information of any kind, and connects to no bank.** There is no card data, no bank data, no account aggregation, and no payment processing anywhere in this product. If a requirement or a copied reference implies collecting payment data or connecting to a financial institution, it is out of scope — leave it out and flag it.

## Secrets and Configuration

Never commit secrets to the repository. Database URLs, session secrets, the Anthropic API key, and storage keys live in environment variables, loaded through a validated config module.

The required environment variables are:

```
DATABASE_URL                (Neon PostgreSQL)
SESSION_SECRET
NEXT_PUBLIC_APP_URL
ANTHROPIC_API_KEY           (the AI layer — server-side only, never NEXT_PUBLIC_)
STORAGE_ACCESS_KEY          (optional item images, deferred to a later version)
STORAGE_SECRET_KEY
STORAGE_BUCKET
```

Environment variables are validated at boot with zod in `lib/env.ts`. If a required variable is missing, the app refuses to start rather than running in a half-configured state.

Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. **The Anthropic API key must never be exposed to the browser** — all AI calls go through server code in `lib/ai.ts`. Never put a secret behind the `NEXT_PUBLIC_` prefix, even if you think it looks harmless.

## Authentication

Vantea is guest-first: a visitor can add items and reach the reveal before creating an account. Guest sessions and real accounts both need to be handled properly.

Passwords (for real accounts) are hashed with argon2id or bcrypt before they hit the database. Never store plaintext passwords. Never log passwords, even during debugging.

Sessions are cookie-based. Cookies must have:
- `httpOnly: true`
- `secure: true` in production
- `sameSite: 'lax'`
- A reasonable expiration (30 days is the default)

Session tokens are random, unguessable, and at least 32 bytes of entropy. Use the Node `crypto` module's `randomBytes`, not `Math.random`.

Logout invalidates the session on the server side by deleting the session record, not just the cookie. A stolen cookie is useless if the server no longer recognizes its token.

When a guest upgrades to a real account, migrate their data to the new account atomically and invalidate the guest session. A guest's data must never be readable by anyone else.

## Authorization

There is effectively one kind of actor: **a user, who can only ever touch their own data.**

- A user can only read and mutate their own items, snapshots, wishlist, goals, and milestones. Check ownership explicitly on every read and every write (`item.userId === session.userId`); never rely on the URL shape to enforce it.
- There is no admin surface over user content, no support role that reads a user's collection, and no cross-user access of any kind. The entire product is single-tenant per user by design — that is what "we cannot see your data" means in practice.
- Shared cards are the only public surface, and they expose **only** the specific fields the user chose to bake into that card, via an unguessable share token. Sharing is always the user's explicit action.

## Input Validation

Every piece of data that enters the application from outside must be validated with zod before it touches the database or any business logic. This applies to:
- Form submissions (add/edit item, wishlist, goals, profile)
- Route handler request bodies
- URL parameters and query strings (share tokens, filters)
- **AI model output** — what the model returns is untrusted until validated; parse it with zod before writing anything

Validation is not optional and is not the frontend's job. The frontend can validate for user experience, but the server validates for safety.

## SQL Injection

All database access goes through Prisma. Prisma uses parameterized queries by default, which prevents SQL injection as long as you do not bypass it. Never use `prisma.$queryRawUnsafe` or string-concatenate SQL. If you need raw SQL, use `prisma.$queryRaw` with a tagged template, which parameterizes correctly.

## Cross-Site Scripting (XSS)

React escapes strings by default when rendering, which handles most cases. The main risks in Vantea:

- `dangerouslySetInnerHTML`: do not use it unless content has been sanitized server-side with a library like DOMPurify, and even then, only for content you control.
- **User-entered content** — item names, "why it mattered" notes, goal titles — is rendered as plain text. If any of it is ever rendered as HTML/Markdown (for example in a recap), use a sanitizing renderer. Treat the user's own notes as untrusted at render time.

## Cross-Site Request Forgery (CSRF)

Server actions in Next.js include built-in CSRF protection. Route handlers that perform state-changing operations must verify the origin of the request:
- Check the `Origin` or `Referer` header matches the app's domain.
- For authenticated endpoints, rely on the `sameSite: 'lax'` cookie attribute plus origin checking.

## The AI Layer — Safety

This is Vantea's most important security section alongside privacy, because the AI is the one place untrusted text meets automated action. **Read it twice.**

- **Own data only.** The only context the AI ever receives is the requesting user's own records. Never assemble a prompt from another user's data, aggregate data, or external data. The AI cannot answer a question it would need someone else's data to answer.
- **The API key is server-side only.** All Anthropic calls go through `lib/ai.ts` on the server. The key is never shipped to the browser and never placed behind `NEXT_PUBLIC_`.
- **Confirm before every write.** Conversational add, edit, and delete all resolve to a preview the user explicitly confirms (`ConfirmDialog`). The AI never silently creates, edits, or deletes a record. Parse → show → confirm → write.
- **Validate the model's output.** Treat what the model returns as untrusted input. Parse it with zod into the exact shape a write expects; reject or re-prompt on anything malformed. Never cast an AI response straight into a database write.
- **Prompt-injection resistance.** A user's own notes and item names are passed to the model as data, not instructions. Do not let text inside a user's record change what the AI is allowed to do (it can still only read that user's data and still must confirm before writing). The AI has no tools that reach outside the user's own data, so the blast radius of an injection is bounded by design — keep it that way.
- **No advice, no valuation.** The AI gives no financial, investment, or tax advice, and generates no valuations the user did not enter. Enforce this in the system prompt and in review.
- **Do not log prompts or completions containing user data.** See Logging below.

## Privacy

Privacy is the product's headline. Treat every user record as sensitive personal data.

- **Collect the minimum** necessary for the product to work. Do not collect fields "just in case."
- **Never use user data to sell them anything**, and state this plainly in the product. There is no advertising, no data brokering, no cross-user profiling.
- **The privacy center is a real feature**, not a policy link. It must cover: what Vantea stores and why, **export my data**, **delete my data**, and **delete my account**. Delete must actually delete — remove the user's rows, not just flag them — and cascade to items, snapshots, wishlist, goals, and milestones.
- Do not expose user data in URLs, query strings, logs, or to other users.
- Do not compile or cross-reference user data beyond what a single feature requires.
- Because personal data is processed, review data-protection obligations — including for Nigerian users under the **NDPR** — against the final architecture before public launch.

## File Uploads (Optional Item Images — Deferred)

Item images are deferred to a later version, but if/when they ship, treat them as untrusted input:

- Accept only `image/jpeg`, `image/png`, and `image/webp` based on the actual file bytes, not the client-provided MIME type. Avoid SVG uploads (they can carry script).
- Enforce a maximum file size.
- Strip metadata before storing (item photos can carry location EXIF — a privacy risk).
- Store files in the configured object storage with a random filename. Never use the client's filename directly.
- Serve images from the storage provider's domain or a CDN, never from the same origin as the app.

## Rate Limiting

Apply rate limits to:
- Login and signup (to slow down credential stuffing)
- Password reset requests
- **The AI endpoints** (parse, ask) — these call a paid third-party API and must be protected from abuse and runaway cost
- Guest-session creation, so the guest-first flow can't be used to spam sessions

Use an in-memory limiter for development and a Redis-backed one for production. The limiter lives in `lib/rate-limit.ts`.

## Logging

Log enough context to debug an incident, never enough to leak user data. The bar is high here because the data is intimate.

- Log request method, path, status, duration, and a request ID.
- Log user ID (not email, not name) when relevant.
- Log error stacks on the server.
- **Never log:** passwords, session tokens, the Anthropic API key, item names or values, "why" notes, wishlist or goal contents, or **any AI prompt or completion that contains user data.** If you must log an AI failure, log the error and a request ID, not the content.

## Dependencies

Every dependency is a potential vulnerability. Keep the list small. Run `npm audit` regularly. When a vulnerability is reported, update the package within a week unless it does not affect our use case. Do not install packages with fewer than a few thousand weekly downloads or no recent commits unless the developer approves.

## Incident Response

If a secret is exposed (committed by accident, leaked in a log, shared in a screenshot), rotate it immediately. The order is:
1. Rotate the secret at the provider (database, storage, session secret, **Anthropic API key**).
2. Update the environment variable in production.
3. Deploy.
4. Revoke the old secret.
5. Tell the developer what happened and when, in writing.

If user data is ever exposed to the wrong user or leaked, treat it as a trust incident of the highest severity: contain it, assess scope, and be honest with the developer and — where obligations require — with affected users. Given the privacy promise, a data leak is the worst thing that can happen to this product. Do not try to hide it. Fast, honest response limits damage.
