import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import { CreateAgentSchema, UpdateAgentSchema, PaginationQuerySchema } from '@elon-tools/shared';
import { authMiddleware, rbac, validateBody, validateQuery } from '../middleware/index.js';
import { success } from '../lib/response.js';

const admin = new Hono<{ Bindings: Env; Variables: { auth: AuthContext; body: unknown; query: unknown } }>();

// All admin routes: auth + ADMIN only
admin.use('*', authMiddleware, rbac('ADMIN'));

// ── Agents CRUD ──

// GET /api/v1/admin/agents
admin.get('/agents', validateQuery(PaginationQuerySchema), async (c) => {
  // STUB: list all agents (admin view)
  return success({ agents: [], pagination: { page: 1, limit: 20, total: 0 } });
});

// POST /api/v1/admin/agents
admin.post('/agents', validateBody(CreateAgentSchema), async (c) => {
  // STUB: create agent + initial config version
  return success(
    {
      agent: {
        id: 'stub-agent-id',
        name: 'Stub Agent',
        config_version: 1,
        created_at: new Date().toISOString(),
      },
    },
    undefined,
    201,
  );
});

// PATCH /api/v1/admin/agents/:id
admin.patch('/agents/:id', validateBody(UpdateAgentSchema), async (c) => {
  // STUB: update agent → creates new config version
  return success({ agent: null });
});

// DELETE /api/v1/admin/agents/:id
admin.delete('/agents/:id', async (c) => {
  // STUB: soft delete agent
  return success({ deleted: true });
});

// GET /api/v1/admin/agents/:id/versions
admin.get('/agents/:id/versions', validateQuery(PaginationQuerySchema), async (c) => {
  // STUB: list config versions
  return success({ versions: [], pagination: { page: 1, limit: 20, total: 0 } });
});

// GET /api/v1/admin/agents/:id/versions/:ver
admin.get('/agents/:id/versions/:ver', async (c) => {
  // STUB: get specific config version
  return success({ version: null });
});

// ── Customers ──

// GET /api/v1/admin/customers
admin.get('/customers', validateQuery(PaginationQuerySchema), async (c) => {
  // STUB: list customers
  return success({ customers: [], pagination: { page: 1, limit: 20, total: 0 } });
});

// GET /api/v1/admin/customers/:id
admin.get('/customers/:id', async (c) => {
  // STUB: get customer detail with projects
  return success({ customer: null });
});

// PATCH /api/v1/admin/customers/:id
admin.patch('/customers/:id', async (c) => {
  // STUB: update customer (role, status)
  return success({ customer: null });
});

// ── Stats ──

// GET /api/v1/admin/stats
admin.get('/stats', async (c) => {
  // STUB: aggregated stats
  return success({
    total_customers: 0,
    total_projects: 0,
    total_executions: 0,
    executions_today: 0,
  });
});

export { admin as adminRoutes };
