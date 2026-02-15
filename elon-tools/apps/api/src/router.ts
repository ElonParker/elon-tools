import { Hono } from 'hono';
import type { Env, AuthContext } from './bindings.js';
import { authRoutes, projectRoutes, categoryRoutes, agentRoutes, adminRoutes } from './handlers/index.js';
import { authMiddleware } from './middleware/index.js';
import { success } from './lib/response.js';
import { ExecutionService } from './services/execution.service.js';

const api = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

// Mount all route groups under /api/v1
api.route('/auth', authRoutes);
api.route('/projects', projectRoutes);
api.route('/categories', categoryRoutes);
api.route('/agents', agentRoutes);
api.route('/admin', adminRoutes);

// GET /api/v1/executions/:id — standalone execution detail
api.get('/executions/:id', authMiddleware, async (c) => {
  const { customerId } = c.get('auth');
  const id = c.req.param('id');
  const svc = new ExecutionService(c.env.DB, c.env.AI);
  const execution = await svc.getById(id, customerId);
  return success({ execution });
});

export { api };
