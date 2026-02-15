import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  PaginationQuerySchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type PaginationQuery,
} from '@elon-tools/shared';
import { authMiddleware, validateBody, validateQuery } from '../middleware/index.js';
import { success } from '../lib/response.js';
import { ProjectService } from '../services/project.service.js';
import { ExecutionService } from '../services/execution.service.js';

const projects = new Hono<{
  Bindings: Env;
  Variables: { auth: AuthContext; body: unknown; query: unknown };
}>();

// All project routes require auth
projects.use('*', authMiddleware);

// GET /api/v1/projects
projects.get('/', validateQuery(PaginationQuerySchema), async (c) => {
  const { customerId } = c.get('auth');
  const { page, limit } = c.get('query') as PaginationQuery;
  const svc = new ProjectService(c.env.DB);

  const { projects: items, total } = await svc.list(customerId, page, limit);

  return success({ projects: items }, { page, limit, total });
});

// POST /api/v1/projects
projects.post('/', validateBody(CreateProjectSchema), async (c) => {
  const { customerId } = c.get('auth');
  const data = c.get('body') as CreateProjectInput;
  const svc = new ProjectService(c.env.DB);

  const project = await svc.create(customerId, data);

  // Auto-index project metadata in Vectorize (best-effort, async)
  if (project.metadata && Object.keys(project.metadata).length > 0) {
    try {
      const { VectorizeService } = await import('../services/vectorize.service.js');
      const vecSvc = new VectorizeService(c.env.VECTORIZE, c.env.DB, c.env.AI);
      vecSvc.indexProjectMetadata(customerId, project.id, project.metadata).catch(() => {});
    } catch { /* Vectorize not available */ }
  }

  return success({ project }, undefined, 201);
});

// GET /api/v1/projects/:id
projects.get('/:id', async (c) => {
  const { customerId } = c.get('auth');
  const id = c.req.param('id');
  const svc = new ProjectService(c.env.DB);

  const project = await svc.getById(id, customerId);

  return success({ project });
});

// PATCH /api/v1/projects/:id
projects.patch('/:id', validateBody(UpdateProjectSchema), async (c) => {
  const { customerId } = c.get('auth');
  const id = c.req.param('id');
  const data = c.get('body') as UpdateProjectInput;
  const svc = new ProjectService(c.env.DB);

  const project = await svc.update(id, customerId, data);

  return success({ project });
});

// DELETE /api/v1/projects/:id
projects.delete('/:id', async (c) => {
  const { customerId } = c.get('auth');
  const id = c.req.param('id');
  const svc = new ProjectService(c.env.DB);

  await svc.delete(id, customerId);

  return success({ deleted: true });
});

// POST /api/v1/projects/:id/metadata/refresh
projects.post('/:id/metadata/refresh', async (c) => {
  const { customerId } = c.get('auth');
  const id = c.req.param('id');
  const svc = new ProjectService(c.env.DB);

  const project = await svc.refreshMetadata(id, customerId);

  return success({ project });
});

// GET /api/v1/projects/:id/executions — execution history for this project
projects.get('/:id/executions', validateQuery(PaginationQuerySchema), async (c) => {
  const { customerId } = c.get('auth');
  const projectId = c.req.param('id');
  const { page, limit } = c.get('query') as PaginationQuery;

  const execSvc = new ExecutionService(c.env.DB, c.env.AI);
  const { executions, total } = await execSvc.listByProject(customerId, projectId, page, limit);

  return success({ executions }, { page, limit, total });
});

export { projects as projectRoutes };
