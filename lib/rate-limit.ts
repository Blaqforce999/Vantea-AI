import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { logger } from '@/lib/logger';

/**
 * Rate limiting with two backends behind one interface:
 *
 * - **Upstash Redis** when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 *   are set. This is the real thing — a sliding window shared across every
 *   serverless instance. Set these in the deployment env to turn it on.
 * - **In-memory** otherwise. Fine for local dev, but on Vercel each instance
 *   has its own counter and cold starts reset them, so it is best-effort
 *   only. A one-time warning is logged in production so a missing Upstash
 *   config is visible rather than silent.
 *
 * `check()` is async either way; call sites `await` it. Same `{ success,
 * remaining, resetMs }` result and the same per-limiter limits regardless of
 * backend, so switching backends changes nothing an API response can observe.
 */

export type RateLimitResult = { success: boolean; remaining: number; resetMs: number };

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

// Once per process, and only when a limiter is actually exercised (never at
// module load / build time) — keeps it to a single line per serverless cold
// start instead of one per imported route bundle.
function warnInMemoryOnce() {
  const s = globalThis as unknown as { __vanteaRatelimitWarned?: boolean };
  if (s.__vanteaRatelimitWarned || process.env.NODE_ENV !== 'production') return;
  s.__vanteaRatelimitWarned = true;
  logger.warn('ratelimit.backend.in_memory', {
    note: 'UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is per-instance and best-effort only.',
  });
}

class InMemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    warnInMemoryOnce();
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

class UpstashRateLimiter implements RateLimiter {
  private readonly rl: Ratelimit;

  constructor(redis: Redis, limit: number, windowSeconds: number, prefix: string) {
    this.rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `vantea:rl:${prefix}`,
      analytics: false,
    });
  }

  async check(key: string): Promise<RateLimitResult> {
    try {
      const r = await this.rl.limit(key);
      return { success: r.success, remaining: r.remaining, resetMs: Math.max(0, r.reset - Date.now()) };
    } catch (err) {
      // Fail OPEN: a rate-limiter outage must never take down login/signup.
      // Logged loudly so a persistent failure is caught.
      logger.error('ratelimit.upstash.unavailable', { error: err instanceof Error ? err.message : 'unknown' });
      return { success: true, remaining: 0, resetMs: 0 };
    }
  }
}

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = upstashUrl && upstashToken ? new Redis({ url: upstashUrl, token: upstashToken }) : null;

function createLimiter(limit: number, windowSeconds: number, prefix: string): RateLimiter {
  return redis
    ? new UpstashRateLimiter(redis, limit, windowSeconds, prefix)
    : new InMemoryRateLimiter(limit, windowSeconds * 1000);
}

// 10 attempts/minute per key — login and reset-password.
export const loginRateLimiter = createLimiter(10, 60, 'login');
export const resetPasswordRateLimiter = createLimiter(10, 60, 'reset-password');

// 5 attempts/minute per key — signup and forgot-password.
export const signupRateLimiter = createLimiter(5, 60, 'signup');
export const forgotPasswordRateLimiter = createLimiter(5, 60, 'forgot-password');

// 5 guest sessions/minute per key — prevents the guest-first flow being used to spam sessions.
export const guestSessionRateLimiter = createLimiter(5, 60, 'guest-session');

// 20 requests/minute per key — parse/ask run local logic (no external API),
// but still worth rate-limiting against spam/abuse.
export const aiRateLimiter = createLimiter(20, 60, 'ai');

/** Best-effort client identifier for rate-limit keys. Not authoritative — a proxy can spoof it. */
export function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() ?? 'unknown';
}
