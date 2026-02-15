/**
 * Execution service: run agents with RAG + cache, save history, manage lifecycle.
 */

import type { AgentExecution, Project } from '@elon-tools/shared';
import { AgentService } from './agent.service.js';
import { ProjectService } from './project.service.js';
import { AiService } from './ai.service.js';
import { VectorizeService } from './vectorize.service.js';
import { ExecutionCacheService } from './execution-cache.service.js';
import { buildMessages, flattenInput, detectPromptInjection, buildProjectContext } from '../lib/prompt.js';
import { badRequest, notFound } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export class ExecutionService {
  private agentSvc: AgentService;
  private projectSvc: ProjectService;
  private aiSvc: AiService;
  private vectorizeSvc: VectorizeService | null;
  private cacheSvc: ExecutionCacheService | null;

  constructor(
    private db: D1Database,
    ai: Ai,
    vectorize?: VectorizeIndex,
    kv?: KVNamespace,
  ) {
    this.agentSvc = new AgentService(db);
    this.projectSvc = new ProjectService(db);
    this.aiSvc = new AiService(ai);
    this.vectorizeSvc = vectorize ? new VectorizeService(vectorize, db, ai) : null;
    this.cacheSvc = kv ? new ExecutionCacheService(kv) : null;
  }

  /**
   * Execute an agent (non-streaming) with RAG + Cache.
   */
  async execute(
    agentId: string,
    customerId: string,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecution> {
    // 1. Load agent + config
    const agentWithConfig = await this.agentSvc.getWithConfig(agentId);
    if (!agentWithConfig.is_active) throw badRequest('AGENT_INACTIVE', 'Agente desativado');

    // 2. Load project
    const project = await this.projectSvc.getById(projectId, customerId);

    // 3. Sanitize + check injection
    const userInput = flattenInput(input);
    const injection = detectPromptInjection(userInput);
    if (injection.detected) {
      logger.warn('Prompt injection detected', { customer_id: customerId, agent_id: agentId, patterns: injection.patterns });
      throw badRequest('EXECUTION_PROMPT_INJECTION', 'Input rejeitado por política de segurança');
    }

    // 4. Check cache
    if (this.cacheSvc) {
      const cached = await this.cacheSvc.get(customerId, projectId, agentId, agentWithConfig.current_config_version, input);
      if (cached) {
        // Return cached result as a "done" execution
        return this.createCachedExecution(agentId, agentWithConfig.current_config_version, customerId, projectId, input, cached.output);
      }
    }

    // 5. RAG: search relevant context
    let ragContext = '';
    if (this.vectorizeSvc) {
      try {
        const results = await this.vectorizeSvc.search(userInput, customerId, projectId, { agentId });
        ragContext = VectorizeService.buildRagContext(results, 3000);
      } catch (err) {
        logger.warn('RAG search failed, continuing without', { error: (err as Error).message });
      }
    }

    // 6. Create execution record
    const execId = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO agent_executions 
         (id, agent_id, agent_config_version, customer_id, project_id, input, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'running', ?, ?)`,
      )
      .bind(execId, agentId, agentWithConfig.current_config_version, customerId, projectId, JSON.stringify(input), now, now)
      .run();

    try {
      // 7. Build messages (with RAG context injected)
      const messages = buildMessages(agentWithConfig.config, project, userInput, ragContext);

      // 8. Call Workers AI
      const result = await this.aiSvc.run(messages, agentWithConfig.config.params as Record<string, unknown>);

      // 9. Save result
      await this.db
        .prepare(
          `UPDATE agent_executions 
           SET status = 'done', output = ?, tokens_input = ?, tokens_output = ?, duration_ms = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(result.text, result.tokensInput, result.tokensOutput, result.durationMs, new Date().toISOString(), execId)
        .run();

      // 10. Cache result
      if (this.cacheSvc) {
        const categorySlug = await this.getCategorySlug(agentWithConfig.category_id);
        await this.cacheSvc.set(customerId, projectId, agentId, agentWithConfig.current_config_version, input, result.text, categorySlug);
      }

      // 11. Index output in Vectorize (async, best-effort)
      if (this.vectorizeSvc && result.text.length >= 100) {
        const categorySlug = await this.getCategorySlug(agentWithConfig.category_id);
        this.vectorizeSvc.indexExecutionOutput(customerId, projectId, execId, agentId, categorySlug, result.text)
          .catch((err) => logger.warn('Vectorize index failed', { error: (err as Error).message }));
      }

      logger.info('Agent execution completed', {
        execution_id: execId, agent_id: agentId, customer_id: customerId,
        project_id: projectId, tokens_in: result.tokensInput, tokens_out: result.tokensOutput,
        duration_ms: result.durationMs, rag_used: ragContext.length > 0,
      });

      return this.getById(execId, customerId);
    } catch (err) {
      await this.db
        .prepare(`UPDATE agent_executions SET status = 'error', error_message = ?, updated_at = ? WHERE id = ?`)
        .bind((err as Error).message.slice(0, 1000), new Date().toISOString(), execId)
        .run();
      logger.error('Agent execution failed', { execution_id: execId, agent_id: agentId, error: (err as Error).message });
      throw err;
    }
  }

  /**
   * Execute with streaming (SSE) + RAG context.
   */
  async executeStream(
    agentId: string,
    customerId: string,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<Response> {
    const agentWithConfig = await this.agentSvc.getWithConfig(agentId);
    if (!agentWithConfig.is_active) throw badRequest('AGENT_INACTIVE', 'Agente desativado');

    const project = await this.projectSvc.getById(projectId, customerId);
    const userInput = flattenInput(input);

    const injection = detectPromptInjection(userInput);
    if (injection.detected) {
      throw badRequest('EXECUTION_PROMPT_INJECTION', 'Input rejeitado por política de segurança');
    }

    // RAG context
    let ragContext = '';
    if (this.vectorizeSvc) {
      try {
        const results = await this.vectorizeSvc.search(userInput, customerId, projectId, { agentId });
        ragContext = VectorizeService.buildRagContext(results, 3000);
      } catch (err) {
        logger.warn('RAG search failed for stream', { error: (err as Error).message });
      }
    }

    // Create execution record
    const execId = crypto.randomUUID();
    const now = new Date().toISOString();
    const startTime = Date.now();

    await this.db
      .prepare(
        `INSERT INTO agent_executions 
         (id, agent_id, agent_config_version, customer_id, project_id, input, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'running', ?, ?)`,
      )
      .bind(execId, agentId, agentWithConfig.current_config_version, customerId, projectId, JSON.stringify(input), now, now)
      .run();

    // Build messages with RAG
    const messages = buildMessages(agentWithConfig.config, project, userInput, ragContext);

    // Get AI stream
    const aiStream = await this.aiSvc.runStream(messages, agentWithConfig.config.params as Record<string, unknown>);

    // Transform: intercept chunks, collect text, save after
    const db = this.db;
    const vectorizeSvc = this.vectorizeSvc;
    const cacheSvc = this.cacheSvc;
    const configVersion = agentWithConfig.current_config_version;
    const categoryId = agentWithConfig.category_id;
    const self = this;
    let fullText = '';
    const decoder = new TextDecoder();

    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        const text = decoder.decode(chunk, { stream: true });
        for (const line of text.split('\n')) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.response) fullText += data.response;
            } catch { /* skip */ }
          }
        }
      },
      async flush() {
        const durationMs = Date.now() - startTime;
        const tokensInput = Math.ceil(messages.map((m) => m.content).join(' ').length / 3.5);
        const tokensOutput = Math.ceil(fullText.length / 3.5);

        try {
          await db
            .prepare(
              `UPDATE agent_executions 
               SET status = 'done', output = ?, tokens_input = ?, tokens_output = ?, duration_ms = ?, updated_at = ?
               WHERE id = ?`,
            )
            .bind(fullText, tokensInput, tokensOutput, durationMs, new Date().toISOString(), execId)
            .run();

          // Cache
          if (cacheSvc) {
            const slug = await self.getCategorySlug(categoryId);
            await cacheSvc.set(customerId, projectId, agentId, configVersion, input, fullText, slug);
          }

          // Index (best-effort)
          if (vectorizeSvc && fullText.length >= 100) {
            const slug = await self.getCategorySlug(categoryId);
            vectorizeSvc.indexExecutionOutput(customerId, projectId, execId, agentId, slug, fullText).catch(() => {});
          }
        } catch (err) {
          console.error('Failed to save execution after stream:', err);
        }
      },
    });

    aiStream.pipeTo(writable).catch(() => {
      db.prepare(
        `UPDATE agent_executions SET status = 'error', error_message = 'Stream interrupted', updated_at = ? WHERE id = ?`,
      ).bind(new Date().toISOString(), execId).run().catch(() => {});
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Execution-Id': execId,
        'X-Rag-Used': ragContext.length > 0 ? 'true' : 'false',
      },
    });
  }

  // ── Cached execution helper ──

  private async createCachedExecution(
    agentId: string,
    configVersion: number,
    customerId: string,
    projectId: string,
    input: Record<string, unknown>,
    output: string,
  ): Promise<AgentExecution> {
    const execId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO agent_executions 
         (id, agent_id, agent_config_version, customer_id, project_id, input, output, status, tokens_input, tokens_output, duration_ms, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'done', 0, 0, 0, ?, ?)`,
      )
      .bind(execId, agentId, configVersion, customerId, projectId, JSON.stringify(input), output, now, now)
      .run();

    return this.getById(execId, customerId);
  }

  // ── Category slug helper ──

  private async getCategorySlug(categoryId: string): Promise<string | undefined> {
    const row = await this.db
      .prepare(`SELECT slug FROM categories WHERE id = ? LIMIT 1`)
      .bind(categoryId)
      .first<{ slug: string }>();
    return row?.slug;
  }

  // ── History (unchanged) ──

  async getById(id: string, customerId: string): Promise<AgentExecution> {
    const row = await this.db
      .prepare(
        `SELECT e.*, a.name as agent_name
         FROM agent_executions e JOIN agents a ON a.id = e.agent_id
         WHERE e.id = ? AND e.customer_id = ?`,
      )
      .bind(id, customerId)
      .first<AgentExecution & { agent_name: string }>();

    if (!row) throw notFound('EXECUTION_NOT_FOUND', 'Execução não encontrada');
    return parseExecutionRow(row);
  }

  async listByProject(
    customerId: string, projectId: string, page: number, limit: number,
  ): Promise<{ executions: AgentExecution[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRow] = await Promise.all([
      this.db
        .prepare(
          `SELECT e.*, a.name as agent_name FROM agent_executions e JOIN agents a ON a.id = e.agent_id
           WHERE e.customer_id = ? AND e.project_id = ? ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(customerId, projectId, limit, offset)
        .all<AgentExecution>(),
      this.db
        .prepare(`SELECT COUNT(*) as total FROM agent_executions WHERE customer_id = ? AND project_id = ?`)
        .bind(customerId, projectId)
        .first<{ total: number }>(),
    ]);
    return { executions: (rows.results ?? []).map(parseExecutionRow), total: countRow?.total ?? 0 };
  }

  async listByAgent(
    customerId: string, agentId: string, projectId: string | undefined, page: number, limit: number,
  ): Promise<{ executions: AgentExecution[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions = ['e.customer_id = ?', 'e.agent_id = ?'];
    const binds: unknown[] = [customerId, agentId];
    if (projectId) { conditions.push('e.project_id = ?'); binds.push(projectId); }
    const where = conditions.join(' AND ');

    const [rows, countRow] = await Promise.all([
      this.db
        .prepare(
          `SELECT e.*, a.name as agent_name FROM agent_executions e JOIN agents a ON a.id = e.agent_id
           WHERE ${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(...binds, limit, offset)
        .all<AgentExecution>(),
      this.db
        .prepare(`SELECT COUNT(*) as total FROM agent_executions e WHERE ${where}`)
        .bind(...binds)
        .first<{ total: number }>(),
    ]);
    return { executions: (rows.results ?? []).map(parseExecutionRow), total: countRow?.total ?? 0 };
  }
}

function parseExecutionRow(row: AgentExecution): AgentExecution {
  return {
    ...row,
    input: typeof row.input === 'string' ? JSON.parse(row.input as unknown as string) : row.input,
    has_embedding: Boolean(row.has_embedding),
  };
}
