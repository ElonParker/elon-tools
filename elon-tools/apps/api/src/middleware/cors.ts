import { cors as honoCors } from 'hono/cors';
import type { Env } from '../bindings.js';

/**
 * CORS middleware: allows only the frontend origin.
 */
export function corsMiddleware(frontendUrl: string) {
  return honoCors({
    origin: frontendUrl,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    credentials: true,
    maxAge: 86400,
  });
}
