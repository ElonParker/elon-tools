# Etapa 5/9 — Auth Completo (concluída 2026-02-15)

## Status: ✅ CONCLUÍDO

## O que foi implementado

### Services
- `auth.service.ts` — Magic link (create/validate), customer (get/create), session (create/validate/destroy)
- `crypto.service.ts` — SHA-256 hash, token generation, AES-GCM encrypt/decrypt
- `turnstile.service.ts` — Server-side Turnstile verification
- `email.service.ts` — EmailProvider interface, MailChannelsProvider, HttpEmailProvider, magic link email template
- `cache.service.ts` — KV wrapper (get/set/delete)

### Handlers (auth.handler.ts — completo)
- `POST /api/v1/auth/magic-link` — Turnstile verify → generate token → send email
- `GET /api/v1/auth/verify?token=` — Validate magic link → get/create customer → create session → set cookie
- `GET /api/v1/auth/me` — Return authenticated user
- `POST /api/v1/auth/logout` — Destroy session, clear cookie

### Middleware (auth.ts — real implementation)
- Extract session cookie → hash → KV lookup (fast) → D1 fallback → inject AuthContext
- Dev mode: X-Debug-Auth header still works

### Session Strategy
- Cookie: `session=<token>; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=86400`
- Token hashed (SHA-256) before storage
- Stored in D1 (source of truth) + KV (cache, 24h TTL)
- Validate: KV first → D1 fallback → re-cache

### RBAC
- Already working from Etapa 4 middleware
- ADMIN routes protected via `rbac('ADMIN')` 
- CUSTOMER cannot access `/api/v1/admin/*`

## Secrets Necessários
| Secret | Uso |
|--------|-----|
| `TURNSTILE_SECRET_KEY` | Verificação server-side Turnstile |
| `MASTER_ENCRYPTION_KEY` | AES-GCM para secrets de customer integrations |
| `EMAIL_API_KEY` | Provider HTTP de email (se não usar MailChannels) |

## Migration D1
Nenhuma migration adicional necessária — schema da Etapa 3 já cobria sessions, magic_links, customers.

## Checklist de Testes (curl)

```bash
# BASE
API="http://localhost:8787/api/v1"

# 1. Request magic link
curl -s -X POST $API/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","turnstileToken":"test-token"}' | jq

# 2. Verify callback (precisa do token do email/DB)
curl -sv "$API/auth/verify?token=TOKEN_FROM_EMAIL" 2>&1 | grep -E 'Set-Cookie|{' 

# 3. Me (com cookie)
curl -s $API/auth/me -H "Cookie: session=TOKEN_FROM_VERIFY" | jq

# 4. Me (dev mode debug)
curl -s $API/auth/me -H "X-Debug-Auth: some-uuid:CUSTOMER" | jq

# 5. Logout
curl -s -X POST $API/auth/logout -H "Cookie: session=TOKEN" | jq

# 6. Admin route bloqueada para CUSTOMER
curl -s $API/admin/stats -H "X-Debug-Auth: some-uuid:CUSTOMER" | jq
# → 403 RBAC_ADMIN_ONLY

# 7. Admin route liberada para ADMIN
curl -s $API/admin/stats -H "X-Debug-Auth: some-uuid:ADMIN" | jq
# → 200 success
```
