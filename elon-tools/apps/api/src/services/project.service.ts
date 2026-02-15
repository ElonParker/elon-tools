/**
 * Project service: CRUD + metadata management.
 */

import type { Project } from '@elon-tools/shared';
import { collectDomainMetadata, validateDomain } from './domain-collector.service.js';
import { badRequest, notFound, conflict } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export class ProjectService {
  constructor(private db: D1Database) {}

  /**
   * List projects for a customer (paginated).
   */
  async list(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<{ projects: Project[]; total: number }> {
    const offset = (page - 1) * limit;

    const [rows, countRow] = await Promise.all([
      this.db
        .prepare(
          `SELECT id, customer_id, domain, name, niche, favicon_url, metadata, created_at, updated_at
           FROM projects WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(customerId, limit, offset)
        .all<Project>(),
      this.db
        .prepare(`SELECT COUNT(*) as total FROM projects WHERE customer_id = ?`)
        .bind(customerId)
        .first<{ total: number }>(),
    ]);

    return {
      projects: (rows.results ?? []).map(parseProjectRow),
      total: countRow?.total ?? 0,
    };
  }

  /**
   * Get project by ID (scoped to customer).
   */
  async getById(id: string, customerId: string): Promise<Project> {
    const row = await this.db
      .prepare(
        `SELECT id, customer_id, domain, name, niche, favicon_url, metadata, created_at, updated_at
         FROM projects WHERE id = ? AND customer_id = ?`,
      )
      .bind(id, customerId)
      .first<Project>();

    if (!row) throw notFound('PROJECT_NOT_FOUND', 'Projeto não encontrado');
    return parseProjectRow(row);
  }

  /**
   * Create a project with auto-metadata collection.
   */
  async create(
    customerId: string,
    data: { domain: string; name?: string; niche?: string },
  ): Promise<Project> {
    // Validate domain
    const domainCheck = validateDomain(data.domain);
    if (!domainCheck.valid) {
      throw badRequest('VALIDATION_DOMAIN_INVALID', domainCheck.error!);
    }

    // Check uniqueness
    const existing = await this.db
      .prepare(`SELECT id FROM projects WHERE customer_id = ? AND domain = ?`)
      .bind(customerId, data.domain)
      .first();

    if (existing) {
      throw conflict('PROJECT_DOMAIN_EXISTS', 'Domínio já cadastrado nesta conta');
    }

    // Auto-collect metadata (best-effort)
    let metadata = {};
    let faviconUrl: string | null = null;
    let autoName: string | null = null;

    try {
      const collected = await collectDomainMetadata(data.domain);
      metadata = collected;
      faviconUrl = collected.favicon_url;
      autoName = collected.title ?? collected.og_title;

      if (collected.error) {
        logger.warn('Domain metadata collection partial', {
          domain: data.domain,
          error: collected.error,
        });
      }
    } catch (err) {
      logger.warn('Domain metadata collection failed', {
        domain: data.domain,
        error: (err as Error).message,
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO projects (id, customer_id, domain, name, niche, favicon_url, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        customerId,
        data.domain,
        data.name ?? autoName,
        data.niche ?? null,
        faviconUrl,
        JSON.stringify(metadata),
        now,
        now,
      )
      .run();

    return {
      id,
      customer_id: customerId,
      domain: data.domain,
      name: data.name ?? autoName,
      niche: data.niche ?? null,
      favicon_url: faviconUrl,
      metadata: metadata as Record<string, unknown>,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Update project fields.
   */
  async update(
    id: string,
    customerId: string,
    data: { domain?: string; name?: string; niche?: string; metadata?: Record<string, unknown> },
  ): Promise<Project> {
    // Verify exists
    const existing = await this.getById(id, customerId);

    // If changing domain, validate + check uniqueness
    if (data.domain && data.domain !== existing.domain) {
      const domainCheck = validateDomain(data.domain);
      if (!domainCheck.valid) {
        throw badRequest('VALIDATION_DOMAIN_INVALID', domainCheck.error!);
      }
      const dup = await this.db
        .prepare(`SELECT id FROM projects WHERE customer_id = ? AND domain = ? AND id != ?`)
        .bind(customerId, data.domain, id)
        .first();
      if (dup) {
        throw conflict('PROJECT_DOMAIN_EXISTS', 'Domínio já cadastrado nesta conta');
      }
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.domain !== undefined) { updates.push('domain = ?'); values.push(data.domain); }
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.niche !== undefined) { updates.push('niche = ?'); values.push(data.niche); }
    if (data.metadata !== undefined) { updates.push('metadata = ?'); values.push(JSON.stringify(data.metadata)); }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id, customerId);

    await this.db
      .prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ? AND customer_id = ?`)
      .bind(...values)
      .run();

    return this.getById(id, customerId);
  }

  /**
   * Delete project.
   */
  async delete(id: string, customerId: string): Promise<void> {
    // Verify exists
    await this.getById(id, customerId);

    await this.db
      .prepare(`DELETE FROM projects WHERE id = ? AND customer_id = ?`)
      .bind(id, customerId)
      .run();
  }

  /**
   * Re-collect metadata for a project.
   */
  async refreshMetadata(id: string, customerId: string): Promise<Project> {
    const project = await this.getById(id, customerId);

    const collected = await collectDomainMetadata(project.domain);
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `UPDATE projects SET 
           favicon_url = COALESCE(?, favicon_url),
           metadata = ?,
           updated_at = ?
         WHERE id = ? AND customer_id = ?`,
      )
      .bind(
        collected.favicon_url,
        JSON.stringify(collected),
        now,
        id,
        customerId,
      )
      .run();

    return this.getById(id, customerId);
  }
}

function parseProjectRow(row: Project): Project {
  return {
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata as unknown as string) : (row.metadata ?? {}),
  };
}
