# Trello Workflow — Sistema de Acompanhamento Real-Time

**Data Criação:** 2026-02-15  
**Importância:** 🔴 CRÍTICA  
**Responsabilidade:** Elon (criar cards) + Gustavo (validar/otimizar)

---

## 🎯 Objetivo Principal

Gustavo acompanha **100% em tempo real** o processo de cada tarefa para:
- Validar se andamento está certo
- Sugerir otimizações
- Entender como Elon trabalha
- Dar feedback iterativo
- Ajustar processos conforme necessário

---

## 🔴 REGRA ABSOLUTA: Sem Exceções

**TODA tarefa que Elon começar:**
1. ✅ Cria card em Trello ANTES de começar
2. ✅ Move pra "Em andamento" quando inicia
3. ✅ Atualiza card em tempo real (não apenas no fim)
4. ✅ Máximo detalhamento (nunca genérico)
5. ✅ Move pra "Concluído" quando termina

**NÃO É OPCIONAL!** Trello = comunicação direta com Gustavo.

---

## 📊 Estrutura Obrigatória de Card

Cada card DEVE ter:

```
[CATEGORIA] Título da Tarefa

STATUS: [Planejado | Em progresso XX% | Bloqueado | Concluído]

O QUÊ:
[Descrição clara e específica do que está sendo feito]

POR QUÊ:
[Contexto: por que essa tarefa é importante, qual benefício]

COMO:
[Approach/solução que vou usar, tecnologias, etapas]

CHECKLIST:
- [ ] Item 1 (concreto, testável)
- [ ] Item 2 (concreto, testável)
- [ ] Item 3 (concreto, testável)
- [ ] Item n

BLOCKERS (se houver):
- ⏸️ [Bloqueador 1]
- 🚨 [Bloqueador 2]

PROGRESSO:
- Feito até agora: [descrever]
- Faltando: [descrever]
- Próximo passo: [descrever]

PRÓXIMOS PASSOS:
1. [Ação A]
2. [Ação B]
3. [Ação C]

LINKS:
- Documentação: [arquivo]
- Scripts: [arquivo]
- Memory: [arquivo]
```

**Não tem ambiguidades. Gustavo entende 100%.**

---

## 🎨 7 Templates por Tipo de Tarefa

### 1. [SETUP] Configuração/Setup
Usado para: Configurar ferramentas, APIs, credenciais, initial setup

**Estrutura:**
- Status, O quê, Por quê
- Etapas numeradas
- Checklist (pré-requisitos, config, teste, doc, commit)
- Resultado final (o que ficou pronto, onde acessar, como usar)

**Exemplo:** Gmail API OAuth2

---

### 2. [INTEG] Integração de API
Usado para: Conectar APIs externas, criar scripts, integrações

**Estrutura:**
- Status, O quê, Por quê, Approach técnico
- Checklist desenvolvimento (estudo, teste, implementação, testes, doc)
- Checklist integração (se aplicável)
- Scripts criados (qual função cada um tem)
- Dados necessários (o que Gustavo precisa fornecer)
- Timeline estimada
- Blockers
- Exemplo de output

**Exemplo:** SimilarWeb, Majestic, SEMrush (próximas tarefas)

---

### 3. [DEV] Desenvolvimento/Feature
Usado para: Criar scripts, automações, novas funcionalidades

**Estrutura:**
- Status, Descrição, Objetivo, Escopo
- Design (diagrama ASCII ou descrição)
- Checklist implementação (estrutura, código, teste, refactor, logging)
- Checklist testes (válidos, inválidos, erro, performance)
- Checklist entrega (código limpo, README, exemplos, commit, doc)
- Dependências
- Tamanho (S/M/L/XL)
- Próximos passos

**Exemplo:** Consolidação automática Trello, Monitoramento SERP

---

### 4. [BUG] Bug Fix / Correção
Usado para: Corrigir problemas, bugs, melhorias

**Estrutura:**
- Status (Encontrado | Em progresso | Testando | Corrigido)
- Descrição do bug (o que está errado)
- Impacto (o que quebra, quem afeta, severidade)
- Root cause (por que acontece)
- Solução implementada (como vou corrigir)
- Checklist (identificação, fix, teste, regressão, doc, commit)
- Antes vs Depois (comportamento errado → correto)

---

### 5. [RESEARCH] Pesquisa/Investigação
Usado para: Estudar temas, entender tecnologias, investigar

**Estrutura:**
- Status (Em andamento | Pendente | Concluído)
- Pergunta chave (o que preciso entender?)
- Contexto (por que estou investigando?)
- Escopo (tópicos a cobrir)
- Checklist pesquisa (doc oficial, exemplos, testes, conclusões)
- Conclusões (descobertas principais)
- Recomendação (o que devo fazer)
- Links & recursos

---

### 6. [BLOCKER] Blocker/Problema
Usado para: Comunicar o que está impedindo progresso

**Estrutura:**
- Status: Bloqueado 🚨
- Problema (o que está bloqueando)
- Impacto (o que não conseguimos fazer)
- Causa (por que está bloqueado)
- Solução necessária (o que precisa acontecer)
- Dependências (ações do Gustavo, terceiros, pré-requisitos)
- Timeline (desde quando, urgência)
- Workaround temporário (se houver)

---

### 7. [HEARTBEAT] Consolidação Diária
Automático às 23h. Criado pelo sistema.

**Estrutura:**
- Status: Concluído ✅
- Resumo do dia (1-2 linhas)
- Checklist rotina (conversas, lições, decisões, projetos, blockers, commit)
- O que foi feito (lista de tarefas)
- Lições aprendidas
- Decisões tomadas
- Projetos avançados (progresso em %)
- Blockers identificados
- Próximas 24h (planejamento)
- Relatório completo (link para memory/YYYY-MM-DD.md)

---

## 🔄 Fluxo de Trabalho Detalhado

### Passo 1: Tarefa é Aprovada
```
Gustavo aprova algo (no Telegram ou pessoalmente)
↓
Elon anuncia no Telegram: "OK, vou criar card"
```

### Passo 2: Elon Cria Card
```
node scripts/trello-card.js --action=create \
  --list="A fazer" \
  --title="[CATEGORIA] Título específico" \
  --desc="[Descrição bem detalhada usando template apropriado]"
↓
Card aparece em "A fazer"
↓
Gustavo vê card no Trello
```

### Passo 3: Elon Começa a Trabalhar
```
Elon move card pra "Em andamento"
↓
node scripts/trello-card.js --action=move \
  --cardId=xxx \
  --list="Em andamento"
↓
Gustavo VÊ EM TEMPO REAL que começou
```

### Passo 4: Elon Trabalha e Atualiza
```
Enquanto trabalha:
1. Marca items do checklist conforme completa
2. Atualiza status (Em progresso 25% → 50% → 75%)
3. Documenta progresso na descrição
4. Registra qualquer bloqueador que encontre
↓
Gustavo vê atualizações em TEMPO REAL no Trello
↓
Gustavo pode comentar/questionar se precisar
```

### Passo 5: Elon Termina
```
Elon move card pra "Concluído"
↓
Elon adiciona resultado final na descrição
↓
node scripts/trello-card.js --action=move \
  --cardId=xxx \
  --list="Concluído"
↓
Gustavo vê resultado completo e testado
```

### Passo 6: Consolidação Automática (23h)
```
Sistema roda automaticamente
↓
Cria card [HEARTBEAT] com resumo do dia
↓
Manda relatório detalhado no Telegram
↓
Histórico fica em memory/YYYY-MM-DD.md
```

---

## 🚀 Como Usar o Script

### Criar Card
```bash
cd /data/.openclaw/workspace

TRELLO_API_KEY=ec8b36115e46e65235681b0af3f246c0 \
TRELLO_TOKEN=ATTA3e88852716e31a0bf1d774b1cf59647d932b368dd60d5c06c9bf3e2eb89f0fcbA69CBE37 \
TRELLO_BOARD_ID=699157fcd5bae09d3e2ee96d \
node scripts/trello-card.js \
  --action=create \
  --list="A fazer" \
  --title="[CATEGORIA] Descrição" \
  --desc="Descrição bem detalhada"
```

### Mover Card
```bash
TRELLO_API_KEY=... TRELLO_TOKEN=... TRELLO_BOARD_ID=... \
node scripts/trello-card.js \
  --action=move \
  --cardId=xxx123 \
  --list="Em andamento"
```

### Atualizar Card
```bash
TRELLO_API_KEY=... TRELLO_TOKEN=... TRELLO_BOARD_ID=... \
node scripts/trello-card.js \
  --action=update \
  --cardId=xxx123 \
  --title="Novo título" \
  --desc="Nova descrição"
```

### Adicionar Checklist
```bash
TRELLO_API_KEY=... TRELLO_TOKEN=... TRELLO_BOARD_ID=... \
node scripts/trello-card.js \
  --action=add-checklist \
  --cardId=xxx123 \
  --checklist="Nome do checklist" \
  --items="Item 1,Item 2,Item 3"
```

---

## 📋 Listas Padrão

| Lista | Significado | Quando Usar |
|-------|-------------|------------|
| **A fazer** | Backlog (tarefas planejadas) | Novas tarefas solicitadas |
| **Em andamento** | Trabalho ativo AGORA | Assim que Elon começa |
| **Concluído** | Feito e testado | Quando termina |

---

## 🏷️ Categorias de Card

- `[SETUP]` — Configuração
- `[INTEG]` — Integração API
- `[DEV]` — Desenvolvimento
- `[BUG]` — Correção
- `[RESEARCH]` — Pesquisa
- `[BLOCKER]` — Problema
- `[HEARTBEAT]` — Consolidação diária

---

## ✅ Checklist Antes de Criar Card

- [ ] Tarefa foi aprovada por Gustavo?
- [ ] Escolheu template correto?
- [ ] Título é específico (não genérico)?
- [ ] Descrição tem: O quê, Por quê, Checklist?
- [ ] Checklist tem itens concretos e testáveis?
- [ ] Links para documentação inclusos?
- [ ] Status está claro?

Se não tem tudo isso, **NÃO cria o card!**

---

## 🎯 Regras de Ouro

1. ✅ **Clareza** — Gustavo entende 100% sem dúvida
2. ✅ **Detalhamento** — Nunca genérico, sempre específico
3. ✅ **Tempo real** — Atualiza enquanto trabalha, não apenas no fim
4. ✅ **Checklist** — Sempre tem, sempre atualiza
5. ✅ **Documentação** — Sempre linka para files/scripts/memory
6. ✅ **Honestidade** — Se está bloqueado, marca [BLOCKER]
7. ✅ **Progresso** — Atualiza % conforme avança

---

## 💬 Comunicação

**Gustavo pode:**
- Comentar no card (Trello tem comentários)
- Questionar implementação
- Sugerir otimizações
- Pedir mais detalhes
- Validar qualidade

**Elon deve:**
- Responder comentários imediatamente
- Implementar feedback rápido
- Ajustar approach se Gustavo sugerir
- Nunca argumentar (apenas explicar se necessário)

---

## 🔗 Referência Rápida

- **Board:** https://trello.com/b/Ws7D7tpd/elon-parker-tasks-projects
- **Script:** scripts/trello-card.js
- **Templates:** CARD-TEMPLATES.md
- **Workflow:** TRELLO-WORKFLOW.md
- **Documentação:** COMO-ACOMPANHAR.md
- **Status atual:** TRELLO-STATUS-ATUAL.md

---

## 🎁 Benefícios do Sistema

Para Gustavo:
- ✅ Visibilidade 100% em tempo real
- ✅ Nenhuma surpresa (vê tudo acontecendo)
- ✅ Pode validar e otimizar no meio do processo
- ✅ Feedback iterativo possível
- ✅ Aprender como Elon trabalha
- ✅ Dashboard visual (Trello)
- ✅ Relatórios automáticos (23h)
- ✅ Histórico completo (Memory)

Para Elon:
- ✅ Comunicação clara com Gustavo
- ✅ Validação do trabalho em andamento
- ✅ Orientação clara (templates)
- ✅ Feedback que melhora processo
- ✅ Menos retrabalho
- ✅ Documentação automática
- ✅ Histórico organizado

---

**Criado:** 2026-02-15  
**Status:** ✅ CRÍTICO E OBRIGATÓRIO  
**Próxima revisão:** Quando Gustavo pedir ajustes
