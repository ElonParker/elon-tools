import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import { ExecuteAgentSchema, SearchAgentSchema, PaginationQuerySchema } from '@elon-tools/shared';
import { authMiddleware, rbac, validateBody, validateQuery } from '../middleware/index.js';
import { success } from '../lib/response.js';

const agents = new Hono<{ Bindings: Env; Variables: { auth: AuthContext; body: unknown; query: unknown } }>();

agents.use('*', authMiddleware);

// GET /api/v1/agents
agents.get('/', validateQuery(PaginationQuerySchema), async (c) => {
  // STUB: list agents (optionally filtered by category_id, project_id)
  return success({ agents: [], pagination: { page: 1, limit: 20, total: 0 } });
});

// GET /api/v1/agents/:id
agents.get('/:id', async (c) => {
  // STUB: get agent with current config
  return success({ agent: null });
});

// POST /api/v1/agents/:id/execute
agents.post('/:id/execute', rbac('CUSTOMER'), validateBody(ExecuteAgentSchema), async (c) => {
  // STUB: Etapa 7 — execute agent via Workers AI
  return success({
    execution: {
      id: 'stub-exec-id',
      agent_id: c.req.param('id'),
      project_id: 'stub',
      output: 'Stub response — IA não implementada ainda',
      status: 'done',
      tokens_used: 0,
      created_at: new Date().toISOString(),
    },
  });
});

// GET /api/v1/agents/:id/executions
agents.get('/:id/executions', validateQuery(PaginationQuerySchema), async (c) => {
  // STUB: list execution history
  return success({ executions: [], pagination: { page: 1, limit: 20, total: 0 } });
});

// GET /api/v1/agents/:id/executions/:execId
agents.get('/:id/executions/:execId', async (c) => {
  // STUB: get single execution
  return success({ execution: null });
});

// POST /api/v1/agents/:id/search
agents.post('/:id/search', rbac('CUSTOMER'), validateBody(SearchAgentSchema), async (c) => {
  // STUB: Etapa 8 — Vectorize RAG search
  return success({ results: [] });
});

export { agents as agentRoutes };
