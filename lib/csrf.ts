/**
 * Verifies the request's Origin matches the request's own Host (or
 * x-forwarded-host behind a proxy) — not a static NEXT_PUBLIC_APP_URL.
 * A static comparison silently breaks the moment the serving domain
 * differs from whatever URL happened to be configured at build time
 * (custom domains, preview deployments, a staging environment) — the
 * check would then reject every legitimate same-site request. Comparing
 * against the request's own Host has no such failure mode.
 *
 * Cookie-based sessions already get primary CSRF protection from
 * `sameSite: 'lax'` (browsers won't attach the session cookie to a
 * cross-site POST); this is defense-in-depth on top of that.
 */
export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
