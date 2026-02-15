# ElonTools — Projeto Completo

> **Nome:** ElonTools (anteriormente "Elon System")
> **Stack:** 100% Cloudflare Serverless
> **Início:** 2026-02-15
> **Status:** Aguardando Etapa 1

---

## 📋 Instrução Global (Spec Completa)

### Stack Obrigatório
- **Frontend:** Cloudflare Pages (SPA) + API via Cloudflare Workers (TypeScript)
- **IA:**
  - LLM: `@cf/meta/llama-3-8b-instruct` (Workers AI)
  - Embeddings: Workers AI embedding model → Vectorize
- **Persistência:**
  - Cloudflare D1 (SQL) — dados estruturados
  - Cloudflare Vectorize — busca vetorial
- **Cache:** Cloudflare KV (respostas rápidas, status) — NUNCA secrets em plaintext
- **Segurança:** Turnstile + rate limit + validação input + mitigação prompt injection
- **Multi-tenant:** Customer Account com múltiplos Projects; toda query filtra `customer_id`

### Regras de Entrega (Obrigatório)
1. Não introduzir serviços fora do stack (exceto email via MailChannels/HTTP, plugável)
2. Tokens/secrets por customer criptografados em D1 (AES-GCM WebCrypto) com master key no Worker Secret
3. Sempre separar tenants: D1 e Vectorize filtram `customer_id` + `project_id`
4. Sempre validar input com schema (Zod)
5. Sempre implementar RBAC (CUSTOMER vs ADMIN)
6. Seguir EXATAMENTE o escopo de cada etapa

### Estrutura do Produto
- **Perfis:** CUSTOMER e ADMIN
- **Project:** identificado por domínio; auto-coleta best-effort de metadados; editável
- **UI pós-login:** seleção/criação de Project → hub de categorias → lista de agentes

### 10 Categorias (rotas/páginas próprias)
1. Desenvolvimento de Sistemas
2. Captação de Cliente
3. Monitoramento Principais KPIs
4. Financeiro
5. Análise de UX / Usabilidade
6. Backlinks
7. Vendas
8. CRM
9. Criação de Imagens
10. Criação de Vídeos

### Sistema de Agentes
- **Admin:** cria catálogo + configs versionadas (system prompt, templates, params, tools, política, schema inputs)
- **Customer:** executa por Project, salva histórico (input/output/status/timestamps/tokens)
- **Outputs relevantes → embeddings → Vectorize** (com limites e filtros por tenant)

### UX Obrigatória
- Sem Project → bloquear tudo, forçar "Adicionar Projeto"
- Project switcher sempre visível
- Sempre mostrar contexto do Project (domínio/nome/nicho/favicon)
- Loading/erros claros

---

## 🏗️ Plano de Etapas

| Etapa | Escopo | Status |
|-------|--------|--------|
| 1 | Fundação & Infraestrutura (repo, D1, KV, Vectorize, deploy básico) | ⏳ Aguardando prompt |
| 2 | Auth & Multi-tenant (Turnstile, JWT, RBAC, Zod) | ⏳ |
| 3 | Projects (CRUD, auto-coleta, switcher, gate) | ⏳ |
| 4 | Hub de Categorias (10 rotas) | ⏳ |
| 5 | Sistema de Agentes (CRUD, execução, Workers AI, histórico) | ⏳ |
| 6 | Vectorize & Embeddings | ⏳ |
| 7 | UI/UX Polish | ⏳ |
| 8 | Email & Extras | ⏳ |

---

## 🔗 Recursos Cloudflare (a criar)
- Repo GitHub: `ElonParker/elon-tools`
- D1 Database: `elon-tools-db`
- KV Namespace: `elon-tools-kv`
- Vectorize Index: `elon-tools-vectors`
- Worker: `elon-tools-api`
- Pages: `elon-tools` (SPA)
