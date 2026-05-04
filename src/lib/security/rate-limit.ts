/**
 * Rate limiter — wraps @upstash/ratelimit when Upstash env vars
 * are configured, otherwise falls back to an in-memory counter
 * (good enough for development; production should always have
 * Upstash configured).
 *
 * Usage:
 *   const { ok, retryAfter } = await rateLimit('booking:phone', phone, 3, '60s');
 *   if (!ok) return error;
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type Window = `${number}${'s' | 'm' | 'h'}`;

let upstashRedis: Redis | null = null;
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
if (upstashUrl && upstashToken) {
  upstashRedis = new Redis({ url: upstashUrl, token: upstashToken });
}

// Cache limiters per (namespace+config) so we don't reconstruct on every call
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(namespace: string, limit: number, window: Window): Ratelimit | null {
  if (!upstashRedis) return null;
  const key = `${namespace}|${limit}|${window}`;
  let l = limiterCache.get(key);
  if (!l) {
    l = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `kpsp:rl:${namespace}`,
      analytics: false,
    });
    limiterCache.set(key, l);
  }
  return l;
}

// In-memory fallback. Resets on server restart — fine for dev.
const memoryStore = new Map<string, { count: number; reset: number }>();

function fallbackLimit(
  namespace: string,
  identifier: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfter?: number } {
  const key = `${namespace}|${identifier}`;
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.reset < now) {
    memoryStore.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.reset - now) / 1000),
    };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

function windowToMs(w: Window): number {
  const n = parseInt(w);
  const unit = w.slice(String(n).length);
  if (unit === 's') return n * 1000;
  if (unit === 'm') return n * 60 * 1000;
  return n * 60 * 60 * 1000; // h
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter?: number;
}

export async function rateLimit(
  namespace: string,
  identifier: string,
  limit: number,
  window: Window,
): Promise<RateLimitResult> {
  const limiter = getLimiter(namespace, limit, window);
  if (limiter) {
    const r = await limiter.limit(identifier);
    return {
      ok: r.success,
      remaining: r.remaining,
      retryAfter: r.success ? undefined : Math.ceil((r.reset - Date.now()) / 1000),
    };
  }
  return fallbackLimit(namespace, identifier, limit, windowToMs(window));
}

/** Extract a stable identifier for the request — IP first, then header fallback. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  const real = headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
