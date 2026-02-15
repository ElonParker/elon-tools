import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import {
  ExecuteAgentSchema,
  PaginationQuerySchema,
  type ExecuteAgentInput,
  type PaginationQuery,
} from '@elon-tools/shared';
import { authMiddleware, rbac, validateBody, validateQuery } from '../middleware/index.js';
import { success } from '../lib/response.js';
import { AgentService } from '../services/agent.service.js';
import { ExecutionService } from '../services/execution.service.js';
import { Limits } from '@elon-tools/shared';
import { rateLimit } from '../middleware/rate-limit.js';

const agents = new Hono<{
  Bindings: Env;
  Variables: { auth: AuthContext; body: unknown; query: unknown };
}>();

agents.use('*', authMiddleware);

// GET /api/v1/agents — list agents (customer view: active only)
agents.get('/', validateQuery(PaginationQuerySchema), async (c) => {
  const { page, limit } = c.get('query') as PaginationQuery;
  const categoryId = new URL(c.req.url).searchParams.get('category_id') ?? undefined;
  const svc = new AgentService(c.env.DB);

  const { agents: items, total } = await svc.list({ categoryId, activeOnly: true, page, limit });
  return success({ agents: items }, { page, limit, total });
});

// GET /api/v1/agents/:id — agent detail + current config (input schema)
agents.get('/:id', async (c) => {
  const id = c.req.param('id');
  const svc = new AgentService(c.env.DB);
  const agent = await svc.getWithConfig(id);

  // Return agent with config but redact system_prompt for CUSTOMER
  const { auth } = { auth: c.get('auth') };
  const config = { ...agent.config };
  if (auth.role === 'CUSTOMER') {
    // Customers see input_schema, params (partial), but NOT system_prompt
    (config as any).system_prompt = '[redacted]';
  }

  return success({ agent: { ...agent, config } });
});

// POST /api/v1/agents/:id/execute — execute agent (non-streaming)
agents.post(
  '/:id/execute',
  rateLimit(Limits.RATE_LIMIT_EXECUTE, 'execute'),
  validateBody(ExecuteAgentSchema),
  async (c) => {
    const { customerId } = c.get('auth');
    const agentId = c.req.param('id');
    const { project_id, input } = c.get('body') as ExecuteAgentInput;

    const svc = new ExecutionService(c.env.DB, c.env.AI);
    const execution = await svc.execute(agentId, customerId, project_id, input);

    return success({ execution });
  },
);

// POST /api/v1/agents/:id/stream — execute agent (SSE streaming)
agents.post(
  '/:id/stream',
  rateLimit(Limits.RATE_LIMIT_EXECUTE, 'execute-stream'),
  validateBody(ExecuteAgentSchema),
  async (c) => {
    const { customerId } = c.get('auth');
    const agentId = c.req.param('id');
    const { project_id, input } = c.get('body') as ExecuteAgentInput;

    const svc = new ExecutionService(c.env.DB, c.env.AI);
    return svc.executeStream(agentId, customerId, project_id, input);
  },
);

// GET /api/v1/agents/:id/executions — execution history for this agent
agents.get('/:id/executions', validateQuery(PaginationQuerySchema), async (c) => {
  const { customerId } = c.get('auth');
  const agentId = c.req.param('id');
  const { page, limit } = c.get('query') as PaginationQuery;
  const projectId = new URL(c.req.url).searchParams.get('project_id') ?? undefined;

  const svc = new ExecutionService(c.env.DB, c.env.AI);
  const { executions, total } = await svc.listByAgent(customerId, agentId, projectId, page, limit);

  return success({ executions }, { page, limit, total });
});

// GET /api/v1/agents/:id/executions/:execId — execution detail
agents.get('/:id/executions/:execId', async (c) => {
  const { customerId } = c.get('auth');
  const execId = c.req.param('execId');

  const svc = new ExecutionService(c.env.DB, c.env.AI);
  const execution = await svc.getById(execId, customerId);

  return success({ execution });
});

export { agents as agentRoutes };
