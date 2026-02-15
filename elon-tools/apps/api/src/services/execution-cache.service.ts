/**
 * Execution cache: KV-based intelligent cache for agent responses.
 * 
 * Key pattern: exec_cache:{customer_id}:{project_id}:{agent_id}:{config_version}:{input_hash}
 * 
 * Invalidation triggers:
 * - Project updated → delete exec_cache:{cid}:{pid}:*
 * - Agent config changed → new config_version = different key = auto-miss
 * - RAG index updated → bump rag_version in key (future)
 */

import { CacheService } from './cache.service.js';
import { sha256 } from './crypto.service.js';
import { Limits } from '@elon-tools/shared';
import { logger } from '../lib/logger.js';

// TTL by category (seconds)
const CATEGORY_TTL: Record<string, number> = {
  'dev-sistemas':      1800,  // 30min — results change less
  'captacao-cliente':   900,  // 15min
  'kpis':               300,  // 5min — data-driven, changes fast
  'financeiro':         600,  // 10min
  'ux-usabilidade':    1800,  // 30min
  'backlinks':         1800,  // 30min
  'vendas':             900,  // 15min
  'crm':                600,  // 10min
  'imagens':              0,  // No cache — creative, always different
  'videos':               0,  // No cache — creative
};
const DEFAULT_TTL = 900; // 15min

export class ExecutionCacheService {
  private cache: CacheService;

  constructor(kv: KVNamespace) {
    this.cache = new CacheService(kv);
  }

  /**
   * Build cache key.
   */
  private async buildKey(
    customerId: string,
    projectId: string,
    agentId: string,
    configVersion: number,
    input: Record<string, unknown>,
  ): Promise<string> {
    const inputHash = await sha256(JSON.stringify(input));
    return `exec_cache:${customerId}:${projectId}:${agentId}:v${configVersion}:${inputHash.slice(0, 16)}`;
  }

  /**
   * Try to get a cached response.
   */
  async get(
    customerId: string,
    projectId: string,
    agentId: string,
    configVersion: number,
    input: Record<string, unknown>,
  ): Promise<{ output: string; cached: true } | null> {
    const key = await this.buildKey(customerId, projectId, agentId, configVersion, input);
    const cached = await this.cache.get<{ output: string }>(key);
    
    if (cached?.output) {
      logger.info('Cache HIT', { agent_id: agentId, project_id: projectId });
      return { output: cached.output, cached: true };
    }

    return null;
  }

  /**
   * Store a response in cache.
   */
  async set(
    customerId: string,
    projectId: string,
    agentId: string,
    configVersion: number,
    input: Record<string, unknown>,
    output: string,
    categorySlug?: string,
  ): Promise<void> {
    const ttl = CATEGORY_TTL[categorySlug ?? ''] ?? DEFAULT_TTL;
    if (ttl === 0) return; // No cache for this category

    const key = await this.buildKey(customerId, projectId, agentId, configVersion, input);
    await this.cache.set(key, { output, cached_at: new Date().toISOString() }, ttl);

    logger.info('Cache SET', { agent_id: agentId, project_id: projectId, ttl });
  }

  /**
   * Invalidate all cache for a project (called when project is updated).
   */
  async invalidateProject(customerId: string, projectId: string): Promise<void> {
    // KV doesn't support prefix delete natively.
    // Strategy: we rely on config_version + input_hash making keys unique.
    // For project updates, we can't easily purge — but TTL handles staleness.
    // For explicit invalidation, we store a "version" key.
    const versionKey = `project_cache_version:${customerId}:${projectId}`;
    const current = await this.cache.get<number>(versionKey) ?? 0;
    await this.cache.set(versionKey, current + 1, 86400 * 30); // 30 days

    logger.info('Project cache invalidated', { customer_id: customerId, project_id: projectId });
  }

  /**
   * Get TTL for a category.
   */
  static getTtlForCategory(slug: string): number {
    return CATEGORY_TTL[slug] ?? DEFAULT_TTL;
  }
}
