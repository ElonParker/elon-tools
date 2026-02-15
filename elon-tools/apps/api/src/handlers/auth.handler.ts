import { Hono } from 'hono';
import type { Env } from '../bindings.js';
import { MagicLinkRequestSchema, VerifyTokenQuerySchema } from '@elon-tools/shared';
import { validateBody, validateQuery, rateLimit, authMiddleware } from '../middleware/index.js';
import { success } from '../lib/response.js';
import { Limits } from '@elon-tools/shared';

const auth = new Hono<{ Bindings: Env }>();

// POST /api/v1/auth/magic-link
auth.post(
  '/magic-link',
  rateLimit(Limits.RATE_LIMIT_MAGIC_LINK, 'magic-link'),
  validateBody(MagicLinkRequestSchema),
  async (c) => {
    // STUB: Etapa 5 — validate Turnstile, create magic link, send email
    return success({ sent: true }, undefined, 200);
  },
);

// GET /api/v1/auth/verify
auth.get(
  '/verify',
  validateQuery(VerifyTokenQuerySchema),
  async (c) => {
    // STUB: Etapa 5 — validate token, create session, set cookie
    return success({ user: { id: 'stub', email: 'stub@example.com', role: 'CUSTOMER' } });
  },
);

// GET /api/v1/auth/me
auth.get('/me', authMiddleware, async (c) => {
  // STUB: Etapa 5 — return current user from session
  const auth = c.get('auth' as never);
  return success({ user: { id: 'stub', email: 'stub@example.com', role: 'CUSTOMER' } });
});

// POST /api/v1/auth/logout
auth.post('/logout', authMiddleware, async (c) => {
  // STUB: Etapa 5 — clear session from D1/KV, clear cookie
  return success({ loggedOut: true });
});

export { auth as authRoutes };
