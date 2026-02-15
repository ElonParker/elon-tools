/**
 * Auth service: magic link generation, session management.
 */

import { sha256, generateToken } from './crypto.service.js';
import { CacheService } from './cache.service.js';
import { Limits } from '@elon-tools/shared';
import type { SessionPayload } from '@elon-tools/shared';

export class AuthService {
  private cache: CacheService;

  constructor(
    private db: D1Database,
    kv: KVNamespace,
  ) {
    this.cache = new CacheService(kv);
  }

  // ── Magic Link ──

  /**
   * Create a magic link token, store hash in D1.
   * Returns the raw token (to be sent via email).
   */
  async createMagicLink(email: string): Promise<string> {
    const token = generateToken(32);
    const tokenHash = await sha256(token);
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + Limits.MAGIC_LINK_TTL_SECONDS * 1000).toISOString();

    await this.db
      .prepare(
        `INSERT INTO magic_links (id, email, token_hash, used, expires_at) 
         VALUES (?, ?, ?, 0, ?)`,
      )
      .bind(id, email.toLowerCase().trim(), tokenHash, expiresAt)
      .run();

    return token;
  }

  /**
   * Validate magic link token. Returns email if valid, null otherwise.
   * Marks as used atomically.
   */
  async validateMagicLink(token: string): Promise<string | null> {
    const tokenHash = await sha256(token);

    const row = await this.db
      .prepare(
        `SELECT id, email FROM magic_links 
         WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')
         LIMIT 1`,
      )
      .bind(tokenHash)
      .first<{ id: string; email: string }>();

    if (!row) return null;

    // Mark as used
    await this.db.prepare(`UPDATE magic_links SET used = 1 WHERE id = ?`).bind(row.id).run();

    return row.email;
  }

  // ── Customer (get or create) ──

  /**
   * Find customer by email, or create a new one with role=CUSTOMER.
   */
  async getOrCreateCustomer(email: string): Promise<{ id: string; role: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Try to find existing
    const existing = await this.db
      .prepare(`SELECT id, role, status FROM customers WHERE email = ? LIMIT 1`)
      .bind(normalizedEmail)
      .first<{ id: string; role: string; status: string }>();

    if (existing) {
      if (existing.status !== 'active') {
        throw new Error('ACCOUNT_SUSPENDED');
      }
      return { id: existing.id, role: existing.role };
    }

    // Create new customer
    const id = crypto.randomUUID();
    await this.db
      .prepare(
        `INSERT INTO customers (id, email, role, status) VALUES (?, ?, 'CUSTOMER', 'active')`,
      )
      .bind(id, normalizedEmail)
      .run();

    return { id, role: 'CUSTOMER' };
  }

  // ── Sessions ──

  /**
   * Create a session. Returns the raw token (for the cookie).
   */
  async createSession(customerId: string, role: string, ip?: string, userAgent?: string): Promise<string> {
    const token = generateToken(48);
    const tokenHash = await sha256(token);
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + Limits.SESSION_TTL_SECONDS * 1000).toISOString();

    // Store in D1
    await this.db
      .prepare(
        `INSERT INTO sessions (id, customer_id, token_hash, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, customerId, tokenHash, ip ?? null, userAgent ?? null, expiresAt)
      .run();

    // Cache in KV for fast lookups
    const payload: SessionPayload = {
      customer_id: customerId,
      role: role as 'CUSTOMER' | 'ADMIN',
      expires_at: expiresAt,
    };
    await this.cache.set(`session:${tokenHash}`, payload, Limits.KV_TTL_SESSION);

    return token;
  }

  /**
   * Validate session token. Returns session payload if valid.
   * Checks KV first, then D1 fallback.
   */
  async validateSession(token: string): Promise<SessionPayload | null> {
    const tokenHash = await sha256(token);

    // Try KV cache first
    const cached = await this.cache.get<SessionPayload>(`session:${tokenHash}`);
    if (cached) {
      if (new Date(cached.expires_at) <= new Date()) {
        // Expired — clean up
        await this.cache.delete(`session:${tokenHash}`);
        return null;
      }
      return cached;
    }

    // D1 fallback
    const row = await this.db
      .prepare(
        `SELECT s.customer_id, c.role, s.expires_at
         FROM sessions s
         JOIN customers c ON c.id = s.customer_id
         WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND c.status = 'active'
         LIMIT 1`,
      )
      .bind(tokenHash)
      .first<{ customer_id: string; role: string; expires_at: string }>();

    if (!row) return null;

    // Re-cache
    const payload: SessionPayload = {
      customer_id: row.customer_id,
      role: row.role as 'CUSTOMER' | 'ADMIN',
      expires_at: row.expires_at,
    };
    await this.cache.set(`session:${tokenHash}`, payload, Limits.KV_TTL_SESSION);

    return payload;
  }

  /**
   * Invalidate session (logout).
   */
  async destroySession(token: string): Promise<void> {
    const tokenHash = await sha256(token);

    // Remove from D1
    await this.db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();

    // Remove from KV
    await this.cache.delete(`session:${tokenHash}`);
  }

  /**
   * Get customer by ID.
   */
  async getCustomerById(id: string): Promise<{
    id: string;
    email: string;
    role: string;
    name: string | null;
    created_at: string;
  } | null> {
    return this.db
      .prepare(`SELECT id, email, role, name, created_at FROM customers WHERE id = ? AND status = 'active' LIMIT 1`)
      .bind(id)
      .first();
  }
}
