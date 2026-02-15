# 📚 Documentação — ElonTools

## 🎯 Começar Aqui

📖 **[DOCUMENTAÇÃO COMPLETA](./DOCUMENTACAO-COMPLETA.md)** — Guia definitivo do projeto (3000+ linhas, 95KB)

---

## 📋 Documentos por Etapa

### 🏗️ Arquitetura & Planejamento
- **[Etapa 1 — Arquitetura & Contratos](./etapa-01-arquitetura.md)**
  - Diagrama de arquitetura
  - API contracts
  - Modelo de dados (11 tabelas)
  - RAG strategy
  - Segurança (15 itens)

### 📦 Estrutura do Projeto
- **[Etapa 2 — Estrutura do Repositório](./etapa-02-estrutura.md)**
  - File tree (monorepo)
  - Config keys
  - Error codes enum
  - Logging patterns
  - Deploy strategy

### 💾 Database
- **[Etapa 3 — D1 SQL Migrations](./etapa-03-modelo-dados.md)**
  - 11 tabelas criadas
  - 20+ índices
  - Seed data (10 categorias)
  - Queries críticas
  - Multi-tenant rules

### 🔌 API Foundation
- **[Etapa 4 — Worker API Skeleton](./etapa-04-worker-skeleton.md)**
  - Hono v4 router
  - 6 middlewares
  - 5 handler groups
  - Shared package
  - Services roadmap

### 🔐 Autenticação
- **[Etapa 5 — Auth Completo](./etapa-05-auth.md)**
  - Magic link flow
  - Turnstile integration
  - Session strategy
  - KV → D1 fallback
  - RBAC implementation

### 🌐 Projects Management
- **[Etapa 6 — Projects CRUD + Domain Collector](./etapa-06-projects.md)**
  - CRUD endpoints
  - Domain collector (anti-SSRF)
  - 18 tech patterns
  - Social links parser
  - Metadata collection

### ⚙️ Admin Panel
- **[Etapa 7 — Admin (Agents, Integrações, Settings)](./etapa-07-admin.md)**
  - Agent CRUD
  - Config versionamento
  - Integration crypto (AES-GCM)
  - 7 providers suportados
  - Settings key-value

### 🤖 Agent Execution
- **[Etapa 8 — Agent Execution + Workers AI + Streaming](./etapa-08-execucao.md)**
  - Llama 3 8B integration
  - Non-streaming execute
  - Streaming SSE
  - Prompt builder (injeção de contexto)
  - Execution lifecycle

### 🔍 RAG & Vectorize
- **[Etapa 9 — RAG + Vectorize + Cache Inteligente](./etapa-09-rag-cache.md)**
  - Embeddings & chunking
  - Vectorize search
  - Tenant isolation
  - PII redaction
  - TTL por categoria

### 🎨 Frontend SPA
- **[Etapa 10 — Frontend SPA (Preact + Vite + Pages)](./etapa-10-frontend.md)**
  - 8 páginas
  - 10+ componentes
  - Signals (estado global)
  - Streaming SSE consumption
  - Export (MD, JSON, CSV)

---

## 🚀 Guias Rápidos

### Deploy em Produção
```bash
# 1. Setup Cloudflare
wrangler d1 create elon-tools-db
wrangler kv namespace create elon-tools-kv
wrangler vectorize create elon-tools-vectors

# 2. Configurar secrets
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put MASTER_ENCRYPTION_KEY
wrangler secret put EMAIL_API_KEY

# 3. Deploy API
cd apps/api
npm run db:migrate:remote
npm run deploy:prod

# 4. Deploy Frontend
cd apps/web
npm run build
wrangler pages deploy dist --project-name=elon-tools
```

### Testar Localmente
```bash
# Terminal 1: API
cd apps/api
npm run dev
# localhost:8787/api

# Terminal 2: Frontend
cd apps/web
npm run dev
# localhost:5173
```

### Debug
```bash
# Ver logs do Worker
wrangler tail

# Testar magic link
curl -X POST http://localhost:8787/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","turnstileToken":"test"}'

# Testar com X-Debug-Auth (dev mode)
curl http://localhost:8787/api/v1/auth/me \
  -H "X-Debug-Auth: uuid:CUSTOMER"
```

---

## 📊 Arquitetura em 30 Segundos

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Preact SPA)                              │
│  → Cloudflare Pages (elontools.com)                 │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────────────────┐
│  API (Hono + Workers)                               │
│  → Cloudflare Workers (api.elontools.com)           │
│  → D1 (SQLite), KV (Cache), Vectorize, Workers AI   │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 Segurança

- **Auth:** Magic Link + Turnstile + Session Cookie (KV + D1)
- **Crypto:** AES-256-GCM (integrations), SHA-256 (tokens)
- **RBAC:** CUSTOMER / ADMIN
- **Multi-tenant:** Toda query filtra `customer_id`
- **Rate Limit:** KV-based per IP+endpoint
- **Headers:** nosniff, DENY frame, strict referrer

---

## 📈 API Stats

- **40+ Endpoints** (auth, projects, agents, admin)
- **6 Middlewares** (request-id, CORS, rate-limit, auth, RBAC, validate)
- **10+ Services** (auth, crypto, ai, execution, rag, etc)
- **11 Tabelas DB** com 20+ índices
- **100% TypeScript** com Zod validation

---

## 🐛 Problemas & Soluções

Todos os bugs encontrados durante desenvolvimento estão documentados em [DOCUMENTACAO-COMPLETA.md](./DOCUMENTACAO-COMPLETA.md#13-problemas-encontrados--soluções):

- Turnstile CORS issues
- wrangler d1 auth
- KV cache invalidation
- D1 500 errors
- Workers AI rate limits
- Multi-tenant data leaks

---

## 📞 Support

- **GitHub Issues:** https://github.com/ElonParker/elon-tools/issues
- **Docs Completa:** [DOCUMENTACAO-COMPLETA.md](./DOCUMENTACAO-COMPLETA.md)
- **Memory Project:** `/data/.openclaw/workspace/memory/topics/elon-tools-projeto.md`

---

**Documentação Atualizada: 2026-02-15**  
**Versão: 0.1.0**  
**Status: 10/10 Etapas Concluídas ✅**
