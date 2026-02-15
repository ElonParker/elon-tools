-- ============================================================
-- ElonTools — Migration 0001: Initial Schema
-- D1 (SQLite) — Multi-tenant com customer_id/project_id
-- ============================================================

-- ============================================================
-- 1. CUSTOMERS
-- Conta principal. Tudo no sistema pertence a um customer.
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id              TEXT PRIMARY KEY,                          -- UUID
  email           TEXT NOT NULL UNIQUE,
  role            TEXT NOT NULL DEFAULT 'CUSTOMER'           -- 'CUSTOMER' | 'ADMIN'
                  CHECK (role IN ('CUSTOMER', 'ADMIN')),
  status          TEXT NOT NULL DEFAULT 'active'             -- 'active' | 'suspended' | 'deleted'
                  CHECK (status IN ('active', 'suspended', 'deleted')),
  name            TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_role ON customers(role);
CREATE INDEX idx_customers_status ON customers(status);

-- ============================================================
-- 2. SESSIONS (auth)
-- Sessão ativa do customer. Token hashado (SHA-256).
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,                          -- UUID
  customer_id     TEXT NOT NULL,
  token_hash      TEXT NOT NULL UNIQUE,                     -- SHA-256 do token real
  ip_address      TEXT,                                     -- Truncado em prod
  user_agent      TEXT,
  expires_at      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_customer_id ON sessions(customer_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================
-- 3. MAGIC_LINKS
-- Login passwordless. Token hashado, uso único, expira 15min.
-- ============================================================
CREATE TABLE IF NOT EXISTS magic_links (
  id              TEXT PRIMARY KEY,                          -- UUID
  email           TEXT NOT NULL,
  token_hash      TEXT NOT NULL UNIQUE,                     -- SHA-256 do token real
  used            INTEGER NOT NULL DEFAULT 0,               -- 0=false, 1=true
  expires_at      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_magic_links_token_hash ON magic_links(token_hash);
CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at);

-- ============================================================
-- 4. PROJECTS
-- Cada customer pode ter N projects (identificados por domínio).
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,                          -- UUID
  customer_id     TEXT NOT NULL,
  domain          TEXT NOT NULL,                             -- ex: "example.com"
  name            TEXT,                                     -- Nome amigável
  niche           TEXT,                                     -- Nicho do site
  favicon_url     TEXT,                                     -- URL do favicon (best-effort)
  metadata        TEXT DEFAULT '{}',                        -- JSON: dados extras coletados
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE (customer_id, domain)                              -- Domínio único POR customer
);

CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_domain ON projects(domain);

-- ============================================================
-- 5. CATEGORIES
-- As 10 categorias fixas (seed data). Não editáveis por customer.
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id              TEXT PRIMARY KEY,                          -- UUID
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  icon            TEXT,                                     -- Emoji ou icon key
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- ============================================================
-- 6. AGENTS
-- Catálogo de agentes. Criados pelo ADMIN.
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
  id                      TEXT PRIMARY KEY,                  -- UUID
  name                    TEXT NOT NULL,
  description             TEXT,
  category_id             TEXT NOT NULL,
  current_config_version  INTEGER NOT NULL DEFAULT 1,
  is_active               INTEGER NOT NULL DEFAULT 1,       -- 0=false, 1=true
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_agents_category_id ON agents(category_id);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- ============================================================
-- 7. AGENT_CONFIGS (versionadas)
-- Cada update gera nova versão. Nunca deletadas.
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_configs (
  id              TEXT PRIMARY KEY,                          -- UUID
  agent_id        TEXT NOT NULL,
  config_version  INTEGER NOT NULL,
  system_prompt   TEXT NOT NULL,                             -- Prompt de sistema
  templates       TEXT DEFAULT '{}',                        -- JSON: templates de prompt
  params          TEXT DEFAULT '{}',                        -- JSON: temperature, max_tokens, etc.
  tools_allowed   TEXT DEFAULT '[]',                        -- JSON: lista de tools
  policy          TEXT DEFAULT '{}',                        -- JSON: políticas (rate limit, etc.)
  input_schema    TEXT DEFAULT '{}',                        -- JSON: Zod-compatible schema definition
  created_by      TEXT,                                     -- customer_id do admin que criou
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES customers(id) ON DELETE SET NULL,
  UNIQUE (agent_id, config_version)
);

CREATE INDEX idx_agent_configs_agent_id ON agent_configs(agent_id);
CREATE INDEX idx_agent_configs_version ON agent_configs(agent_id, config_version);

-- ============================================================
-- 8. AGENT_EXECUTIONS
-- Histórico de execuções. SEMPRE filtrado por customer_id + project_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_executions (
  id                    TEXT PRIMARY KEY,                    -- UUID
  agent_id              TEXT NOT NULL,
  agent_config_version  INTEGER NOT NULL,                   -- Versão usada na execução
  customer_id           TEXT NOT NULL,
  project_id            TEXT NOT NULL,
  input                 TEXT NOT NULL,                       -- JSON: input do customer
  output                TEXT,                                -- Texto: resposta do LLM
  status                TEXT NOT NULL DEFAULT 'pending'      -- 'pending' | 'running' | 'done' | 'error'
                        CHECK (status IN ('pending', 'running', 'done', 'error')),
  error_message         TEXT,                                -- Se status=error
  tokens_input          INTEGER DEFAULT 0,                   -- Best-effort
  tokens_output         INTEGER DEFAULT 0,                   -- Best-effort
  duration_ms           INTEGER DEFAULT 0,
  has_embedding         INTEGER NOT NULL DEFAULT 0,          -- 0=false, 1=true
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Índices críticos para queries frequentes
CREATE INDEX idx_executions_customer_id ON agent_executions(customer_id);
CREATE INDEX idx_executions_project_id ON agent_executions(project_id);
CREATE INDEX idx_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX idx_executions_customer_project ON agent_executions(customer_id, project_id);
CREATE INDEX idx_executions_status ON agent_executions(status);
CREATE INDEX idx_executions_created_at ON agent_executions(created_at);
CREATE INDEX idx_executions_has_embedding ON agent_executions(has_embedding);

-- ============================================================
-- 9. CUSTOMER_INTEGRATIONS
-- Tokens/secrets de integrações externas por customer.
-- CRIPTOGRAFADO: AES-GCM com master key no Worker Secret.
-- Nunca plaintext!
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_integrations (
  id              TEXT PRIMARY KEY,                          -- UUID
  customer_id     TEXT NOT NULL,
  provider        TEXT NOT NULL,                             -- ex: 'mailchannels', 'custom_smtp'
  key_name        TEXT NOT NULL,                             -- ex: 'api_key', 'smtp_password'
  ciphertext      TEXT NOT NULL,                             -- Base64 do AES-GCM ciphertext
  iv              TEXT NOT NULL,                             -- Base64 do IV (12 bytes)
  tag             TEXT NOT NULL,                             -- Base64 do auth tag (16 bytes)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE (customer_id, provider, key_name)                  -- Um secret por provider+key por customer
);

CREATE INDEX idx_integrations_customer_id ON customer_integrations(customer_id);
CREATE INDEX idx_integrations_provider ON customer_integrations(customer_id, provider);

-- ============================================================
-- 10. SYSTEM_SETTINGS
-- Configurações globais e feature flags.
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key             TEXT PRIMARY KEY,                          -- ex: 'maintenance_mode', 'max_projects_per_customer'
  value           TEXT NOT NULL,                             -- JSON value
  description     TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 11. AUDIT_LOG
-- Log de ações importantes para auditoria.
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id              TEXT PRIMARY KEY,                          -- UUID
  customer_id     TEXT,                                     -- Quem fez (null = sistema)
  action          TEXT NOT NULL,                             -- ex: 'agent.execute', 'project.create', 'admin.agent.update'
  resource_type   TEXT NOT NULL,                             -- ex: 'project', 'agent', 'execution'
  resource_id     TEXT,                                     -- ID do recurso afetado
  details         TEXT DEFAULT '{}',                        -- JSON: dados adicionais (redacted)
  ip_address      TEXT,                                     -- Truncado
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_customer_id ON audit_log(customer_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);

-- ============================================================
-- SEED: Categorias (as 10 fixas)
-- ============================================================
INSERT OR IGNORE INTO categories (id, slug, name, description, icon, sort_order) VALUES
  ('cat-01', 'dev-sistemas',      'Desenvolvimento de Sistemas',    'Ferramentas de desenvolvimento, code review, arquitetura',          '💻', 1),
  ('cat-02', 'captacao-cliente',   'Captação de Cliente',            'Prospecção, lead generation, outreach, funil de aquisição',         '🎯', 2),
  ('cat-03', 'kpis',              'Monitoramento Principais KPIs',  'Dashboards, métricas-chave, alertas de performance',                '📊', 3),
  ('cat-04', 'financeiro',        'Financeiro',                     'ROI, fluxo de caixa, análise de custos, projeções',                 '💰', 4),
  ('cat-05', 'ux-usabilidade',    'Análise de UX / Usabilidade',    'Heurísticas, acessibilidade, testes de usabilidade, heatmaps',      '🎨', 5),
  ('cat-06', 'backlinks',         'Backlinks',                      'Análise de perfil, prospecção de links, outreach, monitoramento',    '🔗', 6),
  ('cat-07', 'vendas',            'Vendas',                         'Pipeline, conversão, scripts de venda, objeções',                   '💵', 7),
  ('cat-08', 'crm',               'CRM',                            'Gestão de contatos, follow-up, segmentação, automações',            '👥', 8),
  ('cat-09', 'imagens',           'Criação de Imagens',             'Geração de imagens, banners, thumbnails, assets visuais',           '🖼️', 9),
  ('cat-10', 'videos',            'Criação de Vídeos',              'Scripts de vídeo, hooks, thumbnails, edição, trending',             '🎥', 10);
