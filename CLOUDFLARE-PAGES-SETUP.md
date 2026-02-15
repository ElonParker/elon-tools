# ☁️ CONFIGURAÇÃO CLOUDFLARE PAGES + WORKERS — Next.js 15

**Data:** 2026-02-15  
**Status:** 🔄 EM PROGRESSO  
**Stack:** Next.js 15 + Cloudflare Pages + Cloudflare Workers

---

## 🎯 OBJETIVO

Rodar sistema **100% no Cloudflare** com:
- ✅ APIs dinâmicas (`/api/auth/login`, `/api/auth/register`)
- ✅ Dashboard protegido (`/dashboard`)
- ✅ Pages estáticas (homepage, login, register)
- ✅ Sem servidor Node.js externo

---

## ❌ PROBLEMA INICIAL

```javascript
// next.config.js anterior:
output: 'export'  // ← BLOQUEIA APIs dinâmicas!
```

**Resultado:** HTTP 500 no Cloudflare Pages (não consegue rodar código Server-side)

---

## ✅ SOLUÇÃO

Usar **@cloudflare/next-on-pages** — adapter oficial Cloudflare para Next.js.

---

## 📋 O QUE FOI FEITO

### 1️⃣ Modificar `package.json`

**Adicionado:**
```json
{
  "devDependencies": {
    "@cloudflare/next-on-pages": "^1.4.0",
    "wrangler": "^3.26.0"
  },
  "scripts": {
    "build": "next build && npx @cloudflare/next-on-pages",
    "deploy": "wrangler deploy"
  }
}
```

**O que faz:**
- `@cloudflare/next-on-pages`: Converte build Next.js para rodar em Cloudflare Workers
- `wrangler`: CLI para gerenciar Cloudflare Workers/Pages
- Build script: Executa Next.js build + adapter Cloudflare

---

### 2️⃣ Modificar `next.config.js`

**Antes:**
```javascript
output: 'export'  // ← Estático (sem APIs)
```

**Depois:**
```javascript
// Removido output: 'export'
// Agora usa padrão Node.js (pode rodar APIs)
```

**Por quê:**
- `output: 'export'` = site estático (HTML/CSS/JS)
- Sem `output: 'export'` = pode rodar server-side (APIs)
- Cloudflare Workers executa Node.js, então funciona!

---

### 3️⃣ Criar `wrangler.toml`

```toml
name = "elon-parker-auth"
type = "javascript"
compatibility_date = "2024-09-23"

[build]
command = "npm install && npm run build"
upload = { directory = ".next" }
node_compat = true
```

**O que configura:**
- Nome do projeto no Cloudflare
- Comando de build
- Pasta de output (`.next`)
- Node.js compatibility (precisa pra rodar Next.js)

---

### 4️⃣ Criar `_routes.json`

```json
{
  "version": 1,
  "include": [
    "/api/*",           // ← APIs dinâmicas
    "/dashboard",       // ← Páginas dinâmicas
    "/dashboard/*"
  ],
  "exclude": [
    "*.png", "*.jpg",   // ← Estáticos (servir como CDN)
    "*.css", "*.js"
  ]
}
```

**O que faz:**
- Define quais rotas são **dinâmicas** (rodam em Workers)
- Define quais são **estáticas** (servidas por CDN)

---

### 5️⃣ Adicionar `.nxrc.json`

Configuração para @cloudflare/next-on-pages:
```json
{
  "configVersion": 1,
  "buildCommand": "npm run build",
  "outputDirectory": ".next/server"
}
```

---

## 🛠️ PROCESSO DE BUILD

Quando você roda `npm run build`:

```
1. npm run build
   ↓
2. next build (compila React/Next.js)
   ↓
3. @cloudflare/next-on-pages (converte para Workers)
   ↓
4. Gera pasta .next/ (pronta para Cloudflare)
   ↓
5. Arquivo .next/server/entry.js roda em Workers
   ↓
6. APIs funcionam 100%
```

---

## 🚀 PRÓXIMAS ETAPAS

### 1. Instalar dependências

```bash
cd /data/.openclaw/workspace/elon-system-dev/sistema-elon-parker
npm install
```

### 2. Build local para testar

```bash
npm run build
```

✅ Se der erro, fixamos  
✅ Se suceder, vamos para produção

### 3. Push no GitHub

```bash
git add .
git commit -m "feat: Cloudflare Pages + Workers setup"
git push origin master
```

### 4. Configurar Cloudflare Pages

**Dashboard Cloudflare:**
1. Pages → elon-system
2. Aba "Deployments"
3. Clique no deployment falho
4. Clique "Redeploy"

**Cloudflare vai:**
- ✅ Rodar `npm run build` automaticamente
- ✅ Usar o adapter @cloudflare/next-on-pages
- ✅ Deployar no Workers runtime
- ✅ APIs funcionam!

---

## 📊 ARQUITETURA FINAL

```
┌─────────────────────────────────────────────────────┐
│            CLOUDFLARE PAGES (CDN Global)            │
│  ┌───────────────────────────────────────────────┐  │
│  │        Cloudflare Workers Runtime              │  │
│  │                                               │  │
│  │  next/server/entry.js (Next.js Server)       │  │
│  │  ├─ /api/auth/login   → dinamicamente       │  │
│  │  ├─ /api/auth/register → dinamicamente      │  │
│  │  ├─ /dashboard → dinamicamente              │  │
│  │  └─ / → pages estáticas (SSG)              │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  localStorage (no Browser do usuário)              │
│  └─ JWT token armazenado                          │
└─────────────────────────────────────────────────────┘
```

---

## ✅ VANTAGENS 100% CLOUDFLARE

| Aspecto | Vantagem |
|--------|----------|
| **Servidores** | Global (< 50ms latência) |
| **Escalabilidade** | Automática (serverless) |
| **Segurança** | Cloudflare DDoS protection |
| **Custo** | Free tier generoso |
| **APIs** | Funcionam no Workers |
| **Banco de Dados** | Cloudflare D1 (SQLite) ou KV |

---

## 🐛 Troubleshooting

### Build falha

```bash
# Limpar cache
rm -rf .next node_modules
npm install
npm run build
```

### APIs não funcionam

Verificar:
1. `_routes.json` tem `/api/*`?
2. `wrangler.toml` tem `node_compat = true`?
3. `package.json` tem build script correto?

### Deploy falha no Cloudflare

1. Acessar: https://dash.cloudflare.com/pages
2. Clicar no projeto `elon-system`
3. Aba "Deployments"
4. Clicar "View details" no deployment falho
5. Ler logs (mostra o erro exato)

---

## 📚 REFERÊNCIAS

- [Cloudflare Next.js Adapter](https://github.com/cloudflare/next-on-pages)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🎯 TIMELINE

| Etapa | ETA | Status |
|-------|-----|--------|
| Instalar deps | 5 min | 🔄 Em progresso |
| Build local | 3 min | ⏳ Próximo |
| Push GitHub | 1 min | ⏳ Próximo |
| Redeploy Pages | 3 min | ⏳ Próximo |
| Teste produção | 5 min | ⏳ Próximo |
| **TOTAL** | **~20 min** | 🚀 |

---

**Criado:** Elon Parker  
**Para:** Gustavo Castelo Branco  
**Objetivo:** 100% Cloudflare Pages + Workers

---

**🎯 STATUS:** Aguardando conclusão de npm install → Build local → Deploy
