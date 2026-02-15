/**
 * Integration service: encrypted storage + best-effort validation of third-party tokens.
 */

import { encrypt, decrypt } from './crypto.service.js';
import { logger } from '../lib/logger.js';

export interface IntegrationRecord {
  id: string;
  customer_id: string;
  provider: string;
  key_name: string;
  status: 'valid' | 'invalid' | 'unchecked';
  created_at: string;
  updated_at: string;
}

export const SUPPORTED_PROVIDERS = [
  'trello',
  'github',
  'cloudflare',
  'mailchannels',
  'custom_smtp',
  'sendgrid',
  'resend',
] as const;

export type Provider = (typeof SUPPORTED_PROVIDERS)[number];

export class IntegrationService {
  constructor(
    private db: D1Database,
    private masterKey: string,
  ) {}

  /**
   * Save an integration token (encrypted).
   */
  async save(
    customerId: string,
    provider: string,
    keyName: string,
    plaintext: string,
  ): Promise<IntegrationRecord> {
    const { ciphertext, iv, tag } = await encrypt(plaintext, this.masterKey);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO customer_integrations (id, customer_id, provider, key_name, ciphertext, iv, tag, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (customer_id, provider, key_name)
         DO UPDATE SET ciphertext = excluded.ciphertext, iv = excluded.iv, tag = excluded.tag, updated_at = excluded.updated_at`,
      )
      .bind(id, customerId, provider, keyName, ciphertext, iv, tag, now, now)
      .run();

    return {
      id,
      customer_id: customerId,
      provider,
      key_name: keyName,
      status: 'unchecked',
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Get decrypted token value.
   */
  async getDecrypted(customerId: string, provider: string, keyName: string): Promise<string | null> {
    const row = await this.db
      .prepare(
        `SELECT ciphertext, iv, tag FROM customer_integrations
         WHERE customer_id = ? AND provider = ? AND key_name = ? LIMIT 1`,
      )
      .bind(customerId, provider, keyName)
      .first<{ ciphertext: string; iv: string; tag: string }>();

    if (!row) return null;
    return decrypt(row.ciphertext, row.iv, row.tag, this.masterKey);
  }

  /**
   * List integrations for a customer (without secrets).
   */
  async listForCustomer(customerId: string): Promise<IntegrationRecord[]> {
    const rows = await this.db
      .prepare(
        `SELECT id, customer_id, provider, key_name, created_at, updated_at
         FROM customer_integrations WHERE customer_id = ? ORDER BY provider, key_name`,
      )
      .bind(customerId)
      .all<IntegrationRecord>();

    return (rows.results ?? []).map((r) => ({ ...r, status: 'unchecked' as const }));
  }

  /**
   * Delete an integration.
   */
  async delete(customerId: string, provider: string, keyName: string): Promise<void> {
    await this.db
      .prepare(
        `DELETE FROM customer_integrations WHERE customer_id = ? AND provider = ? AND key_name = ?`,
      )
      .bind(customerId, provider, keyName)
      .run();
  }

  /**
   * Validate an integration token (best-effort).
   * Returns { valid, message }.
   */
  async validate(
    provider: string,
    credentials: Record<string, string>,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      switch (provider) {
        case 'trello':
          return await validateTrello(credentials);
        case 'github':
          return await validateGitHub(credentials);
        case 'cloudflare':
          return await validateCloudflare(credentials);
        case 'sendgrid':
          return await validateSendGrid(credentials);
        case 'resend':
          return await validateResend(credentials);
        default:
          return { valid: true, message: 'Provider sem validação automática — salvo como unchecked' };
      }
    } catch (err) {
      logger.warn('Integration validation error', { provider, error: (err as Error).message });
      return { valid: false, message: `Erro ao validar: ${(err as Error).message}` };
    }
  }
}

// ── Provider Validators ──

async function validateTrello(creds: Record<string, string>): Promise<{ valid: boolean; message: string }> {
  const { api_key, token } = creds;
  if (!api_key || !token) return { valid: false, message: 'api_key e token são obrigatórios' };

  const res = await fetch(
    `https://api.trello.com/1/members/me?key=${api_key}&token=${token}`,
    { headers: { Accept: 'application/json' } },
  );

  if (res.ok) {
    const data = (await res.json()) as { username?: string };
    return { valid: true, message: `Conectado como ${data.username ?? 'unknown'}` };
  }
  return { valid: false, message: `Trello retornou ${res.status}` };
}

async function validateGitHub(creds: Record<string, string>): Promise<{ valid: boolean; message: string }> {
  const { token } = creds;
  if (!token) return { valid: false, message: 'token é obrigatório' };

  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'ElonTools/1.0' },
  });

  if (res.ok) {
    const data = (await res.json()) as { login?: string };
    return { valid: true, message: `Conectado como ${data.login ?? 'unknown'}` };
  }
  return { valid: false, message: `GitHub retornou ${res.status}` };
}

async function validateCloudflare(creds: Record<string, string>): Promise<{ valid: boolean; message: string }> {
  const { api_token } = creds;
  if (!api_token) return { valid: false, message: 'api_token é obrigatório' };

  const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
    headers: { Authorization: `Bearer ${api_token}` },
  });

  if (res.ok) {
    const data = (await res.json()) as { success: boolean; result?: { status: string } };
    if (data.success && data.result?.status === 'active') {
      return { valid: true, message: 'Token Cloudflare ativo' };
    }
  }
  return { valid: false, message: `Cloudflare retornou ${res.status}` };
}

async function validateSendGrid(creds: Record<string, string>): Promise<{ valid: boolean; message: string }> {
  const { api_key } = creds;
  if (!api_key) return { valid: false, message: 'api_key é obrigatório' };

  const res = await fetch('https://api.sendgrid.com/v3/user/profile', {
    headers: { Authorization: `Bearer ${api_key}` },
  });

  return res.ok
    ? { valid: true, message: 'SendGrid API key válida' }
    : { valid: false, message: `SendGrid retornou ${res.status}` };
}

async function validateResend(creds: Record<string, string>): Promise<{ valid: boolean; message: string }> {
  const { api_key } = creds;
  if (!api_key) return { valid: false, message: 'api_key é obrigatório' };

  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${api_key}` },
  });

  return res.ok
    ? { valid: true, message: 'Resend API key válida' }
    : { valid: false, message: `Resend retornou ${res.status}` };
}
