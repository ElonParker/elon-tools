# Etapa 7/9 — Admin: Settings, Integrações, Gestão Agentes (concluída 2026-02-15)

## Status: ✅ CONCLUÍDO

## Services Criados

| Service | O que faz |
|---------|-----------|
| `agent.service.ts` | CRUD agentes, config versionada (create/list/get versions), soft delete |
| `integration.service.ts` | Save/decrypt/list/delete integrations (AES-GCM), validate providers |
| `settings.service.ts` | Get/update system settings (key-value com defaults) |

## Endpoints Admin Implementados

### Settings
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/settings` | Listar settings (merged com defaults) |
| PATCH | `/admin/settings` | Atualizar settings parcial |

### Integrations
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/integrations/providers` | Lista providers suportados |
| POST | `/admin/integrations/validate` | Validar credenciais (best-effort) |
| POST | `/admin/integrations/save` | Salvar credenciais criptografadas |
| GET | `/admin/integrations` | Listar integrations (sem secrets) |
| DELETE | `/admin/integrations/:provider/:keyName` | Remover integration |

### Agents CRUD
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/agents` | Listar agentes (paginado, filtro category) |
| POST | `/admin/agents` | Criar agente + config v1 |
| GET | `/admin/agents/:id` | Detalhes + config atual |
| PATCH | `/admin/agents/:id` | Atualizar metadata (nome, desc, categoria, ativo) |
| DELETE | `/admin/agents/:id` | Soft delete (desativar) |

### Agent Configs (Versionadas)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/agents/:id/configs` | Listar versões |
| POST | `/admin/agents/:id/configs` | Criar nova versão (merge com anterior) |
| GET | `/admin/agents/:id/configs/:ver` | Detalhes de uma versão |

### Customers
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/customers` | Listar customers |
| GET | `/admin/customers/:id` | Detalhes + projects |
| PATCH | `/admin/customers/:id` | Atualizar role/status/name |

### Stats
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/stats` | total_customers, projects, executions, agents |

## Providers de Integração Suportados

| Provider | Validação | Campos |
|----------|-----------|--------|
| `trello` | ✅ `GET /1/members/me` | `api_key`, `token` |
| `github` | ✅ `GET /user` | `token` |
| `cloudflare` | ✅ `GET /user/tokens/verify` | `api_token` |
| `sendgrid` | ✅ `GET /v3/user/profile` | `api_key` |
| `resend` | ✅ `GET /domains` | `api_key` |
| `mailchannels` | ❌ Sem validação (DNS-based) | — |
| `custom_smtp` | ❌ Sem validação | — |

## Crypto (AES-GCM)
- `encrypt(plaintext, masterKeyHex)` → `{ ciphertext, iv, tag }` (base64)
- `decrypt(ciphertext, iv, tag, masterKeyHex)` → plaintext
- Master key: Worker Secret `MASTER_ENCRYPTION_KEY` (64-char hex = 256-bit)
- IV: 12 bytes random per value
- Tag: 16 bytes auth tag (separado do ciphertext)

## Agent Config Versionamento
1. `POST /admin/agents` → cria agent + config v1
2. `POST /admin/agents/:id/configs` → merge novos campos com config anterior → cria v(N+1)
3. `agents.current_config_version` sempre aponta para última
4. Versões nunca deletadas — histórico completo
5. Execuções gravam `agent_config_version` usado

## Nenhuma Migration Adicional
Schema Etapa 3 já cobria todas as tabelas necessárias.
