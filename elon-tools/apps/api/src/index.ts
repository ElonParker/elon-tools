import { Hono } from 'hono';
import type { Env } from './bindings.js';
import { api } from './router.js';
import { requestId } from './middleware/request-id.js';
import { corsMiddleware } from './middleware/cors.js';
import { rateLimit } from './middleware/rate-limit.js';
import { AppError } from './lib/errors.js';
import { error as errorResponse } from './lib/response.js';
import { logger } from './lib/logger.js';
import { Limits } from '@elon-tools/shared';

const app = new Hono<{ Bindings: Env; Variables: { requestId: string } }>();

// ── Global Middlewares ──

// 1. Request ID
app.use('*', requestId);

// 2. CORS
app.use('*', async (c, next) => {
  const cors = corsMiddleware(c.env.FRONTEND_URL);
  return cors(c, next);
});

// 3. Security headers
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// 4. General rate limit
app.use('/api/*', rateLimit(Limits.RATE_LIMIT_GENERAL, 'general'));

// ── Health Check ──
app.get('/api/health', async (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT,
      version: '0.1.0',
    },
  });
});

// ── API Routes ──
app.route('/api/v1', api);

// ── 404 Catch-all ──
app.all('*', (c) => {
  return errorResponse('NOT_FOUND', 'Recurso não encontrado', 404);
});

// ── Global Error Handler ──
app.onError((err, c) => {
  const reqId = c.get('requestId');

  if (err instanceof AppError) {
    logger.warn(err.message, {
      request_id: reqId,
      code: err.code,
      status: err.statusCode,
    });

    const res = errorResponse(err.code, err.message, err.statusCode, err.details);

    // Rate limit: add Retry-After header
    if (err.statusCode === 429 && (err as any).retryAfter) {
      res.headers.set('Retry-After', String((err as any).retryAfter));
    }

    return res;
  }

  // Unhandled error
  logger.error('Unhandled error', {
    request_id: reqId,
    error: err.message,
    stack: c.env.ENVIRONMENT === 'dev' ? err.stack : undefined,
  });

  return errorResponse('INTERNAL_ERROR', 'Erro interno', 500);
});

export default app;
