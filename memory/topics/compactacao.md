# 🔧 Compactação - Modelo de Consolidação

Processo de extração de lições, decisões, bloqueios e consolidação de memória.

---

## 🔥 Momento Crítico: A Compactação

Quando a sessão fica grande demais, o sistema compacta (resumo). É aqui que a extração de lições é obrigatória.

---

## 4 Passos da Compactação

### 1️⃣ **Capability Evolving** 
- **O quê:** Script automático analisa a sessão e identifica padrões de memória
- **Quando:** Fim de cada sessão grande
- **Saída:** Lista de padrões, lições, decisões encontradas
- **Responsável:** Sistema automático (cron job)

### 2️⃣ **Extração Manual**
- **O quê:** Reviso conversas, lições, decisões, contatos, updates de projetos
- **Quando:** Após capability evolving sugerir
- **Saída:** Informações estruturadas pros topic files
- **Responsável:** Elon (validação + escrita)
- **Detalhes:**
  - lessons.md ← Erros, descobertas
  - decisions.md ← Novas decisões
  - people.md ← Novos contatos
  - projects.md ← Updates de status
  - pending.md ← Novos bloqueios

### 3️⃣ **Nota Diária**
- **O quê:** Garante que o registro raw do dia está salvo
- **Quando:** Fim de cada dia
- **Saída:** memory/YYYY-MM-DD.md (completo, rascunho bruto)
- **Responsável:** Elon (automático ao final do dia)
- **Garantia:** Nada fica perdido (tudo tá no raw)

### 4️⃣ **Nunca Pular**
- **Regra:** Compactar SEM EXTRAIR = Perde 80% do valor do contexto!
- **Implicação:** Se não fizer extraçao manual, perdes lições, decisões, padrões
- **Verificação:** Checar se lessons.md, decisions.md foram atualizados
- **Consequência:** Repetir erros, esquecer decisões, perder conhecimento

---

## 🔄 Fluxo Completo de Compactação

```
[Sessão grande demais ou fim do dia]
    ↓
[1. Capability Evolving]
   [Script automático analisa tudo]
   [Sugere padrões, lições, decisões]
    ↓
[2. Extração Manual]
   [Reviso sugestões]
   [Escrevo em lessons.md]
   [Escrevo em decisions.md]
   [Atualizo people.md]
   [Atualizo projects.md]
   [Atualizo pending.md]
    ↓
[3. Nota Diária]
   [Consolido memory/2026-02-15.md]
   [Raw capture completo]
    ↓
[4. Nunca Pular?]
   [✅ Sim, fiz extração]
   → Git commit
   → Pronto pra próxima sessão
   
   [❌ Não, pulei extração]
   → ERRO! Perdemos 80% do conhecimento
   → Voltar ao passo 2
```

---

## 📊 Tabela de Extração

| Fonte | Destino | O Quê | Quando |
|-------|---------|-------|--------|
| Conversa | lessons.md | Erros, descobertas, padrões | Após cada sessão grande |
| Conversa | decisions.md | Novas decisões tomadas | Se houve decisão |
| Conversa | people.md | Novos contatos, updates | Se houve novo contato |
| Conversa | projects.md | Status, bloqueios, próximos passos | Sempre (status muda) |
| Conversa | pending.md | Bloqueios, aguardando | Sempre (pending muda) |
| Conversa | 2026-02-15.md | Rascunho raw completo | Fim de cada dia |

---

## 🔐 Garantias de Não-Perda

```
✅ Raw capture (memory/YYYY-MM-DD.md) = SEMPRE feito
✅ Extrações (lessons, decisions, etc) = VALIDADAS
✅ Git commit = PRESERVA HISTÓRICO
✅ Retenção 30 dias = SEGURANÇA
✅ Nunca deletar = POLÍTICA
```

---

## ⚙️ Automação

### Que Roda Automático
```
1. memory_search() em toda sessão
2. memory_get() sob demanda
3. Git commit após cada edit/write
4. Consolidação diária (final do dia)
```

### Que Precisa de Validação Manual
```
1. Extração de lições (capability evolving sugere, eu valido)
2. Escrita em decisions.md (só se realmente for decisão)
3. Contatos em people.md (só se relevante)
4. Status em projects.md (sempre atualizar)
```

---

## 📈 Exemplo de Compactação

### Dia 1 (Sem Compactação)
```
Conversa longa (2h, 50 mensagens)
    ↓ Fim do dia
    ↓ memory/2026-02-15.md (raw, salvo)
    ↓ BUT: Não extraí lições...
    ↓ PERDI 80% do conhecimento!
```

### Dia 2 (Com Compactação)
```
Conversa longa (2h, 50 mensagens)
    ↓ Fim do dia
    ↓ Capability Evolving: "Identifiquei 5 lições!"
    ↓ Extração Manual:
       ├─ lessons.md +5 lições
       ├─ decisions.md +2 decisões
       ├─ projects.md status updated
       └─ pending.md +1 bloqueio
    ↓ memory/2026-02-15.md (raw, salvo)
    ↓ Git commit
    ↓ Pronto! Conhecimento preservado 100%
```

---

## 🎯 Checklist de Compactação

Ao final de cada sessão grande:
```
[ ] Capability Evolving rodou? (análise automática)
[ ] Extraí lições? (lessons.md atualizado)
[ ] Extraí decisões? (decisions.md atualizado)
[ ] Atualizei projetos? (projects.md atualizado)
[ ] Atualizei bloqueios? (pending.md atualizado)
[ ] Consolidei diário? (memory/2026-02-15.md completo)
[ ] Git commit feito? (histórico preservado)
[ ] Nunca pulei extração? (garantia: não perdi 80%)
```

**Se algum ✅ falta → VOLTAR E FAZER!**

---

## 🔗 Relacionados
- lessons.md → Onde as lições vão
- decisions.md → Onde as decisões vão
- projects.md → Onde updates vão
- people.md → Onde contatos vão
- pending.md → Onde bloqueios vão
- memory/YYYY-MM-DD.md → Raw capture
