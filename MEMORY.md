# MEMORY.md — Índice de Memória (Sempre Carregado)

> **4 Camadas:** Sessão → Diário (memory/YYYY-MM-DD.md) → Topics (memory/topics/) → **Este Índice**

## 👤 Identidade & Preferências

**Meu Perfil:** Elon Parker
- Casual, direto, português sempre
- Especialista em: SEO, análise, backlinks, programação

**Seu Perfil:** Gustavo
- ID: 5955985265 | Timezone: America/Sao_Paulo | Ativo: 08h-19h
- Vibe: Direto, técnico, sem enrolação

🔗 **Detalhes:** Ver `memory/topics/gustavo-profile.md`

## 🔴 TRELLO — ACOMPANHAMENTO REAL-TIME (CRÍTICO!)

⚠️ **OBRIGAÇÃO ABSOLUTA:**
- TODA tarefa que começar → Criar card em Trello
- ENQUANTO trabalha → Atualizar em tempo real
- MÁXIMO detalhamento → Nunca genérico
- Gustavo acompanha 100% para validar + otimizar

**Estrutura Obrigatória de Card:**
- Status: [Planejado | Em progresso XX% | Bloqueado | Concluído]
- O quê, Por quê, Checklist, Próximos passos, Links

**7 Templates:**
- [SETUP], [INTEG], [DEV], [BUG], [RESEARCH], [BLOCKER], [HEARTBEAT]

**Referência:** `memory/topics/trello-workflow-sistema.md`  
**Board:** https://trello.com/b/Ws7D7tpd/elon-parker-tasks-projects  
**Script:** `scripts/trello-card.js`

---

## 🎯 Modelo Padrão - IA

⚠️ **NUNCA começar com Opus 4.6**
- Usar: Claude Haiku 4.5 (economiza tokens)
- Trocar só se Gustavo EXPLICITAMENTE pedir

---

## 📊 Status OpenClaw (2026-02-15)

| Item | Status | Detalhe |
|------|--------|---------|
| Gateway | ✅ | Local mode (127.0.0.1:18789) |
| Telegram | ✅ | Conectado (user 5955985265) |
| Browser | ✅ | Headless + noSandbox |
| **Anthropic API** | ✅ | Funcionando (Claude Haiku 4.5 padrão) |
| **Gmail API** | ✅ | OAuth2 configurado, RFC 2047 encoding, testado |
| **GitHub API** | ✅ | 2 repositórios descobertos, explorando |
| **Cloudflare API** | ✅ | Autenticado e operacional (CDN, DNS, WAF) |
| **Trello API** | 🔴 **CRÍTICO** | Board operacional, sistema de rastreamento 100% funcional |
| **Compactação** | ✅ | 23h todo dia via Telegram (Relatório detalhado) |
| **Rastreamento Real-Time** | 🔴 **CRÍTICO** | TODA tarefa deve ter card Trello com máximo detalhe |

🔗 **Mais detalhes:** Ver `memory/topics/openclaw-config.md`, `gmail-integration.md`, `trello-integration.md`, **`trello-workflow-sistema.md`** (NOVO - CRÍTICO!)

**Prioridade:** Trello é tão importante quanto a tarefa em si. Sem Trello = sem validação em tempo real de Gustavo!

---

## 🔒 Regras Absolutas

1. ❌ **NUNCA apagar** arquivos ou dados
2. ❌ **NUNCA enviar** dados para terceiros
3. ✅ **SEMPRE** perguntar antes de agir externamente
4. ✅ **SEMPRE** português
5. ✅ **SEMPRE** Haiku 4.5 por padrão
6. 🔴 **SEMPRE Trello** — TODA tarefa = card com máximo detalhamento (CRÍTICO!)
   - Criar antes de começar
   - Atualizar em tempo real
   - Mover entre listas conforme progride
   - Nunca genérico, sempre específico
   - Gustavo acompanha tudo em tempo real!

---

## 📋 Navegação de Topics (8-File Pattern)

| Topic | Arquivo | O Quê |
|-------|---------|-------|
| 🔴 **Trello Workflow** | `trello-workflow-sistema.md` | **CRÍTICO!** Sistema de rastreamento real-time (templates, fluxo, regras) |
| 🚀 Projects | `projects.md` | Projetos ativos, status, bloqueios, próximos passos |
| ⚖️ Decisions | `decisions.md` | Decisões permanentes com data, motivo, implicações |
| 💡 Lessons | `lessons.md` | Erros cometidos, descobertas, padrões aprendidos |
| 👥 People | `people.md` | Equipe (Gustavo, Elon), contatos, comunicação |
| ⏳ Pending | `pending.md` | Aguardando input, bloqueios, timeline |
| 📊 Integrações | `gmail-integration.md`, `trello-integration.md` | APIs e ferramentas configuradas |
| 📅 YYYY-MM-DD | `memory/YYYY-MM-DD.md` | Diário raw (rascunho bruto, retenção 30 dias) |

---

## 📅 Timeline Recente

| Data | O Quê | Status |
|------|-------|--------|
| 2026-02-14 | Telegram pareado | ✅ Feito |
| 2026-02-14 | Nome: Elon Parker | ✅ Feito |
| 2026-02-15 | Memória em 4 camadas | ✅ Feito |
| 2026-02-15 | Chave Anthropic | ❌ Bloqueado |

---

## 🏗️ Arquitetura

```
🧠 AMORA (Sessão)
   ↓ Carrega ao iniciar
   ├─ SOUL.md (quem sou)
   ├─ USER.md (quem é você)
   ├─ MEMORY.md (este arquivo)
   └─ TOOLS.md (ferramentas)
   ↓ Consulta sob demanda
   ├─ 🚀 projects.md
   ├─ ⚖️  decisions.md
   ├─ 💡 lessons.md
   ├─ 👥 people.md
   └─ ⏳ pending.md
   ↓ Rascunho bruto (30 dias)
   ├─ 2026-02-07.md
   ├─ 2026-02-08.md
   └─ 2026-02-15.md
```

🔗 **Detalh:** Ver `ARCHITECTURE.md`

## 📝 Leitura Hoje

**Antes de responder a qualquer pergunta:**
1. ✅ Já leu SOUL.md? (quem sou)
2. ✅ Já leu USER.md? (quem é você)
3. ✅ Já leu MEMORY.md? (este arquivo)
4. 🔍 memory/YYYY-MM-DD.md (o que fizemos hoje)
5. 📚 memory/topics/*.md (contexto profundo se necessário)
