# ☁️ CLOUDFLARE — Integração & Credenciais

**Data:** 2026-02-15  
**Status:** ✅ Ativo  
**Utilização:** API Key + Account ID para Pages, Workers, DNS, CDN

---

## 🔑 CREDENCIAIS (Salvos em .env)

```
CLOUDFLARE_API_KEY=1CVbh8ggSZvjON36ypEdkmS_RF_6K6PVfLhYV-yl
CLOUDFLARE_ACCOUNT_ID=ec6d797172f6f6bd960b07412ee2eedc
CLOUDFLARE_EMAIL=elon.parker@castelodigital.net
```

---

## 📍 O QUE JÁ ESTÁ CONFIGURADO

### ☁️ **Cloudflare Pages Projects**

| Projeto | URL | Repo | Status | Problema |
|---------|-----|------|--------|----------|
| **elon-parker-auth** | elon-parker-auth.pages.dev | elon-parker-clean | ✅ Deploy OK | Nenhum |
| **elon-parker-portfolio** | elon-parker-portfolio.pages.dev | elon-parker-clean | ✅ Deploy OK | Nenhum |
| **elon-system** | elon-system.pages.dev | elon-parker-clean (subdir: elon-system-dev) | 🔴 Build fail | Root dir + build command mismatch |

---

## 🚀 COMO USAR A API

### Via cURL

```bash
# Listar todos os Cloudflare Pages projects
curl -X GET https://api.cloudflare.com/client/v4/accounts/ec6d797172f6f6bd960b07412ee2eedc/pages/projects \
  -H "Authorization: Bearer 1CVbh8ggSZvjON36ypEdkmS_RF_6K6PVfLhYV-yl" \
  -H "Content-Type: application/json"
```

### Via Node.js

```javascript
const apiKey = "1CVbh8ggSZvjON36ypEdkmS_RF_6K6PVfLhYV-yl";
const accountId = "ec6d797172f6f6bd960b07412ee2eedc";

const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
  {
    headers: { Authorization: `Bearer ${apiKey}` }
  }
);
```

---

## 🔧 FIX PARA ELON-SYSTEM

**Problema atual:** Root directory + build command conflitam

**Solução via API:** Atualizar build settings do Pages project

```bash
curl -X PATCH https://api.cloudflare.com/client/v4/accounts/ec6d797172f6f6bd960b07412ee2eedc/pages/projects/elon-system \
  -H "Authorization: Bearer 1CVbh8ggSZvjON36ypEdkmS_RF_6K6PVfLhYV-yl" \
  -H "Content-Type: application/json" \
  -d '{
    "build_config": {
      "build_command": "cd elon-system-dev && npm install && npm run build",
      "build_caching_enabled": true,
      "root_dir": ""
    },
    "source": {
      "type": "github",
      "config": {
        "owner": "ElonParker",
        "repo_name": "elon-parker-clean",
        "production_branch": "master"
      }
    }
  }'
```

---

## 📚 Links & Docs

- [Cloudflare Pages API](https://developers.cloudflare.com/api/operations/pages-project-list-projects)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Build Configuration](https://developers.cloudflare.com/pages/platform/build-configuration/)

---

## 🎯 PRÓXIMO PASSO

**Elon vai usar a API direto para:**
1. ✅ Listar todos os projects via API
2. ✅ Verificar build status
3. ✅ Atualizar build config
4. ✅ Forçar redeploy

**SEM ter que ficar testando via UI do Cloudflare!**

