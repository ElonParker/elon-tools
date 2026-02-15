# Etapa 3/9 — D1: SQL Migrations + Índices + Regras de Tenant

## Status: ✅ CONCLUÍDO

## Migration: `apps/api/migrations/0001_initial.sql`

---

## B) Explicação Tabela por Tabela

### 1. `customers`
Conta principal do sistema. Todo recurso tem um `customer_id` apontando aqui. O campo `role` define CUSTOMER ou ADMIN (RBAC). Status permite suspender/soft-delete sem apagar dados.

### 2. `sessions`
Sessões ativas. O `token_hash` é SHA-256 do token real enviado no cookie — nunca armazenamos o token em plaintext. Índice em `token_hash` para lookup rápido no middleware de auth. `expires_at` permite cleanup.

### 3. `magic_links`
Login passwordless. Token hashado, uso único (`used=1` após consumo), expira em 15min. Índice no `token_hash` para validação rápida no GET `/auth/verify`.

### 4. `projects`
Cada customer pode ter N projects. Identificado por `domain` (único POR customer via UNIQUE constraint). Metadados coletados best-effort (favicon, título, etc.) armazenados em JSON. É a entidade central de contexto — todo agente executa dentro de um project.

### 5. `categories`
As 10 categorias fixas, seed data. Não editáveis por customer. `slug` único para rotas amigáveis. `sort_order` para ordenação na UI.

### 6. `agents`
Catálogo de agentes criados pelo ADMIN. Cada agente pertence a uma categoria. `current_config_version` aponta para a versão ativa da configuração. `is_active` permite desativar sem deletar.

### 7. `agent_configs`
Versionamento de configs de agente. Cada update cria nova row (nunca edita anterior). Campos: system_prompt, templates, params (temperature, etc.), tools_allowed, policy, input_schema. UNIQUE em `(agent_id, config_version)` garante integridade.

### 8. `agent_executions`
Histórico completo de execuções. SEMPRE tem `customer_id` + `project_id` para isolamento multi-tenant. Grava versão do config usado, input, output, status, tokens (best-effort), duração. `has_embedding` marca se output foi vetorizado. Índice composto `(customer_id, project_id)` é o mais crítico.

### 9. `customer_integrations`
Tokens/secrets de terceiros por customer. **NUNCA plaintext!** Armazena `ciphertext` + `iv` + `tag` (AES-GCM). UNIQUE em `(customer_id, provider, key_name)` impede duplicatas. Decrypt só no momento de uso.

### 10. `system_settings`
Key-value global para configurações e feature flags. Ex: `maintenance_mode`, `max_projects_per_customer`, `signup_enabled`. Consultado raramente, cacheable em KV.

### 11. `audit_log`
Log de ações importantes: criação/edição/deleção de recursos, execuções, logins, ações admin. Dados redacted (sem tokens/secrets). Útil para compliance e debugging.

---

## C) Queries Críticas (Pseudo-SQL)

### 1. Listar projects do customer
```sql
SELECT id, domain, name, niche, favicon_url, metadata, created_at, updated_at
FROM projects
WHERE customer_id = :customer_id
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;

-- Count para paginação
SELECT COUNT(*) as total FROM projects WHERE customer_id = :customer_id;
```
**Índice usado:** `idx_projects_customer_id`

### 2. Validar magic link
```sql
SELECT id, email, used, expires_at
FROM magic_links
WHERE token_hash = :token_hash
  AND used = 0
  AND expires_at > datetime('now')
LIMIT 1;

-- Se válido, marcar como usado
UPDATE magic_links SET used = 1 WHERE id = :id;
```
**Índice usado:** `idx_magic_links_token_hash`

### 3. Validar sessão (middleware auth)
```sql
SELECT s.id, s.customer_id, s.expires_at, c.role, c.status
FROM sessions s
JOIN customers c ON c.id = s.customer_id
WHERE s.token_hash = :token_hash
  AND s.expires_at > datetime('now')
  AND c.status = 'active'
LIMIT 1;
```
**Índice usado:** `idx_sessions_token_hash`

### 4. Carregar agent config ativa
```sql
SELECT a.id, a.name, a.description, a.category_id, a.is_active,
       ac.config_version, ac.system_prompt, ac.templates, ac.params,
       ac.tools_allowed, ac.policy, ac.input_schema
FROM agents a
JOIN agent_configs ac ON ac.agent_id = a.id
  AND ac.config_version = a.current_config_version
WHERE a.id = :agent_id
  AND a.is_active = 1
LIMIT 1;
```
**Índice usado:** `idx_agent_configs_version` (agent_id, config_version)

### 5. Salvar execution + atualizar status
```sql
-- Criar execução (status=pending)
INSERT INTO agent_executions
  (id, agent_id, agent_config_version, customer_id, project_id, input, status, created_at, updated_at)
VALUES
  (:id, :agent_id, :config_version, :customer_id, :project_id, :input, 'pending', datetime('now'), datetime('now'));

-- Atualizar para running
UPDATE agent_executions
SET status = 'running', updated_at = datetime('now')
WHERE id = :id AND customer_id = :customer_id;

-- Completar (done)
UPDATE agent_executions
SET status = 'done',
    output = :output,
    tokens_input = :tokens_input,
    tokens_output = :tokens_output,
    duration_ms = :duration_ms,
    updated_at = datetime('now')
WHERE id = :id AND customer_id = :customer_id;

-- Erro
UPDATE agent_executions
SET status = 'error',
    error_message = :error_message,
    duration_ms = :duration_ms,
    updated_at = datetime('now')
WHERE id = :id AND customer_id = :customer_id;
```
**Índice usado:** PK (`id`) + `idx_executions_customer_id` para segurança

### 6. Listar execuções por project
```sql
SELECT e.id, e.agent_id, a.name as agent_name, e.status, e.tokens_input, e.tokens_output,
       e.duration_ms, e.created_at
FROM agent_executions e
JOIN agents a ON a.id = e.agent_id
WHERE e.customer_id = :customer_id
  AND e.project_id = :project_id
ORDER BY e.created_at DESC
LIMIT :limit OFFSET :offset;
```
**Índice usado:** `idx_executions_customer_project`

### 7. Salvar integração criptografada
```sql
-- Upsert (insert or replace por UNIQUE constraint)
INSERT INTO customer_integrations
  (id, customer_id, provider, key_name, ciphertext, iv, tag, created_at, updated_at)
VALUES
  (:id, :customer_id, :provider, :key_name, :ciphertext, :iv, :tag, datetime('now'), datetime('now'))
ON CONFLICT (customer_id, provider, key_name)
DO UPDATE SET
  ciphertext = excluded.ciphertext,
  iv = excluded.iv,
  tag = excluded.tag,
  updated_at = datetime('now');
```
**Índice usado:** UNIQUE constraint `(customer_id, provider, key_name)`

### 8. Ler integração (para decrypt no service)
```sql
SELECT id, ciphertext, iv, tag
FROM customer_integrations
WHERE customer_id = :customer_id
  AND provider = :provider
  AND key_name = :key_name
LIMIT 1;
```
**Índice usado:** `idx_integrations_provider`

### 9. Admin stats
```sql
SELECT
  (SELECT COUNT(*) FROM customers WHERE status = 'active') as total_customers,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM agent_executions) as total_executions,
  (SELECT COUNT(*) FROM agent_executions
   WHERE created_at >= date('now')) as executions_today;
```

### 10. Audit log insert
```sql
INSERT INTO audit_log
  (id, customer_id, action, resource_type, resource_id, details, ip_address, created_at)
VALUES
  (:id, :customer_id, :action, :resource_type, :resource_id, :details, :ip_truncated, datetime('now'));
```

---

## Regras de Tenant (Resumo)

| Regra | Implementação |
|-------|---------------|
| Customer só vê seus dados | WHERE customer_id = :session.customer_id em TODA query |
| Project pertence a customer | FK + UNIQUE(customer_id, domain) |
| Executions isoladas | WHERE customer_id AND project_id |
| Integrations isoladas | WHERE customer_id + UNIQUE constraint |
| Admin vê tudo | Sem filtro customer_id, ou com filtro opcional |
| Audit log | Registra customer_id de quem fez a ação |

## Índices — Resumo de Cobertura

| Endpoint | Query Pattern | Índice |
|----------|--------------|--------|
| Auth middleware | sessions.token_hash | `idx_sessions_token_hash` |
| Magic link verify | magic_links.token_hash | `idx_magic_links_token_hash` |
| List projects | projects.customer_id | `idx_projects_customer_id` |
| List agents by category | agents.category_id | `idx_agents_category_id` |
| Get agent config | agent_configs(agent_id, version) | `idx_agent_configs_version` |
| List executions | executions(customer_id, project_id) | `idx_executions_customer_project` |
| Audit trail | audit_log(customer_id), (action) | `idx_audit_customer_id`, `idx_audit_action` |
| Integrations | integrations(customer_id, provider) | `idx_integrations_provider` |
