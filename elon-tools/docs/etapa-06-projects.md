# Etapa 6/9 — Projects CRUD + Auto-coleta Domínio (concluída 2026-02-15)

## Status: ✅ CONCLUÍDO

## Arquivos Criados/Atualizados

### Services
- `domain-collector.service.ts` — Coletor de metadados de domínio (best-effort)
- `project.service.ts` — CRUD de projects + refresh metadata

### Handler
- `project.handler.ts` — Endpoints completos (não mais stubs)

## Endpoints Implementados

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/projects` | Listar projects do customer (paginado) |
| POST | `/api/v1/projects` | Criar project + auto-coleta metadados |
| GET | `/api/v1/projects/:id` | Detalhes do project |
| PATCH | `/api/v1/projects/:id` | Editar project |
| DELETE | `/api/v1/projects/:id` | Deletar project |
| POST | `/api/v1/projects/:id/metadata/refresh` | Re-coletar metadados |

## Domain Collector — O que coleta

- `title` — da tag `<title>`
- `description` — meta description
- `og_title`, `og_description`, `og_image` — Open Graph
- `favicon_url` — `<link rel="icon">` ou `/favicon.ico` fallback
- `language` — atributo `lang` do `<html>`
- `robots` — conteúdo do robots.txt
- `sitemap_url` — extraído do robots.txt
- `social_links` — Facebook, Instagram, Twitter/X, LinkedIn, YouTube, TikTok
- `tech_hints` — WordPress, Shopify, React, Vue, Next.js, etc. (18 patterns)
- `status_code` — HTTP status
- `redirected_url` — se houve redirect
- `headers` — server, x-powered-by

## Segurança Anti-SSRF
- Validação de domínio via regex
- Bloqueio de IPs privados (127.x, 10.x, 172.16-31.x, 192.168.x, localhost, IPv6 private)
- Timeout: 8 segundos
- Max body: 512KB
- Fallback HTTPS → HTTP

## Casos de Erro
| Código | Status | Mensagem |
|--------|--------|----------|
| `VALIDATION_DOMAIN_INVALID` | 400 | Domínio inválido |
| `PROJECT_DOMAIN_EXISTS` | 409 | Domínio já cadastrado nesta conta |
| `PROJECT_NOT_FOUND` | 404 | Projeto não encontrado |

Erros de coleta são best-effort (salvos em `metadata.error`, não bloqueiam criação).

## Tabelas/Colunas
Nenhuma migration adicional — schema Etapa 3 já cobria `projects` com todos os campos.

## Testes (curl)

```bash
API="http://localhost:8787/api/v1"
AUTH="X-Debug-Auth: test-uuid:CUSTOMER"

# Criar project (auto-coleta metadados)
curl -s -X POST $API/projects \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"domain":"cloudflare.com","name":"Cloudflare"}' | jq

# Listar projects
curl -s "$API/projects?page=1&limit=10" -H "$AUTH" | jq

# Detalhes
curl -s $API/projects/PROJECT_ID -H "$AUTH" | jq

# Editar
curl -s -X PATCH $API/projects/PROJECT_ID \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"niche":"CDN/Security"}' | jq

# Refresh metadata
curl -s -X POST $API/projects/PROJECT_ID/metadata/refresh -H "$AUTH" | jq

# Deletar
curl -s -X DELETE $API/projects/PROJECT_ID -H "$AUTH" | jq
```
