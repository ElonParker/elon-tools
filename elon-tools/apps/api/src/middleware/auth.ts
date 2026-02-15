import { createMiddleware } from 'hono/factory';
import type { Env, AuthContext } from '../bindings.js';
import { unauthorized } from '../lib/errors.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Auth middleware: validates session cookie, injects AuthContext.
 * 
 * Flow:
 * 1. Extract session token from cookie
 * 2. Hash token → KV lookup (fast) → D1 fallback
 * 3. Validate expiry + customer status
 * 4. Inject { customerId, role } into context
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { auth: AuthContext; requestId: string };
}>(async (c, next) => {
  // Dev mode: accept X-Debug-Auth header "customer_id:role"
  const debugAuth = c.req.header('X-Debug-Auth');
  if (debugAuth && c.env.ENVIRONMENT === 'dev') {
    const [customerId, role] = debugAuth.split(':');
    if (customerId && (role === 'CUSTOMER' || role === 'ADMIN')) {
      c.set('auth', { customerId, role });
      await next();
      return;
    }
  }

  // Extract session token from cookie
  const sessionToken = extractCookie(c.req.header('Cookie'), 'session');
  if (!sessionToken) {
    throw unauthorized('AUTH_MISSING_SESSION', 'Sessão não encontrada');
  }

  // Validate via AuthService (KV → D1 fallback)
  const authService = new AuthService(c.env.DB, c.env.KV);
  const session = await authService.validateSession(sessionToken);

  if (!session) {
    throw unauthorized('AUTH_EXPIRED_SESSION', 'Sessão expirada ou inválida');
  }

  c.set('auth', {
    customerId: session.customer_id,
    role: session.role,
  });

  await next();
});

function extractCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1];
}
