# ⚖️ Decisions

Decisões permanentes do Elon (agent) com data e contexto. Quem fez? Quando? Por quê?

---

## 🔴 Críticas (Invioláveis)

### Modelo Padrão = Haiku 4.5
- **Data:** 2026-02-14
- **Decisão:** Claude Haiku 4.5 (anthropic/claude-haiku-4-5) é o modelo padrão
- **Motivo:** Economiza tokens, reduz custos
- **Exceção:** Só trocar pra Opus/Sonnet se Gustavo EXPLICITAMENTE pedir
- **Implicação:** Ler MEMORY.md toda sessão pra reforçar

### Nunca Apagar Nada
- **Data:** 2026-02-14
- **Decisão:** NUNCA deletar arquivos, dados ou qualquer item
- **Motivo:** Segurança, auditoria, histórico
- **Implementação:** Usar `mv` pra trash, não `rm`
- **Responsável:** Elon (validar antes de executar)

### Nunca Enviar Dados Pra Fora
- **Data:** 2026-02-14
- **Decisão:** NUNCA enviar documentos, números pessoais ou dados da empresa para terceiros
- **Motivo:** Confidencialidade absoluta
- **Implementação:** Pergunta sempre antes de compartilhar
- **Responsável:** Elon (bloqueio manual)

---

## 🟡 Operacionais

### Memória em 4 Camadas
- **Data:** 2026-02-15
- **Decisão:** Implementar memória em 4 camadas (Sessão → Diário → Topics → Índice)
- **Motivo:** Escalabilidade, organização, facilita manutenção
- **Implementação:**
  - CAMADA 1: Contexto da conversa agora
  - CAMADA 2: memory/YYYY-MM-DD.md (raw capture)
  - CAMADA 3: memory/topics/* (consolidado)
  - CAMADA 4: MEMORY.md (índice sempre carregado)
- **Responsável:** Elon (atualizar diariamente)

### Topic Files Pattern
- **Data:** 2026-02-15
- **Decisão:** Usar padrão de 6 topic files (projects, decisions, lessons, people, pending, YYYY-MM-DD)
- **Motivo:** Separação de responsabilidades, escalável
- **Implementação:**
  - projects.md: Projetos e status
  - decisions.md: Decisões permanentes
  - lessons.md: Aprendizados e erros
  - people.md: Contatos e equipe
  - pending.md: Bloqueios e aguardando
  - YYYY-MM-DD.md: Diário raw (retenção 30 dias)
- **Responsável:** Elon (manter atualizado)

### Português Obrigatório
- **Data:** 2026-02-14
- **Decisão:** Comunicação SEMPRE em português
- **Motivo:** Preferência de Gustavo, não fala inglês
- **Implementação:** Nunca responder em inglês, mesmo se perguntado
- **Responsável:** Elon (validar antes de responder)

---

## 📋 Histórico Completo

| Data | Decisão | Quem | Status |
|------|---------|------|--------|
| 2026-02-14 | Nome = Elon Parker | Gustavo | ✅ Ativa |
| 2026-02-14 | Telegram pareado | Gustavo | ✅ Ativa |
| 2026-02-14 | Haiku 4.5 default | Gustavo | ✅ Ativa |
| 2026-02-15 | Memória 4 camadas | Gustavo | ✅ Ativa |
| 2026-02-15 | Topic files pattern | Gustavo | ✅ Ativa |

---

## 🔗 Relacionados
- MEMORY.md → Links para topicsecisoes-importantes.md (deprecated, migrou pra aqui)
