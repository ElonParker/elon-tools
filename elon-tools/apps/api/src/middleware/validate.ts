import { createMiddleware } from 'hono/factory';
import type { ZodSchema } from 'zod';
import { badRequest } from '../lib/errors.js';

/**
 * Zod validation middleware for request body.
 * Parses JSON body against schema, throws 400 on failure.
 * Stores validated data in c.req.valid('json') pattern — we use c.set('body', parsed).
 */
export function validateBody(schema: ZodSchema) {
  return createMiddleware<{ Variables: { body: unknown } }>(async (c, next) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      throw badRequest('VALIDATION_FAILED', 'Body JSON inválido');
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
      throw badRequest('VALIDATION_FAILED', 'Dados inválidos', result.error.issues);
    }

    c.set('body', result.data);
    await next();
  });
}

/**
 * Zod validation for query params.
 */
export function validateQuery(schema: ZodSchema) {
  return createMiddleware<{ Variables: { query: unknown } }>(async (c, next) => {
    const raw = Object.fromEntries(new URL(c.req.url).searchParams);
    const result = schema.safeParse(raw);
    if (!result.success) {
      throw badRequest('VALIDATION_FAILED', 'Query params inválidos', result.error.issues);
    }
    c.set('query', result.data);
    await next();
  });
}
