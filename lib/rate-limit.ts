/**
 * In-memory rate limiter for development. Each limiter instance tracks
 * request timestamps per key in a sliding window.
 *
 * This does NOT provide real protection in production: Vercel's serverless
 * functions are stateless and run across multiple instances, so in-memory
 * counters don't share state. Swap this for a Redis-backed implementation
 * (e.g. Upstash) behind the same `check()` interface before public launch —
 * see .agents/rules/security.md "Rate Limiting" and the plan's Phase 14 risk
 * note. Call sites should not need to change when that swap happens.
 */

export type RateLimitResult = { success: boolean; remaining: number; resetMs: number };

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

class InMemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (timestamps.length >= this.limit) {
      this.hits.set(key, timestamps);
      return { success: false, remaining: 0, resetMs: timestamps[0] + this.windowMs - now };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    return { success: true, remaining: this.limit - timestamps.length, resetMs: this.windowMs };
  }
}

// 10 attempts/minute per key — login and reset-password.
export const loginRateLimiter: RateLimiter = new InMemoryRateLimiter(10, 60_000);

// 5 attempts/minute per key — signup and forgot-password.
export const signupRateLimiter: RateLimiter = new InMemoryRateLimiter(5, 60_000);
export const forgotPasswordRateLimiter: RateLimiter = new InMemoryRateLimiter(5, 60_000);
export const resetPasswordRateLimiter: RateLimiter = new InMemoryRateLimiter(10, 60_000);

// 5 guest sessions/minute per key — prevents the guest-first flow being used to spam sessions.
export const guestSessionRateLimiter: RateLimiter = new InMemoryRateLimiter(5, 60_000);

// 20 requests/minute per key — parse/ask run local logic (no external API),
// but still worth rate-limiting against spam/abuse.
export const aiRateLimiter: RateLimiter = new InMemoryRateLimiter(20, 60_000);

/** Best-effort client identifier for rate-limit keys. Not authoritative — a proxy can spoof it. */
export function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() ?? 'unknown';
}
