/**
 * Execution service: run agents, save history, manage lifecycle.
 */

import type { AgentExecution, Project } from '@elon-tools/shared';
import { AgentService } from './agent.service.js';
import { ProjectService } from './project.service.js';
import { AiService } from './ai.service.js';
import { buildMessages, flattenInput, detectPromptInjection } from '../lib/prompt.js';
import { badRequest, notFound } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export class ExecutionService {
  private agentSvc: AgentService;
  private projectSvc: ProjectService;
  private aiSvc: AiService;

  constructor(
    private db: D1Database,
    ai: Ai,
  ) {
    this.agentSvc = new AgentService(db);
    this.projectSvc = new ProjectService(db);
    this.aiSvc = new AiService(ai);
  }

  /**
   * Execute an agent (non-streaming). Full lifecycle:
   * validate → create record → build prompt → call AI → update record.
   */
  async execute(
    agentId: string,
    customerId: string,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecution> {
    // 1. Load agent + config
    const agentWithConfig = await this.agentSvc.getWithConfig(agentId);
    if (!agentWithConfig.is_active) {
      throw badRequest('AGENT_INACTIVE', 'Agente desativado');
    }

    // 2. Load project (scoped to customer)
    const project = await this.projectSvc.getById(projectId, customerId);

    // 3. Flatten + sanitize input
    const userInput = flattenInput(input);

    // 4. Check prompt injection
    const injection = detectPromptInjection(userInput);
    if (injection.detected) {
      logger.warn('Prompt injection detected', {
        customer_id: customerId,
        agent_id: agentId,
        patterns: injection.patterns,
      });
      throw badRequest('EXECUTION_PROMPT_INJECTION', 'Input rejeitado por política de segurança');
    }

    // 5. Create execution record (pending)
    const execId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO agent_executions 
         (id, agent_id, agent_config_version, customer_id, project_id, input, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      )
      .bind(execId, agentId, agentWithConfig.current_config_version, customerId, projectId, JSON.stringify(input), now, now)
      .run();

    // 6. Update to running
    await this.updateStatus(execId, 'running');

    try {
      // 7. Build messages
      const messages = buildMessages(agentWithConfig.config, project, userInput);

      // 8. Call Workers AI
      const result = await this.aiSvc.run(messages, agentWithConfig.config.params as Record<string, unknown>);

      // 9. Update to done
      await this.db
        .prepare(
          `UPDATE agent_executions 
           SET status = 'done', output = ?, tokens_input = ?, tokens_output = ?, duration_ms = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(result.text, result.tokensInput, result.tokensOutput, result.durationMs, new Date().toISOString(), execId)
        .run();

      logger.info('Agent execution completed', {
        execution_id: execId,
        agent_id: agentId,
        customer_id: customerId,
        project_id: projectId,
        tokens_in: result.tokensInput,
        tokens_out: result.tokensOutput,
        duration_ms: result.durationMs,
      });

      return this.getById(execId, customerId);
    } catch (err) {
      // Update to error
      await this.db
        .prepare(
          `UPDATE agent_executions SET status = 'error', error_message = ?, updated_at = ? WHERE id = ?`,
        )
        .bind((err as Error).message.slice(0, 1000), new Date().toISOString(), execId)
        .run();

      logger.error('Agent execution failed', {
        execution_id: execId,
        agent_id: agentId,
        error: (err as Error).message,
      });

      throw err;
    }
  }

  /**
   * Execute with streaming (SSE). Returns a Response with streaming body.
   * Also saves result to D1 after stream completes.
   */
  async executeStream(
    agentId: string,
    customerId: string,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<Response> {
    // 1-4: Same validation
    const agentWithConfig = await this.agentSvc.getWithConfig(agentId);
    if (!agentWithConfig.is_active) {
      throw badRequest('AGENT_INACTIVE', 'Agente desativado');
    }

    const project = await this.projectSvc.getById(projectId, customerId);
    const userInput = flattenInput(input);

    const injection = detectPromptInjection(userInput);
    if (injection.detected) {
      logger.warn('Prompt injection detected (stream)', {
        customer_id: customerId,
        agent_id: agentId,
        patterns: injection.patterns,
      });
      throw badRequest('EXECUTION_PROMPT_INJECTION', 'Input rejeitado por política de segurança');
    }

    // 5. Create execution record
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

    // 6. Build messages
    const messages = buildMessages(agentWithConfig.config, project, userInput);

    // 7. Get AI stream
    const aiStream = await this.aiSvc.runStream(messages, agentWithConfig.config.params as Record<string, unknown>);

    // 8. Create a TransformStream to intercept chunks, collect full text, and save after
    const db = this.db;
    let fullText = '';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        // Pass through to client
        controller.enqueue(chunk);

        // Collect text for DB save
        const text = decoder.decode(chunk, { stream: true });
        // Parse SSE data lines
        for (const line of text.split('\n')) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.response) fullText += data.response;
            } catch {
              // not JSON, skip
            }
          }
        }
      },
      async flush(_controller) {
        // Stream ended — save to DB
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
        } catch (err) {
          console.error('Failed to save execution after stream:', err);
        }
      },
    });

    // Pipe AI stream through transform
    aiStream.pipeTo(writable).catch(() => {
      // If stream errors, mark execution as error
      db.prepare(
        `UPDATE agent_executions SET status = 'error', error_message = 'Stream interrupted', updated_at = ? WHERE id = ?`,
      )
        .bind(new Date().toISOString(), execId)
        .run()
        .catch(() => {});
    });

    // Return SSE response with execution ID in header
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Execution-Id': execId,
      },
    });
  }

  // ── History ──

  async getById(id: string, customerId: string): Promise<AgentExecution> {
    const row = await this.db
      .prepare(
        `SELECT e.*, a.name as agent_name
         FROM agent_executions e
         JOIN agents a ON a.id = e.agent_id
         WHERE e.id = ? AND e.customer_id = ?`,
      )
      .bind(id, customerId)
      .first<AgentExecution & { agent_name: string }>();

    if (!row) throw notFound('EXECUTION_NOT_FOUND', 'Execução não encontrada');
    return parseExecutionRow(row);
  }

  async listByProject(
    customerId: string,
    projectId: string,
    page: number,
    limit: number,
  ): Promise<{ executions: AgentExecution[]; total: number }> {
    const offset = (page - 1) * limit;

    const [rows, countRow] = await Promise.all([
      this.db
        .prepare(
          `SELECT e.*, a.name as agent_name
           FROM agent_executions e
           JOIN agents a ON a.id = e.agent_id
           WHERE e.customer_id = ? AND e.project_id = ?
           ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(customerId, projectId, limit, offset)
        .all<AgentExecution>(),
      this.db
        .prepare(
          `SELECT COUNT(*) as total FROM agent_executions WHERE customer_id = ? AND project_id = ?`,
        )
        .bind(customerId, projectId)
        .first<{ total: number }>(),
    ]);

    return {
      executions: (rows.results ?? []).map(parseExecutionRow),
      total: countRow?.total ?? 0,
    };
  }

  async listByAgent(
    customerId: string,
    agentId: string,
    projectId: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ executions: AgentExecution[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions = ['e.customer_id = ?', 'e.agent_id = ?'];
    const binds: unknown[] = [customerId, agentId];

    if (projectId) {
      conditions.push('e.project_id = ?');
      binds.push(projectId);
    }

    const where = conditions.join(' AND ');

    const [rows, countRow] = await Promise.all([
      this.db
        .prepare(
          `SELECT e.*, a.name as agent_name
           FROM agent_executions e
           JOIN agents a ON a.id = e.agent_id
           WHERE ${where}
           ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(...binds, limit, offset)
        .all<AgentExecution>(),
      this.db
        .prepare(`SELECT COUNT(*) as total FROM agent_executions e WHERE ${where}`)
        .bind(...binds)
        .first<{ total: number }>(),
    ]);

    return {
      executions: (rows.results ?? []).map(parseExecutionRow),
      total: countRow?.total ?? 0,
    };
  }

  // ── Internal ──

  private async updateStatus(id: string, status: string): Promise<void> {
    await this.db
      .prepare(`UPDATE agent_executions SET status = ?, updated_at = ? WHERE id = ?`)
      .bind(status, new Date().toISOString(), id)
      .run();
  }
}

function parseExecutionRow(row: AgentExecution): AgentExecution {
  return {
    ...row,
    input: typeof row.input === 'string' ? JSON.parse(row.input as unknown as string) : row.input,
    has_embedding: Boolean(row.has_embedding),
  };
}
