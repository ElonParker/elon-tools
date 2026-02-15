import { Hono } from 'hono';
import type { Env } from './bindings.js';
import { authRoutes, projectRoutes, categoryRoutes, agentRoutes, adminRoutes } from './handlers/index.js';

const api = new Hono<{ Bindings: Env }>();

// Mount all route groups under /api/v1
api.route('/auth', authRoutes);
api.route('/projects', projectRoutes);
api.route('/categories', categoryRoutes);
api.route('/agents', agentRoutes);
api.route('/admin', adminRoutes);

export { api };
