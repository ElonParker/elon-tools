# Etapa 10/10 — Frontend SPA (Cloudflare Pages) (concluída 2026-02-15)

## Status: ✅ CONCLUÍDO

## Stack Frontend
- **Preact** (~3KB) + Preact Signals (state) + Preact Router
- **Vite** (build + dev server com proxy para Worker)
- **CSS puro** com variáveis (dark theme, responsive)
- Zero libs pesadas

## Páginas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/login` | LoginPage | Email + Turnstile + magic link |
| `/auth/callback` | AuthCallbackPage | Consome token, redireciona |
| `/` | HubPage | Hub de 10 categorias com contagem de agentes |
| `/projects` | ProjectsPage | CRUD projetos (cards, modal criar, deletar) |
| `/categories/:slug` | CategoryPage | Lista agentes da categoria |
| `/agents/:id` | AgentViewPage | Form dinâmico + execução SSE streaming + export |
| `/history` | HistoryPage | Tabela execuções com paginação + modal detalhe |
| `/admin` | AdminPage | Tabs: stats, agentes CRUD, settings, integrações, customers |

## Componentes

| Componente | Descrição |
|-----------|-----------|
| Sidebar | Menu lateral com project switcher, categorias, admin |
| ProjectSwitcher | Select com projeto ativo (persiste localStorage) |
| ProjectContext | Badge com domínio/nome/nicho/favicon |
| StreamingOutput | Output com cursor de streaming animado |
| ErrorBoundary | Captura erros de render |
| Loading | Spinner + texto |

## UX Obrigatória ✅
- [x] Sem project → força ir em `/projects` (Hub redireciona)
- [x] Project switcher sempre visível na sidebar
- [x] Contexto do project em todas as páginas de categorias/agentes
- [x] Loading em todas as operações async
- [x] Error banner em todas as falhas
- [x] Streaming output com cursor animado
- [x] Export em MD/JSON/CSV

## API Client
- Fetch wrapper com `credentials: 'include'`
- Auto-redirect para `/login` em 401
- Retry com backoff em 429
- `streamApi()` para SSE consumption
- Nenhum secret no frontend

## Deploy

### Worker (API)
```bash
cd apps/api

# 1. Criar recursos Cloudflare
wrangler d1 create elon-tools-db
wrangler kv namespace create elon-tools-kv
# Atualizar IDs no wrangler.toml

# 2. Criar Vectorize index
wrangler vectorize create elon-tools-vectors --dimensions=768 --metric=cosine

# 3. Aplicar migrations
wrangler d1 migrations apply elon-tools-db --remote

# 4. Configurar secrets
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put MASTER_ENCRYPTION_KEY
wrangler secret put EMAIL_API_KEY

# 5. Deploy
wrangler deploy
```

### Frontend (Pages)
```bash
cd apps/web

# 1. Build
npm run build

# 2. Deploy via Pages
wrangler pages deploy dist --project-name=elon-tools

# Ou: conectar repo GitHub no Cloudflare Pages dashboard
# Build command: cd apps/web && npm run build
# Build output: apps/web/dist
```

### Variáveis de Ambiente (Pages)
- `VITE_API_URL` → não necessário (usa proxy `/api` em dev, mesmo domínio em prod)
- Turnstile site key → hardcoded no HTML (público)

## Checklist E2E

```
1. ✅ Acessar /login → ver form email + Turnstile
2. ✅ Enviar email → ver tela "Verifique seu email"
3. ✅ Clicar magic link → /auth/callback → redirect para /
4. ✅ Sem projetos → forçar ir em /projects
5. ✅ Criar projeto → ver card com metadados coletados
6. ✅ Hub → ver 10 categorias com contagem
7. ✅ Clicar categoria → ver agentes
8. ✅ Clicar agente → ver form dinâmico
9. ✅ Executar agente → ver streaming output
10. ✅ Export MD/JSON/CSV → download funciona
11. ✅ /history → ver tabela com execuções
12. ✅ /admin → criar agente → aparece pro customer
13. ✅ /admin → ver stats/settings/integrations/customers
14. ✅ Logout → volta pro login
15. ✅ Responsive (mobile)
```
