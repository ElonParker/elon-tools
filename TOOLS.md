# TOOLS.md - Ferramentas & Integração

## 🔐 Segurança de Credenciais

**⚠️ CRÍTICO:** Todas as credenciais estão em `.env` (não versionado em Git)
- ✅ Arquivo: `.env` (em .gitignore)
- ✅ Template: `.env.example` (com placeholders)
- ✅ Secrets: `secrets/google_client_secret.json`
- ✅ Nunca commitar credenciais!

---

## 📧 Email Workspace

- **Email:** elon.parker@castelodigital.net
- **Senha:** Em `.env` (WORKSPACE_PASSWORD)
- **Uso:** Verificação de caixa de entrada, integração Gmail
- **Google Project:** elon-parker
- **Status:** ✅ Configurado

---

## 📊 Ferramentas de SEO

### SEOPack
- **Tipo:** Central de login (acessa tudo por lá)
- **Status:** ⏳ Credenciais pendentes
- **Usar:** Browser automático
- **Detalhes:** Integra SimilarWeb, Majestic, SEMrush

### SimilarWeb
- **Tipo:** Análise de tráfego
- **Status:** ⏳ API key pendente
- **Env var:** SIMILARWEB_API_KEY
- **Docs:** https://developer.similarweb.com

### Majestic
- **Tipo:** Backlinks e trust flow
- **Status:** ⏳ API key pendente
- **Env var:** MAJESTIC_API_KEY
- **Docs:** https://majestic.com/api

### SEMrush
- **Tipo:** Palavras-chave e concorrência
- **Status:** ⏳ API key pendente
- **Env var:** SEMRUSH_API_KEY
- **Docs:** https://api.semrush.com

---

## 🌐 Google Workspace Integration

### Gmail API
- **Client ID:** `844219782357-24evidsod3b91pm05v04iijfa5gvfb2j.apps.googleusercontent.com`
- **Project:** `elon-parker`
- **Secret:** Em `.env` (GOOGLE_CLIENT_SECRET)
- **Scope:** Mail, Calendar (quando implementado)
- **Status:** ✅ Pronto

### Google Drive
- **Escopo:** Leitura de documentos, planilhas
- **Status:** ⏳ Implementar quando necessário

---

## 🏠 Dynadot (Registrador de Domínios)

- **Tipo:** Registrador de domínios
- **API Key:** Em `.env` (DYNADOT_API_KEY)
- **Uso:** Pesquisa e registro de domínios
- **Status:** ⏳ API key pendente
- **Docs:** https://www.dynadot.com/api/

---

## 📋 Trello

- **Email Elon:** elon.parker@castelodigital.net
- **Username:** elonparker2
- **API Key:** Em `.env` (TRELLO_API_KEY)
- **Token:** Em `.env` (TRELLO_TOKEN)
- **Status:** ✅ Operacional
- **Board:** Elon Parker - Tasks & Projects (https://trello.com/b/Ws7D7tpd/elon-parker-tasks-projects)
- **Compartilhado com:** glcbranco96 (Gustavo Castelo Branco)
- **Uso:** Registrar tarefas, organização de projetos, consolidação diária automática

---

## 🤖 Anthropic API

- **API Key:** Em `.env` (ANTHROPIC_API_KEY)
- **Status:** ✅ Funcionando
- **Modelos:** Haiku 4.5 (padrão), Opus 4.6, Sonnet 4.5
- **Uso:** Processamento de LLM

---

## 📁 Estrutura de Credenciais

```
workspace/
├── .env .......................... Credenciais reais (NÃO COMMITAR!)
├── .env.example .................. Template com placeholders
├── .gitignore .................... Ignora .env, secrets/
└── secrets/
    ├── google_client_secret.json . Cliente OAuth Google
    └── ...
```

---

## 🔑 Como Usar as Credenciais

### Variáveis de Ambiente
```bash
# Carregar .env na sessão
source .env

# Usar no código
echo $WORKSPACE_EMAIL      # elon.parker@castelodigital.net
echo $GOOGLE_CLIENT_SECRET # (não mostrado - está em .env)
```

### Em Código (Node.js)
```javascript
require('dotenv').config();

const email = process.env.WORKSPACE_EMAIL;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
```

---

## ✅ Pendências de Configuração

- [x] Email workspace criado
- [x] Google OAuth (client_secret.json) guardado
- [x] Testar integração Gmail (RFC 2047 encoding implementado)
- [x] Trello board criado e compartilhado (2026-02-15)
- [ ] Integrar SimilarWeb (quando API key chegar)
- [ ] Integrar Majestic (quando API key chegar)
- [ ] Integrar SEMrush (quando API key chegar)
- [ ] Dynadot setup (quando API key chegar)
- [ ] Scripts Trello (create-card, move-card, sync)

---

## 🔗 Relacionados

- `.env` → Credenciais (não versionado)
- `.env.example` → Template
- `secrets/` → Arquivos confidenciais
- `memory/topics/people.md` → Quem tem acesso a quê