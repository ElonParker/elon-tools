import { createMiddleware } from 'hono/factory';
import type { Env, AuthContext } from '../bindings.js';
import { unauthorized } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/**
 * Auth middleware: validates session cookie, injects AuthContext.
 * 
 * STUB: In etapa 5, this will read the cookie, hash the token,
 * look up in KV (then D1 fallback), and validate expiry.
 * For now, it checks for a header and returns 401 if missing.
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { auth: AuthContext; requestId: string };
}>(async (c, next) => {
  // ── STUB: will be replaced in Etapa 5 ──
  // For local dev/testing, accept X-Debug-Auth header: "customer_id:role"
  const debugAuth = c.req.header('X-Debug-Auth');
  if (debugAuth && c.env.ENVIRONMENT === 'dev') {
    const [customerId, role] = debugAuth.split(':');
    if (customerId && (role === 'CUSTOMER' || role === 'ADMIN')) {
      c.set('auth', { customerId, role });
      await next();
      return;
    }
  }

  // Real auth: read session cookie
  const cookie = c.req.header('Cookie');
  const sessionToken = extractCookie(cookie, 'session');

  if (!sessionToken) {
    throw unauthorized('AUTH_MISSING_SESSION', 'Sessão não encontrada');
  }

  // TODO (Etapa 5): hash token → KV lookup → D1 fallback → validate
  // For now: reject everything (no sessions exist yet)
  throw unauthorized('AUTH_MISSING_SESSION', 'Sessão não encontrada');
});

function extractCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1];
}
