/**
 * Agent service: CRUD + config versioning + category mapping.
 */

import type { Agent, AgentConfig } from '@elon-tools/shared';
import { notFound, badRequest } from '../lib/errors.js';

export class AgentService {
  constructor(private db: D1Database) {}

  // ── List Agents ──

  async list(params: {
    categoryId?: string;
    activeOnly?: boolean;
    page: number;
    limit: number;
  }): Promise<{ agents: Agent[]; total: number }> {
    const conditions: string[] = [];
    const binds: unknown[] = [];

    if (params.categoryId) {
      conditions.push('a.category_id = ?');
      binds.push(params.categoryId);
    }
    if (params.activeOnly !== false) {
      conditions.push('a.is_active = 1');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (params.page - 1) * params.limit;

    const [rows, countRow] = await Promise.all([
      this.db
        .prepare(
          `SELECT a.id, a.name, a.description, a.category_id, a.current_config_version,
                  a.is_active, a.created_at, a.updated_at
           FROM agents a ${where}
           ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(...binds, params.limit, offset)
        .all<Agent>(),
      this.db
        .prepare(`SELECT COUNT(*) as total FROM agents a ${where}`)
        .bind(...binds)
        .first<{ total: number }>(),
    ]);

    return {
      agents: (rows.results ?? []).map(parseAgentRow),
      total: countRow?.total ?? 0,
    };
  }

  // ── Get Agent by ID ──

  async getById(id: string): Promise<Agent> {
    const row = await this.db
      .prepare(
        `SELECT id, name, description, category_id, current_config_version, is_active, created_at, updated_at
         FROM agents WHERE id = ?`,
      )
      .bind(id)
      .first<Agent>();

    if (!row) throw notFound('AGENT_NOT_FOUND', 'Agente não encontrado');
    return parseAgentRow(row);
  }

  // ── Get Agent + Current Config ──

  async getWithConfig(id: string): Promise<Agent & { config: AgentConfig }> {
    const agent = await this.getById(id);

    const config = await this.db
      .prepare(
        `SELECT id, agent_id, config_version, system_prompt, templates, params,
                tools_allowed, policy, input_schema, created_by, created_at
         FROM agent_configs
         WHERE agent_id = ? AND config_version = ?`,
      )
      .bind(id, agent.current_config_version)
      .first<AgentConfig>();

    if (!config) throw notFound('AGENT_CONFIG_NOT_FOUND', 'Configuração do agente não encontrada');

    return { ...agent, config: parseConfigRow(config) };
  }

  // ── Create Agent ──

  async create(
    data: {
      name: string;
      description?: string;
      category_id: string;
      system_prompt: string;
      templates?: Record<string, unknown>;
      params?: Record<string, unknown>;
      tools_allowed?: string[];
      policy?: Record<string, unknown>;
      input_schema?: Record<string, unknown>;
    },
    createdBy: string,
  ): Promise<Agent & { config: AgentConfig }> {
    // Validate category exists
    const cat = await this.db
      .prepare(`SELECT id FROM categories WHERE id = ?`)
      .bind(data.category_id)
      .first();
    if (!cat) throw badRequest('VALIDATION_FAILED', 'Categoria não encontrada');

    const agentId = crypto.randomUUID();
    const configId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create agent
    await this.db
      .prepare(
        `INSERT INTO agents (id, name, description, category_id, current_config_version, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, 1, ?, ?)`,
      )
      .bind(agentId, data.name, data.description ?? null, data.category_id, now, now)
      .run();

    // Create initial config (version 1)
    await this.db
      .prepare(
        `INSERT INTO agent_configs (id, agent_id, config_version, system_prompt, templates, params, tools_allowed, policy, input_schema, created_by, created_at)
         VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        configId,
        agentId,
        data.system_prompt,
        JSON.stringify(data.templates ?? {}),
        JSON.stringify(data.params ?? {}),
        JSON.stringify(data.tools_allowed ?? []),
        JSON.stringify(data.policy ?? {}),
        JSON.stringify(data.input_schema ?? {}),
        createdBy,
        now,
      )
      .run();

    return {
      id: agentId,
      name: data.name,
      description: data.description ?? null,
      category_id: data.category_id,
      current_config_version: 1,
      is_active: true,
      created_at: now,
      updated_at: now,
      config: {
        id: configId,
        agent_id: agentId,
        config_version: 1,
        system_prompt: data.system_prompt,
        templates: data.templates ?? {},
        params: data.params ?? {},
        tools_allowed: data.tools_allowed ?? [],
        policy: data.policy ?? {},
        input_schema: data.input_schema ?? {},
        created_by: createdBy,
        created_at: now,
      },
    };
  }

  // ── Update Agent (metadata only, not config) ──

  async update(
    id: string,
    data: { name?: string; description?: string; category_id?: string; is_active?: boolean },
  ): Promise<Agent> {
    await this.getById(id); // ensure exists

    if (data.category_id) {
      const cat = await this.db.prepare(`SELECT id FROM categories WHERE id = ?`).bind(data.category_id).first();
      if (!cat) throw badRequest('VALIDATION_FAILED', 'Categoria não encontrada');
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.category_id !== undefined) { updates.push('category_id = ?'); values.push(data.category_id); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (updates.length === 0) return this.getById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db
      .prepare(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return this.getById(id);
  }

  // ── Create New Config Version ──

  async createConfigVersion(
    agentId: string,
    data: {
      system_prompt?: string;
      templates?: Record<string, unknown>;
      params?: Record<string, unknown>;
      tools_allowed?: string[];
      policy?: Record<string, unknown>;
      input_schema?: Record<string, unknown>;
    },
    createdBy: string,
  ): Promise<AgentConfig> {
    const agent = await this.getWithConfig(agentId);
    const currentConfig = agent.config;

    const newVersion = agent.current_config_version + 1;
    const configId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Merge: new values override, keep old if not provided
    const merged = {
      system_prompt: data.system_prompt ?? currentConfig.system_prompt,
      templates: data.templates ?? currentConfig.templates,
      params: data.params ?? currentConfig.params,
      tools_allowed: data.tools_allowed ?? currentConfig.tools_allowed,
      policy: data.policy ?? currentConfig.policy,
      input_schema: data.input_schema ?? currentConfig.input_schema,
    };

    // Insert new config version
    await this.db
      .prepare(
        `INSERT INTO agent_configs (id, agent_id, config_version, system_prompt, templates, params, tools_allowed, policy, input_schema, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        configId,
        agentId,
        newVersion,
        merged.system_prompt,
        JSON.stringify(merged.templates),
        JSON.stringify(merged.params),
        JSON.stringify(merged.tools_allowed),
        JSON.stringify(merged.policy),
        JSON.stringify(merged.input_schema),
        createdBy,
        now,
      )
      .run();

    // Update agent's current_config_version
    await this.db
      .prepare(`UPDATE agents SET current_config_version = ?, updated_at = ? WHERE id = ?`)
      .bind(newVersion, now, agentId)
      .run();

    return {
      id: configId,
      agent_id: agentId,
      config_version: newVersion,
      ...merged,
      created_by: createdBy,
      created_at: now,
    };
  }

  // ── List Config Versions ──

  async listConfigVersions(
    agentId: string,
    page: number,
    limit: number,
  ): Promise<{ versions: AgentConfig[]; total: number }> {
    await this.getById(agentId); // ensure exists
    const offset = (page - 1) * limit;

    const [rows, countRow] = await Promise.all([
      this.db
        .prepare(
          `SELECT id, agent_id, config_version, system_prompt, templates, params,
                  tools_allowed, policy, input_schema, created_by, created_at
           FROM agent_configs WHERE agent_id = ?
           ORDER BY config_version DESC LIMIT ? OFFSET ?`,
        )
        .bind(agentId, limit, offset)
        .all<AgentConfig>(),
      this.db
        .prepare(`SELECT COUNT(*) as total FROM agent_configs WHERE agent_id = ?`)
        .bind(agentId)
        .first<{ total: number }>(),
    ]);

    return {
      versions: (rows.results ?? []).map(parseConfigRow),
      total: countRow?.total ?? 0,
    };
  }

  // ── Get Specific Config Version ──

  async getConfigVersion(agentId: string, version: number): Promise<AgentConfig> {
    const row = await this.db
      .prepare(
        `SELECT id, agent_id, config_version, system_prompt, templates, params,
                tools_allowed, policy, input_schema, created_by, created_at
         FROM agent_configs WHERE agent_id = ? AND config_version = ?`,
      )
      .bind(agentId, version)
      .first<AgentConfig>();

    if (!row) throw notFound('AGENT_CONFIG_NOT_FOUND', 'Versão de configuração não encontrada');
    return parseConfigRow(row);
  }

  // ── Soft Delete Agent ──

  async deactivate(id: string): Promise<void> {
    await this.getById(id);
    await this.db
      .prepare(`UPDATE agents SET is_active = 0, updated_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), id)
      .run();
  }
}

// ── Helpers ──

function parseAgentRow(row: Agent): Agent {
  return { ...row, is_active: Boolean(row.is_active) };
}

function parseConfigRow(row: AgentConfig): AgentConfig {
  return {
    ...row,
    templates: typeof row.templates === 'string' ? JSON.parse(row.templates as unknown as string) : row.templates,
    params: typeof row.params === 'string' ? JSON.parse(row.params as unknown as string) : row.params,
    tools_allowed: typeof row.tools_allowed === 'string' ? JSON.parse(row.tools_allowed as unknown as string) : row.tools_allowed,
    policy: typeof row.policy === 'string' ? JSON.parse(row.policy as unknown as string) : row.policy,
    input_schema: typeof row.input_schema === 'string' ? JSON.parse(row.input_schema as unknown as string) : row.input_schema,
  };
}
