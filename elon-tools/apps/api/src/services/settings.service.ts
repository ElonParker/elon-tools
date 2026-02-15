/**
 * System settings service: key-value store for global config & feature flags.
 */

export interface SystemSetting {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

const DEFAULT_SETTINGS: Record<string, { value: unknown; description: string }> = {
  maintenance_mode: { value: false, description: 'Modo manutenção (bloqueia acesso customer)' },
  signup_enabled: { value: true, description: 'Permitir novos cadastros' },
  max_projects_per_customer: { value: 10, description: 'Limite de projetos por customer' },
  max_executions_per_day: { value: 100, description: 'Limite de execuções por customer/dia' },
  branding_name: { value: 'ElonTools', description: 'Nome exibido no sistema' },
  branding_logo_url: { value: null, description: 'URL do logo' },
  branding_primary_color: { value: '#2563eb', description: 'Cor primária da UI' },
};

export class SettingsService {
  constructor(private db: D1Database) {}

  /**
   * Get all settings (merged with defaults).
   */
  async getAll(): Promise<Record<string, SystemSetting>> {
    const rows = await this.db
      .prepare(`SELECT key, value, description, updated_at FROM system_settings`)
      .all<{ key: string; value: string; description: string | null; updated_at: string }>();

    const result: Record<string, SystemSetting> = {};

    // Start with defaults
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      result[key] = {
        key,
        value: def.value,
        description: def.description,
        updated_at: new Date().toISOString(),
      };
    }

    // Override with DB values
    for (const row of rows.results ?? []) {
      result[row.key] = {
        key: row.key,
        value: safeJsonParse(row.value),
        description: row.description,
        updated_at: row.updated_at,
      };
    }

    return result;
  }

  /**
   * Get a single setting.
   */
  async get(key: string): Promise<unknown> {
    const row = await this.db
      .prepare(`SELECT value FROM system_settings WHERE key = ?`)
      .bind(key)
      .first<{ value: string }>();

    if (row) return safeJsonParse(row.value);
    return DEFAULT_SETTINGS[key]?.value ?? null;
  }

  /**
   * Update settings (partial — only update provided keys).
   */
  async update(settings: Record<string, unknown>): Promise<Record<string, SystemSetting>> {
    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(settings)) {
      const serialized = JSON.stringify(value);
      const description = DEFAULT_SETTINGS[key]?.description ?? null;

      await this.db
        .prepare(
          `INSERT INTO system_settings (key, value, description, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        )
        .bind(key, serialized, description, now)
        .run();
    }

    return this.getAll();
  }
}

function safeJsonParse(val: string): unknown {
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}
