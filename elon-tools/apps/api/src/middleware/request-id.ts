import { createMiddleware } from 'hono/factory';
import type { Env } from '../bindings.js';

/**
 * Injects a unique request ID into the context.
 */
export const requestId = createMiddleware<{ Bindings: Env; Variables: { requestId: string } }>(
  async (c, next) => {
    const id = crypto.randomUUID();
    c.set('requestId', id);
    c.header('X-Request-Id', id);
    await next();
  },
);
