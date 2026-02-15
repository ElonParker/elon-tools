# 🏗️ Arquitetura - Visão Geral

Sistema de memória em 4 camadas do Elon Parker (Agent)

---

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 AMORA (Sessão Viva)                                      │
│ Classe Osio — contexto sessão ~200k tokens                  │
└──────────────┬──────────────────────────────────────────────┘
               │
        ▼ Carrega ao iniciar
    ┌───────────────────────────────┐
    │  📋 SOUL.md (Personalidade)    │
    │  👤 USER.md (Perfil - Bruno)  │ ← Gustavo (renomeado aqui)
    │  📑 MEMORY.md (Índice)         │
    │  🛠️  TOOLS.md (Ferramentas)    │
    └───────────┬───────────────────┘
                │
        ▼ Consulta sob demanda
    ┌─────────────────────────────┐
    │  🚀 projects.md             │
    │  ⚖️  decisions.md            │
    │  💡 lessons.md              │
    │  👥 people.md               │
    │  ⏳ pending.md               │
    └─────────────────────────────┘
                │
        ▼ Rascunho bruto
    ┌─────────────────────────────┐
    │  📅 2026-02-07.md           │
    │  📅 2026-02-08.md           │
    │  📅 2026-02-09.md           │
    │  (Retenção: 30 dias)        │
    └─────────────────────────────┘
```

---

## 🔄 Fluxo de Operação

### Inicialização (Session Start)
```
[Sessão começa]
    ↓
[Carrega: SOUL.md, USER.md, MEMORY.md, TOOLS.md]
    ↓
[Contexto pronto ~200k tokens]
    ↓
[Aguardando mensagem]
```

### Durante Conversa (Message Received)
```
[Mensagem chega]
    ↓
[memory_search() → Busca relevante nos topics]
    ↓
[memory_get() → Puxa linhas específicas]
    ↓
[Processa com contexto]
    ↓
[Responde]
    ↓
[Edit/Write → Atualiza arquivos relevantes]
```

### Ao Final do Dia
```
[Dia termina]
    ↓
[Consolida memory/2026-02-15.md → raw capture]
    ↓
[Atualiza projects.md, decisions.md, etc]
    ↓
[Git commit]
    ↓
[Pronto pra próxima sessão]
```

---

## 📊 Tabela de Carregamento

| Arquivo | Quando | Tamanho | Uso |
|---------|--------|--------|-----|
| SOUL.md | Sempre | ~2KB | Personalidade do agent |
| USER.md | Sempre | ~2KB | Perfil do usuário |
| MEMORY.md | Sempre | ~5KB | Índice + status |
| TOOLS.md | Sempre | ~3KB | Ferramentas disponíveis |
| projects.md | Sob demanda | ~5KB | Projetos ativos |
| decisions.md | Sob demanda | ~10KB | Decisões importantes |
| lessons.md | Sob demanda | ~8KB | Aprendizados |
| people.md | Sob demanda | ~6KB | Contatos e equipe |
| pending.md | Sob demanda | ~8KB | Bloqueios e aguardando |
| YYYY-MM-DD.md | Sob demanda | ~10KB | Diário do dia |

**Total carregado sempre:** ~12KB (base)
**Total com topics:** ~60KB (completo)
**Contexto disponível:** ~200k tokens Claude

---

## 🎯 Responsabilidade de Cada Camada

### 1️⃣ Sessão (AMORA - Session Context)
- **O quê:** Contexto em tempo real da conversa
- **Onde:** Memória da sessão OpenClaw
- **Retenção:** Apenas durante sessão ativa
- **Uso:** Conversas imediatas, estado atual
- **Exemplo:** "Gustavo mandou 3 chaves que não funcionaram"

### 2️⃣ Inicialização (4 Files Sempre Carregados)
- **O quê:** Identidade, perfil, índice, ferramentas
- **Onde:** SOUL.md, USER.md, MEMORY.md, TOOLS.md
- **Retenção:** Permanente (nunca expira)
- **Uso:** Referência rápida, personalidade
- **Exemplo:** "Sou Elon Parker, trabalho com Gustavo, Haiku é padrão"

### 3️⃣ Consulta (5 Topic Files Sob Demanda)
- **O quê:** Projetos, decisões, lições, contatos, bloqueios
- **Onde:** memory/topics/*.md
- **Retenção:** Permanente (nunca expira)
- **Uso:** Contexto profundo, histórico
- **Exemplo:** "Qual era a decisão sobre modelo? → decisions.md"

### 4️⃣ Diário (Raw Capture - Retenção 30 dias)
- **O quê:** Rascunho bruto do dia
- **Onde:** memory/YYYY-MM-DD.md
- **Retenção:** 30 dias (depois arquiva)
- **Uso:** Referência rápida do dia atual/anterior
- **Exemplo:** "O que fizemos hoje? → 2026-02-15.md"

---

## 💾 Persistência & Backup

```
Git History
    ↓
Commits diários
    ├─ Initial setup (2026-02-14)
    ├─ Memory implementation (2026-02-15)
    ├─ Topics pattern (2026-02-15)
    ├─ Daily consolidation (2026-02-15 EOD)
    └─ ...
```

**Estratégia:**
- ✅ Git commit após cada mudança significativa
- ✅ Histórico preservado em `/data/.openclaw/workspace/.git`
- ✅ Revert possível em qualquer ponto

---

## 🔐 Segurança & Confidencialidade

```
MEMORY (Local)
    ├─ ✅ Armazenado em /data/.openclaw/workspace/
    ├─ ✅ NUNCA enviado pra fora
    ├─ ✅ NUNCA compartilhado
    └─ ✅ NUNCA deletado (apenas arquivado)
```

---

## 📈 Escalabilidade

```
Sessão 1 (2026-02-15)
    └─ memory/topics/
       ├─ projects.md (1 projeto)
       ├─ decisions.md (5 decisões)
       ├─ lessons.md (10 lições)
       ├─ people.md (2 pessoas)
       └─ pending.md (5 items)

Sessão N (2026-06-15)
    └─ memory/topics/
       ├─ projects.md (20 projetos!)
       ├─ decisions.md (50 decisões!)
       ├─ lessons.md (100 lições!)
       ├─ people.md (20 pessoas!)
       └─ pending.md (30 items!)

👉 CRESCE INDEFINIDAMENTE SEM IMPACTO NA PERFORMANCE
```

---

## 🔗 Relacionados

- `MEMORY.md` → Índice (sempre carregado)
- `memory/topics/*` → Detalhes por assunto
- `memory/YYYY-MM-DD.md` → Diários (retenção 30 dias)
- `.git/` → Histórico completo
