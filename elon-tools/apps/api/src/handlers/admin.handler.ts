import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import {
  CreateAgentSchema,
  UpdateSettingsSchema,
  SaveIntegrationSchema,
  ValidateIntegrationSchema,
  CreateAgentConfigSchema,
  UpdateAgentMetaSchema,
  PaginationQuerySchema,
  type CreateAgentInput,
  type SaveIntegrationInput,
  type ValidateIntegrationInput,
  type CreateAgentConfigInput,
  type UpdateAgentMetaInput,
  type PaginationQuery,
} from '@elon-tools/shared';
import { authMiddleware, rbac, validateBody, validateQuery } from '../middleware/index.js';
import { success } from '../lib/response.js';
import { AgentService } from '../services/agent.service.js';
import { IntegrationService, SUPPORTED_PROVIDERS } from '../services/integration.service.js';
import { SettingsService } from '../services/settings.service.js';

const admin = new Hono<{
  Bindings: Env;
  Variables: { auth: AuthContext; body: unknown; query: unknown };
}>();

// All admin routes: auth + ADMIN only
admin.use('*', authMiddleware, rbac('ADMIN'));

// ══════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════

// GET /api/v1/admin/settings
admin.get('/settings', async (c) => {
  const svc = new SettingsService(c.env.DB);
  const settings = await svc.getAll();
  return success({ settings });
});

// PATCH /api/v1/admin/settings
admin.patch('/settings', validateBody(UpdateSettingsSchema), async (c) => {
  const data = c.get('body') as Record<string, unknown>;
  const svc = new SettingsService(c.env.DB);
  const settings = await svc.update(data);
  return success({ settings });
});

// ══════════════════════════════════════════
// INTEGRATIONS
// ══════════════════════════════════════════

// GET /api/v1/admin/integrations/providers
admin.get('/integrations/providers', async (c) => {
  return success({ providers: SUPPORTED_PROVIDERS });
});

// POST /api/v1/admin/integrations/validate
admin.post('/integrations/validate', validateBody(ValidateIntegrationSchema), async (c) => {
  const { provider, credentials } = c.get('body') as ValidateIntegrationInput;
  const svc = new IntegrationService(c.env.DB, c.env.MASTER_ENCRYPTION_KEY);
  const result = await svc.validate(provider, credentials);
  return success(result);
});

// POST /api/v1/admin/integrations/save
admin.post('/integrations/save', validateBody(SaveIntegrationSchema), async (c) => {
  const { customerId } = c.get('auth');
  const { provider, credentials } = c.get('body') as SaveIntegrationInput;
  const svc = new IntegrationService(c.env.DB, c.env.MASTER_ENCRYPTION_KEY);

  const records = [];
  for (const [keyName, value] of Object.entries(credentials)) {
    const record = await svc.save(customerId, provider, keyName, value);
    records.push(record);
  }

  return success({ integrations: records }, undefined, 201);
});

// GET /api/v1/admin/integrations
admin.get('/integrations', async (c) => {
  const { customerId } = c.get('auth');
  const svc = new IntegrationService(c.env.DB, c.env.MASTER_ENCRYPTION_KEY);
  const integrations = await svc.listForCustomer(customerId);
  return success({ integrations });
});

// DELETE /api/v1/admin/integrations/:provider/:keyName
admin.delete('/integrations/:provider/:keyName', async (c) => {
  const { customerId } = c.get('auth');
  const provider = c.req.param('provider');
  const keyName = c.req.param('keyName');
  const svc = new IntegrationService(c.env.DB, c.env.MASTER_ENCRYPTION_KEY);
  await svc.delete(customerId, provider, keyName);
  return success({ deleted: true });
});

// ══════════════════════════════════════════
// AGENTS CRUD
// ══════════════════════════════════════════

// GET /api/v1/admin/agents
admin.get('/agents', validateQuery(PaginationQuerySchema), async (c) => {
  const { page, limit } = c.get('query') as PaginationQuery;
  const categoryId = new URL(c.req.url).searchParams.get('category_id') ?? undefined;
  const svc = new AgentService(c.env.DB);

  const { agents, total } = await svc.list({ categoryId, activeOnly: false, page, limit });
  return success({ agents }, { page, limit, total });
});

// POST /api/v1/admin/agents
admin.post('/agents', validateBody(CreateAgentSchema), async (c) => {
  const { customerId } = c.get('auth');
  const data = c.get('body') as CreateAgentInput;
  const svc = new AgentService(c.env.DB);

  const agent = await svc.create(data, customerId);
  return success({ agent }, undefined, 201);
});

// GET /api/v1/admin/agents/:id
admin.get('/agents/:id', async (c) => {
  const id = c.req.param('id');
  const svc = new AgentService(c.env.DB);
  const agent = await svc.getWithConfig(id);
  return success({ agent });
});

// PATCH /api/v1/admin/agents/:id
admin.patch('/agents/:id', validateBody(UpdateAgentMetaSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.get('body') as UpdateAgentMetaInput;
  const svc = new AgentService(c.env.DB);
  const agent = await svc.update(id, data);
  return success({ agent });
});

// DELETE /api/v1/admin/agents/:id (soft delete = deactivate)
admin.delete('/agents/:id', async (c) => {
  const id = c.req.param('id');
  const svc = new AgentService(c.env.DB);
  await svc.deactivate(id);
  return success({ deleted: true });
});

// ══════════════════════════════════════════
// AGENT CONFIG VERSIONS
// ══════════════════════════════════════════

// GET /api/v1/admin/agents/:id/configs
admin.get('/agents/:id/configs', validateQuery(PaginationQuerySchema), async (c) => {
  const agentId = c.req.param('id');
  const { page, limit } = c.get('query') as PaginationQuery;
  const svc = new AgentService(c.env.DB);

  const { versions, total } = await svc.listConfigVersions(agentId, page, limit);
  return success({ versions }, { page, limit, total });
});

// POST /api/v1/admin/agents/:id/configs
admin.post('/agents/:id/configs', validateBody(CreateAgentConfigSchema), async (c) => {
  const { customerId } = c.get('auth');
  const agentId = c.req.param('id');
  const data = c.get('body') as CreateAgentConfigInput;
  const svc = new AgentService(c.env.DB);

  const config = await svc.createConfigVersion(agentId, data, customerId);
  return success({ config }, undefined, 201);
});

// GET /api/v1/admin/agents/:id/configs/:version
admin.get('/agents/:id/configs/:version', async (c) => {
  const agentId = c.req.param('id');
  const version = parseInt(c.req.param('version'), 10);
  if (isNaN(version)) {
    return Response.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: 'Versão inválida' } },
      { status: 400 },
    );
  }
  const svc = new AgentService(c.env.DB);
  const config = await svc.getConfigVersion(agentId, version);
  return success({ config });
});

// ══════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════

// GET /api/v1/admin/customers
admin.get('/customers', validateQuery(PaginationQuerySchema), async (c) => {
  const { page, limit } = c.get('query') as PaginationQuery;
  const offset = (page - 1) * limit;

  const [rows, countRow] = await Promise.all([
    c.env.DB
      .prepare(
        `SELECT id, email, role, status, name, created_at, updated_at
         FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(limit, offset)
      .all(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM customers`).first<{ total: number }>(),
  ]);

  return success({ customers: rows.results ?? [] }, { page, limit, total: countRow?.total ?? 0 });
});

// GET /api/v1/admin/customers/:id
admin.get('/customers/:id', async (c) => {
  const id = c.req.param('id');

  const customer = await c.env.DB
    .prepare(`SELECT id, email, role, status, name, created_at, updated_at FROM customers WHERE id = ?`)
    .bind(id)
    .first();

  if (!customer) {
    return Response.json(
      { success: false, error: { code: 'CUSTOMER_NOT_FOUND', message: 'Conta não encontrada' } },
      { status: 404 },
    );
  }

  const projects = await c.env.DB
    .prepare(`SELECT id, domain, name, niche, created_at FROM projects WHERE customer_id = ? ORDER BY created_at DESC`)
    .bind(id)
    .all();

  return success({ customer, projects: projects.results ?? [] });
});

// PATCH /api/v1/admin/customers/:id
admin.patch('/customers/:id', async (c) => {
  const id = c.req.param('id');
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return Response.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: 'Body JSON inválido' } },
      { status: 400 },
    );
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.role !== undefined) { updates.push('role = ?'); values.push(body.role); }
  if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
  if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }

  if (updates.length === 0) {
    return Response.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: 'Nada para atualizar' } },
      { status: 400 },
    );
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await c.env.DB.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  const updated = await c.env.DB
    .prepare(`SELECT id, email, role, status, name, created_at, updated_at FROM customers WHERE id = ?`)
    .bind(id)
    .first();

  return success({ customer: updated });
});

// ══════════════════════════════════════════
// STATS
// ══════════════════════════════════════════

admin.get('/stats', async (c) => {
  const stats = await c.env.DB
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM customers WHERE status = 'active') as total_customers,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM agent_executions) as total_executions,
        (SELECT COUNT(*) FROM agent_executions WHERE created_at >= date('now')) as executions_today,
        (SELECT COUNT(*) FROM agents WHERE is_active = 1) as total_agents`,
    )
    .first();

  return success(stats ?? {});
});

export { admin as adminRoutes };
