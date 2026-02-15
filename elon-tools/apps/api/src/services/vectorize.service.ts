/**
 * Vectorize service: upsert, search, delete vectors with tenant isolation.
 */

import { EmbeddingService, type EmbeddingChunk } from './embedding.service.js';
import { Limits } from '@elon-tools/shared';
import { logger } from '../lib/logger.js';

export interface VectorMetadata {
  customer_id: string;
  project_id: string;
  source_type: 'project_metadata' | 'execution_output';
  source_id: string;
  agent_id?: string;
  category_slug?: string;
  chunk_index: number;
  created_at: string;
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: VectorMetadata;
}

export class VectorizeService {
  private embeddingSvc: EmbeddingService;

  constructor(
    private vectorize: VectorizeIndex,
    private db: D1Database,
    ai: Ai,
  ) {
    this.embeddingSvc = new EmbeddingService(ai);
  }

  // ── Indexing ──

  /**
   * Index project metadata (title, description, tech, etc.)
   */
  async indexProjectMetadata(
    customerId: string,
    projectId: string,
    metadata: Record<string, unknown>,
  ): Promise<number> {
    // Check limits
    await this.checkLimits(customerId, projectId);

    // Build text from metadata
    const parts: string[] = [];
    if (metadata.title) parts.push(`Título: ${metadata.title}`);
    if (metadata.description) parts.push(`Descrição: ${metadata.description}`);
    if (metadata.og_description) parts.push(`OG Description: ${metadata.og_description}`);
    if (Array.isArray(metadata.tech_hints)) parts.push(`Tecnologias: ${metadata.tech_hints.join(', ')}`);
    if (Array.isArray(metadata.social_links)) parts.push(`Redes: ${metadata.social_links.join(', ')}`);
    if (metadata.language) parts.push(`Idioma: ${metadata.language}`);

    const text = parts.join('\n');
    if (text.length < 50) return 0;

    const chunks = EmbeddingService.chunk(text);
    if (chunks.length === 0) return 0;

    return this.upsertChunks(chunks, {
      customer_id: customerId,
      project_id: projectId,
      source_type: 'project_metadata',
      source_id: projectId,
    });
  }

  /**
   * Index execution output.
   */
  async indexExecutionOutput(
    customerId: string,
    projectId: string,
    executionId: string,
    agentId: string,
    categorySlug: string | undefined,
    output: string,
  ): Promise<number> {
    if (!output || output.length < Limits.VECTORIZE_MIN_OUTPUT_CHARS) return 0;

    // Check limits
    await this.checkLimits(customerId, projectId);

    const chunks = EmbeddingService.chunk(output);
    if (chunks.length === 0) return 0;

    const count = await this.upsertChunks(chunks, {
      customer_id: customerId,
      project_id: projectId,
      source_type: 'execution_output',
      source_id: executionId,
      agent_id: agentId,
      category_slug: categorySlug,
    });

    // Mark execution as having embedding
    if (count > 0) {
      await this.db
        .prepare(`UPDATE agent_executions SET has_embedding = 1 WHERE id = ?`)
        .bind(executionId)
        .run();
    }

    return count;
  }

  /**
   * Upsert chunks as vectors.
   */
  private async upsertChunks(
    chunks: EmbeddingChunk[],
    meta: Omit<VectorMetadata, 'chunk_index' | 'created_at'>,
  ): Promise<number> {
    const texts = chunks.map((c) => c.text);
    const vectors = await this.embeddingSvc.embedBatch(texts);

    const now = new Date().toISOString();
    const vectorEntries = chunks.map((chunk, i) => ({
      id: `${meta.source_type}:${meta.source_id}:${chunk.index}:${chunk.hash}`,
      values: vectors[i]!,
      metadata: {
        ...meta,
        chunk_index: chunk.index,
        created_at: now,
        text: chunk.text, // Store text in metadata for retrieval
      },
    }));

    try {
      await this.vectorize.upsert(vectorEntries);
      logger.info('Vectors upserted', {
        source_type: meta.source_type,
        source_id: meta.source_id,
        count: vectorEntries.length,
      });
      return vectorEntries.length;
    } catch (err) {
      logger.error('Vectorize upsert failed', { error: (err as Error).message });
      return 0;
    }
  }

  // ── Search ──

  /**
   * Search vectors filtered by tenant (customer_id + project_id).
   * Returns top-K results with score >= threshold.
   */
  async search(
    query: string,
    customerId: string,
    projectId: string,
    options: {
      topK?: number;
      agentId?: string;
      sourceType?: 'project_metadata' | 'execution_output';
    } = {},
  ): Promise<SearchResult[]> {
    const topK = Math.min(options.topK ?? Limits.VECTORIZE_TOP_K_DEFAULT, Limits.VECTORIZE_TOP_K_MAX);

    // Generate query embedding
    const queryVector = await this.embeddingSvc.embed(query);

    // Build filter
    const filter: Record<string, unknown> = {
      customer_id: customerId,
      project_id: projectId,
    };
    if (options.agentId) filter.agent_id = options.agentId;
    if (options.sourceType) filter.source_type = options.sourceType;

    // Query Vectorize
    const results = await this.vectorize.query(queryVector, {
      topK,
      filter,
      returnMetadata: 'all',
      returnValues: false,
    });

    // Filter by minimum score and map
    return (results.matches ?? [])
      .filter((m) => (m.score ?? 0) >= Limits.VECTORIZE_MIN_SCORE)
      .map((match) => ({
        id: match.id,
        text: redactSensitive((match.metadata as any)?.text ?? ''),
        score: match.score ?? 0,
        metadata: match.metadata as unknown as VectorMetadata,
      }));
  }

  /**
   * Build RAG context string from search results (with char limit).
   */
  static buildRagContext(results: SearchResult[], maxChars = 3000): string {
    if (results.length === 0) return '';

    const parts: string[] = ['═══ CONTEXTO RAG (dados indexados do projeto) ═══'];
    let totalChars = parts[0]!.length;

    for (const r of results) {
      const entry = `[Score: ${r.score.toFixed(2)} | ${r.metadata.source_type}]\n${r.text}`;
      if (totalChars + entry.length + 10 > maxChars) break;
      parts.push(entry);
      totalChars += entry.length;
    }

    parts.push('═══ FIM CONTEXTO RAG ═══');
    return parts.join('\n\n');
  }

  // ── Delete ──

  /**
   * Delete vectors for a specific source.
   */
  async deleteBySource(sourceType: string, sourceId: string): Promise<void> {
    // Vectorize doesn't support filter-based delete easily,
    // so we need to know IDs. For now, use ID prefix pattern.
    // This is a limitation — in production, track IDs in D1.
    try {
      const prefix = `${sourceType}:${sourceId}:`;
      // Vectorize deleteByIds requires exact IDs
      // Best-effort: delete known patterns (0-4 chunks)
      const ids = Array.from({ length: 5 }, (_, i) => `${prefix}${i}`);
      await this.vectorize.deleteByIds(ids.map((id) => `${id}:00000000`));
    } catch {
      // Best-effort
    }
  }

  // ── Limits ──

  private async checkLimits(customerId: string, projectId: string): Promise<void> {
    // Note: Vectorize doesn't expose count easily.
    // We use D1 has_embedding count as proxy.
    const projectCount = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM agent_executions WHERE project_id = ? AND has_embedding = 1`,
      )
      .bind(projectId)
      .first<{ count: number }>();

    if ((projectCount?.count ?? 0) * 3 > Limits.VECTORIZE_MAX_PER_PROJECT) {
      throw new Error('VECTOR_LIMIT_EXCEEDED');
    }

    const customerCount = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM agent_executions WHERE customer_id = ? AND has_embedding = 1`,
      )
      .bind(customerId)
      .first<{ count: number }>();

    if ((customerCount?.count ?? 0) * 3 > Limits.VECTORIZE_MAX_PER_CUSTOMER) {
      throw new Error('VECTOR_LIMIT_EXCEEDED');
    }
  }
}

/**
 * Simple redaction: remove potential PII patterns (emails, phones).
 */
function redactSensitive(text: string): string {
  return text
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[cpf]'); // Brazilian CPF
}
