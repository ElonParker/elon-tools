import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import { authMiddleware } from '../middleware/index.js';
import { success } from '../lib/response.js';
import { CATEGORIES } from '@elon-tools/shared';
import { notFound } from '../lib/errors.js';
import { AgentService } from '../services/agent.service.js';

const categories = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

categories.use('*', authMiddleware);

// GET /api/v1/categories
categories.get('/', async (c) => {
  // Count agents per category
  const counts = await c.env.DB
    .prepare(
      `SELECT category_id, COUNT(*) as count FROM agents WHERE is_active = 1 GROUP BY category_id`,
    )
    .all<{ category_id: string; count: number }>();

  const countMap = new Map((counts.results ?? []).map((r) => [r.category_id, r.count]));

  return success({
    categories: CATEGORIES.map((cat) => ({
      ...cat,
      agent_count: countMap.get(cat.id) ?? 0,
    })),
  });
});

// GET /api/v1/categories/:slug
categories.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const category = CATEGORIES.find((cat) => cat.slug === slug);
  if (!category) {
    throw notFound('NOT_FOUND', 'Categoria não encontrada');
  }

  const svc = new AgentService(c.env.DB);
  const { agents } = await svc.list({ categoryId: category.id, activeOnly: true, page: 1, limit: 50 });

  return success({ category, agents });
});

export { categories as categoryRoutes };
