import { createMiddleware } from 'hono/factory';
import type { Env, AuthContext } from '../bindings.js';
import { forbidden } from '../lib/errors.js';
import type { CustomerRole } from '@elon-tools/shared';

/**
 * RBAC gate: ensures the authenticated user has one of the allowed roles.
 */
export function rbac(...allowedRoles: CustomerRole[]) {
  return createMiddleware<{
    Bindings: Env;
    Variables: { auth: AuthContext };
  }>(async (c, next) => {
    const auth = c.get('auth');
    if (!auth || !allowedRoles.includes(auth.role)) {
      const code = allowedRoles.includes('ADMIN') ? 'RBAC_ADMIN_ONLY' : 'RBAC_FORBIDDEN';
      const msg = allowedRoles.includes('ADMIN')
        ? 'Acesso restrito a administradores'
        : 'Sem permissão para esta ação';
      throw forbidden(code, msg);
    }
    await next();
  });
}
