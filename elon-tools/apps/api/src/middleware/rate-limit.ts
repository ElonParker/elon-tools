import { createMiddleware } from 'hono/factory';
import type { Env } from '../bindings.js';
import { tooManyRequests } from '../lib/errors.js';
import { Limits } from '@elon-tools/shared';

/**
 * KV-based rate limiter.
 * key pattern: ratelimit:{identifier}:{bucket}
 * Window: 60 seconds.
 */
export function rateLimit(maxRequests: number, keyPrefix = 'general') {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
    const key = `ratelimit:${ip}:${keyPrefix}`;

    const current = await c.env.KV.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= maxRequests) {
      throw tooManyRequests('Muitas requisições, tente novamente', Limits.KV_TTL_RATE_LIMIT);
    }

    // Increment
    await c.env.KV.put(key, String(count + 1), { expirationTtl: Limits.KV_TTL_RATE_LIMIT });

    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(maxRequests - count - 1));

    await next();
  });
}
