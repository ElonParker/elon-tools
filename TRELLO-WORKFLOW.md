# TRELLO WORKFLOW — Sistema de Rastreamento Real-Time

**Objetivo:** Manter Gustavo 100% atualizado sobre o que Elon está fazendo via Trello.

---

## 📋 Listas Padrão

| Lista | Significado | Quando Usar |
|-------|-------------|------------|
| **A fazer** | Tarefas planejadas, backlog | Novas tarefas solicitadas |
| **Em andamento** | Trabalho ativo agora | Assim que começo algo |
| **Concluído** | Feito e testado | Quando termino |

---

## 🔄 Fluxo de Trabalho

### 1️⃣ **Nova Tarefa Chega**
```bash
node scripts/trello-card.js \
  --action=create \
  --list="A fazer" \
  --title="Configurar SimilarWeb API" \
  --desc="Implementar integração com SimilarWeb para análise de tráfego"
```

### 2️⃣ **Começo a Trabalhar**
```bash
node scripts/trello-card.js \
  --action=move \
  --cardId=xyz123 \
  --list="Em andamento"
```

Adiciono checklist com sub-passos:
```bash
node scripts/trello-card.js \
  --action=add-checklist \
  --cardId=xyz123 \
  --checklist="Setup" \
  --items="Gerar API key,Testar autenticação,Documentar credenciais,Fazer commit"
```

### 3️⃣ **Progresso Durante Execução**
Atualizo a descrição com comentários e progresso:
```bash
node scripts/trello-card.js \
  --action=update \
  --cardId=xyz123 \
  --desc="API key: [obtida] | Autenticação: [funcionando] | Próximo: documentar"
```

### 4️⃣ **Tarefa Concluída**
```bash
node scripts/trello-card.js \
  --action=move \
  --cardId=xyz123 \
  --list="Concluído"
```

---

## 🏷️ Padrão de Títulos

Sempre usar este formato para clareza:

```
[CATEGORIA] Descrição da tarefa
```

**Categorias:**
- `[CONFIG]` — Configuração de ferramentas/credenciais
- `[DEV]` — Desenvolvimento (scripts, automações)
- `[SEO]` — Análise/pesquisa SEO
- `[INTEG]` — Integração de APIs
- `[DOC]` — Documentação/memória
- `[BUG]` — Correção de problema
- `[RESEARCH]` — Pesquisa/investigação
- `[HEARTBEAT]` — Consolidação automática diária

---

## 📅 Consolidação Automática (23h)

Todo dia às 23h, card automático é criado:

```
[HEARTBEAT] Consolidação diária - YYYY-MM-DD
```

Com checklist:
- ✅/❌ Conversas analisadas
- ✅/❌ Lições extraídas
- ✅/❌ Decisões documentadas
- ✅/❌ Projetos atualizados
- ✅/❌ Blockers identificados
- ✅/❌ Git commit feito

---

## 💾 Estrutura da Descrição do Card

```
**Status:** [Planejado | Em progresso | Bloqueado | Concluído]

**O quê:**
- [descrição clara do trabalho]

**Progresso:**
- [% completo ou etapas feitas]

**Próximos passos:**
- [o que vem depois]

**Blockers (se houver):**
- [obstáculos]

**Links:**
- [documentação, arquivo de memória, etc]
```

---

## 🚀 Exemplo Prático

**Card 1: Configurar Gmail**
```
[CONFIG] Autenticar Gmail API OAuth2

Status: Concluído

O quê:
- Gerar código OAuth
- Exchange pelo access token
- Testar envio de email
- RFC 2047 encoding para subjects em português

Progresso:
- 100% completo

Links:
- memory/topics/gmail-integration.md
- scripts/send-email.js
```

**Card 2: Consolidação diária - 2026-02-15**
```
[HEARTBEAT] Consolidação diária - 2026-02-15

Status: Concluído

Checklist:
- [x] Conversas analisadas
- [x] Lições extraídas
- [x] Decisões documentadas
- [x] Projetos atualizados
- [x] Blockers identificados
- [x] Git commit feito

Relatório:
- Gmail API autenticada com sucesso
- RFC 2047 implementado para subjects em português
- Trello integrado e pronto
- Compactação automática ativada às 23h

Links:
- memory/2026-02-15.md
```

---

## 🎯 Regras Ouro

1. ✅ **Sempre mover para "Em andamento"** quando começo uma tarefa
2. ✅ **Adicionar checklist** para tarefas complexas com múltiplas etapas
3. ✅ **Atualizar descrição** com progresso real enquanto trabalho
4. ✅ **Comentar/documentar** se houver bloqueios ou mudanças de rumo
5. ✅ **Mover para "Concluído"** assim que termino + testado
6. ✅ **Usar categorias** no título para fácil filtragem
7. ✅ **Linkar documentação** (memory files, scripts, etc) na descrição

---

## 🔗 Scripts Disponíveis

```bash
# Criar card
node scripts/trello-card.js --action=create --list="Em andamento" --title="[CONFIG] Novo setup"

# Mover card
node scripts/trello-card.js --action=move --cardId=abc123 --list="Concluído"

# Atualizar card
node scripts/trello-card.js --action=update --cardId=abc123 --title="Novo título"

# Adicionar checklist
node scripts/trello-card.js --action=add-checklist --cardId=abc123 --checklist="Setup" --items="Step1,Step2"
```

---

## 📊 Benefícios

✅ Gustavo vê 100% do que Elon tá fazendo
✅ Histórico completo de tudo que foi feito
✅ Fácil ver o que tá bloqueado/em progresso
✅ Integração com relatórios automáticos (23h)
✅ Dashboard visual no Trello

---

**Tá pronto para usar! 🚀**
