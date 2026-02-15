import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import { authMiddleware } from '../middleware/index.js';
import { success } from '../lib/response.js';
import { CATEGORIES } from '@elon-tools/shared';

const categories = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

categories.use('*', authMiddleware);

// GET /api/v1/categories
categories.get('/', async (c) => {
  // Returns the 10 fixed categories (can be cached in KV)
  return success({
    categories: CATEGORIES.map((cat) => ({
      ...cat,
      agent_count: 0, // STUB: will count from DB
    })),
  });
});

// GET /api/v1/categories/:slug
categories.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const category = CATEGORIES.find((cat) => cat.slug === slug);
  if (!category) {
    return Response.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Categoria não encontrada' } },
      { status: 404 },
    );
  }
  // STUB: will also return agents in this category
  return success({ category, agents: [] });
});

export { categories as categoryRoutes };
