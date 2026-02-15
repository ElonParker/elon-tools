/**
 * KV cache helpers — thin wrapper with typed keys.
 */

export class CacheService {
  constructor(private kv: KVNamespace) {}

  async get<T = string>(key: string): Promise<T | null> {
    const val = await this.kv.get(key);
    if (val === null) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.kv.put(key, serialized, { expirationTtl: ttlSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
