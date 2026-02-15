# Etapa 4/9 — Worker API Skeleton (concluída 2026-02-15)

## Status: ✅ CONCLUÍDO

## Router: Hono v4
**Justificativa:** Leve (~14KB), feito para Cloudflare Workers, TypeScript-first, middleware chain nativo, tipagem de bindings. Mais maduro que itty-router, muito mais simples que fetch puro.

## Arquivos Criados

### Root
- `package.json` — monorepo npm workspaces
- `tsconfig.base.json` — config TS base
- `.gitignore`, `.nvmrc`

### packages/shared/
- `src/types/` — api, customer, project, agent, category, auth
- `src/schemas/` — auth, project, agent, execution, common (Zod)
- `src/constants/` — categories (10 fixas), errors (enum), limits (TTL, rate limits)

### apps/api/
- `wrangler.toml` — bindings D1, KV, Vectorize, AI + env prod
- `src/index.ts` — entry point com global middlewares + error handler
- `src/router.ts` — mount route groups
- `src/bindings.ts` — Env type + AuthContext
- `src/middleware/` — requestId, CORS, rateLimit, auth (stub), RBAC, validate (Zod)
- `src/handlers/` — auth, project, category, agent, admin (stubs retornando mock data)
- `src/lib/` — errors (AppError), response (success/error), logger (structured + redaction), prompt (placeholder)
- `src/services/index.ts` — roadmap dos services por etapa

## Middlewares Implementados
1. **requestId** — UUID por request, header X-Request-Id
2. **CORS** — origin do frontend, credentials, cache preflight
3. **Security headers** — nosniff, DENY frame, strict referrer
4. **Rate limit** — KV-based, por IP + endpoint
5. **Auth** — stub com X-Debug-Auth header para dev
6. **RBAC** — gate por role (CUSTOMER/ADMIN)
7. **Validate** — Zod body + query
8. **Error handler** — AppError → JSON padronizado, stack só em dev
