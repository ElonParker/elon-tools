import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import { MagicLinkRequestSchema, VerifyTokenQuerySchema, Limits } from '@elon-tools/shared';
import { validateBody, validateQuery, rateLimit, authMiddleware } from '../middleware/index.js';
import { success, error as errorRes } from '../lib/response.js';
import { badRequest } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { AuthService } from '../services/auth.service.js';
import { verifyTurnstile } from '../services/turnstile.service.js';
import { ResendProvider, buildMagicLinkEmail } from '../services/email.service.js';

const auth = new Hono<{ Bindings: Env; Variables: { auth: AuthContext; body: unknown; query: unknown } }>();

// ── POST /api/v1/auth/magic-link ──
// Validates Turnstile, generates magic link, sends email.
auth.post(
  '/magic-link',
  rateLimit(Limits.RATE_LIMIT_MAGIC_LINK, 'magic-link'),
  validateBody(MagicLinkRequestSchema),
  async (c) => {
    const { email, turnstileToken } = c.get('body') as { email: string; turnstileToken: string };
    const ip = c.req.header('cf-connecting-ip') ?? undefined;

    // 1. Verify Turnstile
    const turnstileOk = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY, ip);
    if (!turnstileOk) {
      throw badRequest('AUTH_TURNSTILE_FAILED', 'Verificação Turnstile falhou');
    }

    // 2. Generate magic link token
    const authService = new AuthService(c.env.DB, c.env.KV);
    const token = await authService.createMagicLink(email);

    // 3. Build callback URL
    const callbackUrl = `${c.env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`;

    // 4. Send email
    const emailProvider = new ResendProvider(c.env.EMAIL_API_KEY);
    const html = buildMagicLinkEmail(callbackUrl);
    const sent = await emailProvider.send({
      to: email,
      subject: '⚡ Seu acesso ao ElonTools',
      html,
    });

    if (!sent) {
      logger.error('Failed to send magic link email', { email_hash: (await sha256Short(email)) });
    }

    // Always return success (don't leak whether email exists)
    return success({ sent: true });
  },
);

// ── GET /api/v1/auth/verify ──
// Called from magic link. Validates token, creates session, returns user + set-cookie.
auth.get(
  '/verify',
  rateLimit(Limits.RATE_LIMIT_MAGIC_LINK, 'verify'),
  validateQuery(VerifyTokenQuerySchema),
  async (c) => {
    const { token } = c.get('query') as { token: string };

    const authService = new AuthService(c.env.DB, c.env.KV);

    // 1. Validate magic link
    const email = await authService.validateMagicLink(token);
    if (!email) {
      throw badRequest('AUTH_INVALID_TOKEN', 'Token inválido ou expirado');
    }

    // 2. Get or create customer
    let customer: { id: string; role: string };
    try {
      customer = await authService.getOrCreateCustomer(email);
    } catch (err) {
      if ((err as Error).message === 'ACCOUNT_SUSPENDED') {
        return errorRes('RBAC_FORBIDDEN', 'Conta suspensa', 403);
      }
      throw err;
    }

    // 3. Create session
    const ip = c.req.header('cf-connecting-ip') ?? undefined;
    const ua = c.req.header('user-agent') ?? undefined;
    const sessionToken = await authService.createSession(customer.id, customer.role, ip, ua);

    // 4. Set cookie
    const isProduction = c.env.ENVIRONMENT === 'production';
    const cookieOpts = [
      `session=${sessionToken}`,
      'Path=/',
      'HttpOnly',
      `SameSite=${isProduction ? 'Strict' : 'Lax'}`,
      `Max-Age=${Limits.SESSION_TTL_SECONDS}`,
    ];
    if (isProduction) cookieOpts.push('Secure');

    const res = success({
      user: { id: customer.id, email, role: customer.role },
    });
    res.headers.set('Set-Cookie', cookieOpts.join('; '));

    logger.info('User logged in', { customer_id: customer.id, role: customer.role });

    return res;
  },
);

// ── GET /api/v1/auth/me ──
// Returns current authenticated user.
auth.get('/me', authMiddleware, async (c) => {
  const { customerId } = c.get('auth');
  const authService = new AuthService(c.env.DB, c.env.KV);
  const customer = await authService.getCustomerById(customerId);

  if (!customer) {
    return errorRes('CUSTOMER_NOT_FOUND', 'Conta não encontrada', 404);
  }

  return success({
    user: {
      id: customer.id,
      email: customer.email,
      role: customer.role,
      name: customer.name,
      created_at: customer.created_at,
    },
  });
});

// ── POST /api/v1/auth/logout ──
// Destroys session, clears cookie.
auth.post('/logout', authMiddleware, async (c) => {
  const sessionToken = extractCookie(c.req.header('Cookie'), 'session');

  if (sessionToken) {
    const authService = new AuthService(c.env.DB, c.env.KV);
    await authService.destroySession(sessionToken);
  }

  const res = success({ loggedOut: true });
  res.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');

  logger.info('User logged out', { customer_id: c.get('auth').customerId });

  return res;
});

// ── Helpers ──

function extractCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1];
}

async function sha256Short(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
}

export { auth as authRoutes };
