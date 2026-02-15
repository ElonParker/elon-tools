import { Hono } from 'hono';
import type { Env, AuthContext } from '../bindings.js';
import { CreateProjectSchema, UpdateProjectSchema, PaginationQuerySchema } from '@elon-tools/shared';
import { authMiddleware, rbac, validateBody, validateQuery } from '../middleware/index.js';
import { success } from '../lib/response.js';

const projects = new Hono<{ Bindings: Env; Variables: { auth: AuthContext; body: unknown; query: unknown } }>();

// All project routes require auth
projects.use('*', authMiddleware);

// GET /api/v1/projects
projects.get('/', validateQuery(PaginationQuerySchema), async (c) => {
  // STUB: Etapa 6 — list projects filtered by customer_id
  return success({ projects: [], pagination: { page: 1, limit: 20, total: 0 } });
});

// POST /api/v1/projects
projects.post('/', validateBody(CreateProjectSchema), async (c) => {
  // STUB: Etapa 6 — create project, auto-fetch metadata
  return success(
    {
      project: {
        id: 'stub-id',
        domain: 'example.com',
        name: null,
        niche: null,
        favicon_url: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    undefined,
    201,
  );
});

// GET /api/v1/projects/:id
projects.get('/:id', async (c) => {
  // STUB: Etapa 6 — get project by id (filtered by customer_id)
  return success({ project: null });
});

// PATCH /api/v1/projects/:id
projects.patch('/:id', validateBody(UpdateProjectSchema), async (c) => {
  // STUB: Etapa 6 — update project
  return success({ project: null });
});

// DELETE /api/v1/projects/:id
projects.delete('/:id', async (c) => {
  // STUB: Etapa 6 — soft delete project
  return success({ deleted: true });
});

// POST /api/v1/projects/:id/metadata/refresh
projects.post('/:id/metadata/refresh', async (c) => {
  // STUB: Etapa 6 — re-fetch domain metadata
  return success({ project: null });
});

export { projects as projectRoutes };
