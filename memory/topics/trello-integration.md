# Trello Integration — Status & Fluxos

**Data Ativação:** 2026-02-15  
**Status:** ✅ OPERACIONAL

---

## Credenciais

- **Email Elon:** elon.parker@castelodigital.net
- **Usuário:** elonparker2
- **API Key:** ec8b36115e46e65235681b0af3f246c0
- **Token:** (salvo em `.env`)
- **Armazenamento:** `.env` (não versionado)

---

## Board Principal

📋 **Elon Parker - Tasks & Projects**
- **ID:** 699157fcd5bae09d3e2ee96d
- **URL:** https://trello.com/b/Ws7D7tpd/elon-parker-tasks-projects
- **Membros:**
  - Elon Parker (elonparker2) — Admin
  - Gustavo Castelo Branco (glcbranco96) — Normal

---

## Capacidades Atuais

✅ **CRUD de cards**
- Criar cards com título, descrição, labels
- Mover entre listas
- Atribuir a membros
- Adicionar checklists

✅ **Gerenciar listas**
- Criar/deletar listas
- Organizar por status (To Do, In Progress, Done, etc)

✅ **Automação via API**
- Script: `scripts/trello-create-card.js` (quando implementado)
- Integração com heartbeat diário (consolidação → card automático)

---

## Fluxo de Uso

### Consolidação Diária (23h)
1. Rotina automática roda
2. Cria card no Trello com:
   - Título: `[Consolidação] YYYY-MM-DD`
   - Descrição: Relatório completo do dia
   - Labels: `daily-consolidation`, `automated`
   - Checklist com itens completados

### Tarefas Manuais
- Você cria cards no Trello
- Elon monitora e pode atualizar status

### Outras Integrações (Futuro)
- Enviar notificação quando task é criada
- Sincronizar com Google Calendar (quando expandir)
- Webhooks para eventos importantes

---

## Scripts

Quando implementar:
- `scripts/trello-create-card.js` — Criar cards via CLI
- `scripts/trello-move-card.js` — Mover entre listas
- `scripts/trello-sync.js` — Sync com banco de dados local

---

## Relacionado

- **Email:** Gmail + Trello = notificações integradas
- **Heartbeat:** Consolidação automática → card no Trello
- **Memory:** Projetos sincronizados (projects.md ↔ Trello)
