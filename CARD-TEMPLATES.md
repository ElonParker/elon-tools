# CARD TEMPLATES — Padrão de Descrição por Tipo de Tarefa

**Objetivo:** Cada tarefa tem estrutura padrão bem definida para que Gustavo entenda perfeitamente o que está sendo feito.

---

## 🏗️ TEMPLATE 1: CONFIGURAÇÃO / SETUP

**Usado para:** Configurar ferramentas, APIs, credenciais, initial setup

```
**Status:** [Planejado | Em progresso XX% | Bloqueado | Concluído]

**O quê:**
[Descrição clara da configuração]

**Por quê:**
[Contexto: por que essa configuração é necessária]

**Etapas:**
1. [Passo 1]
2. [Passo 2]
3. [Passo n]

**Checklist:**
- [ ] Pré-requisitos verificados
- [ ] Credenciais obtidas
- [ ] Configuração implementada
- [ ] Teste de autenticação
- [ ] Documentação criada
- [ ] Git commit feito

**Resultado Final:**
- [O que ficou pronto]
- [Onde acessar]
- [Como usar]

**Blockers (se houver):**
- [Obstáculos]

**Links:**
- Documentação: memory/topics/xxx-integration.md
- TOOLS.md (referência)
```

**Exemplo Real:** Gmail API OAuth2 (já implementado)

---

## 🔧 TEMPLATE 2: INTEGRAÇÃO DE API

**Usado para:** Conectar APIs, criar scripts, fazer integrações

```
**Status:** [Planejado | Em progresso XX% | Bloqueado | Concluído]

**O quê:**
[O que a integração faz]

**Por quê:**
[Benefício/caso de uso]

**Approach Técnico:**
1. [Como vou implementar]
2. [Tecnologias que vou usar]
3. [Fluxo da integração]

**Checklist - Desenvolvimento:**
- [ ] Estudar documentação da API
- [ ] Testar autenticação
- [ ] Implementar função 1
- [ ] Implementar função 2
- [ ] Implementar função n
- [ ] Testes com dados reais
- [ ] Tratamento de erros
- [ ] Logs adequados

**Checklist - Documentação:**
- [ ] memory/topics/xxx-integration.md criado
- [ ] TOOLS.md atualizado
- [ ] Exemplos de uso documentados
- [ ] RFC padrão definido

**Scripts Criados:**
- [ ] scripts/xxx.js (descrição da função)
- [ ] scripts/xxx-cli.js (CLI para uso)

**Dados Necessários:**
- API Key: (de quem?)
- Credenciais: (quais?)
- Ambiente: (teste/prod?)

**Timeline:**
- Estudo: X horas
- Implementação: X horas
- Testes: X horas
- Documentação: X horas
- **Total:** X horas

**Blockers:**
- ⏸️ [Aguardando...]
- 🚨 [Problema...]

**Exemplo de Output:**
\`\`\`json
{
  "resultado": "exemplo",
  "status": "success"
}
\`\`\`

**Links:**
- API Docs: [URL]
- memory/topics/xxx-integration.md
- scripts/xxx.js
```

**Exemplo Real:** SimilarWeb (próxima tarefa)

---

## 📊 TEMPLATE 3: DESENVOLVIMENTO / FEATURE

**Usado para:** Criar scripts, automações, novas funcionalidades

```
**Status:** [Planejado | Em progresso XX% | Bloqueado | Concluído]

**Descrição:**
[O que vou fazer]

**Objetivo:**
[Qual é o benefício final]

**Escopo:**
1. [Funcionalidade 1]
2. [Funcionalidade 2]
3. [Funcionalidade n]

**Design:**
\`\`\`
[Diagrama ASCII ou descrição da arquitetura]
\`\`\`

**Checklist - Implementação:**
- [ ] Preparar estrutura do projeto
- [ ] Escrever código função 1
- [ ] Escrever código função 2
- [ ] Testar localmente
- [ ] Refatorar/otimizar
- [ ] Adicionar logging
- [ ] Tratar edge cases

**Checklist - Testes:**
- [ ] Teste com dados válidos
- [ ] Teste com dados inválidos
- [ ] Teste de erro/timeout
- [ ] Teste de performance

**Checklist - Entrega:**
- [ ] Código limpo e comentado
- [ ] README.md criado
- [ ] Exemplos de uso
- [ ] Git commit e push
- [ ] Documentação atualizada

**Dependências:**
- [O que precisa estar pronto antes]

**Tamanho:** S / M / L / XL

**Próximos Passos:**
[O que vem depois]

**Links:**
- scripts/xxx.js (arquivo principal)
- Documentação: [arquivo]
```

**Exemplo Real:** Consolidação automática Trello/Heartbeat (quando fizer)

---

## 🐛 TEMPLATE 4: BUG FIX / CORREÇÃO

**Usado para:** Corrigir problemas, bugs, melhorias

```
**Status:** [Encontrado | Em progresso XX% | Testando | Corrigido]

**Descrição do Bug:**
[O que está acontecendo de errado]

**Impacto:**
- [O que quebra]
- [Quem é afetado]
- [Severidade: Crítico / Alto / Médio / Baixo]

**Root Cause:**
[Por que está acontecendo]

**Solução Implementada:**
[Como vou corrigir]

**Checklist:**
- [ ] Bug identificado e documentado
- [ ] Root cause encontrada
- [ ] Código corrigido
- [ ] Teste do fix
- [ ] Regressão testada
- [ ] Documentação atualizada
- [ ] Git commit com mensagem clara

**Antes vs Depois:**
\`\`\`
Antes: [comportamento errado]
Depois: [comportamento correto]
\`\`\`

**Links:**
- Arquivo afetado: scripts/xxx.js
- Commit: [hash]
```

---

## 📚 TEMPLATE 5: PESQUISA / INVESTIGAÇÃO

**Usado para:** Estudar, entender, investigar temas

```
**Status:** [Em andamento | Pendente | Concluído]

**Pergunta Chave:**
[O que preciso entender?]

**Contexto:**
[Por que estou investigando isso?]

**Escopo da Pesquisa:**
1. [Tópico 1]
2. [Tópico 2]
3. [Tópico 3]

**Checklist - Pesquisa:**
- [ ] Documentação oficial lida
- [ ] Exemplos estudados
- [ ] Testes práticos feitos
- [ ] Comparações com alternativas
- [ ] Conclusões documentadas

**Conclusões:**
1. [Descoberta 1]
2. [Descoberta 2]
3. [Decisão final]

**Recomendação:**
[O que devo fazer baseado na pesquisa]

**Links & Recursos:**
- [Resource 1]
- [Resource 2]
- [Arquivo de documentação criado]

**Próximos Passos:**
[O que fazer com esse conhecimento]
```

---

## 🚨 TEMPLATE 6: BLOCKER / PROBLEMA

**Usado para:** Identificar e comunicar problemas que impedem progresso

```
**Status:** Bloqueado 🚨

**Problema:**
[O que está bloqueando]

**Impacto:**
[O que não conseguimos fazer por causa disso]

**Causa:**
[Por que está bloqueado]

**Solução Necessária:**
[O que precisa acontecer para desbloquear]

**Dependências:**
- [ ] Ação do Gustavo: [O que você precisa fazer]
- [ ] Ação de terceiros: [Se houver]
- [ ] Pré-requisito técnico: [Se houver]

**Timeline:**
- Bloqueado desde: [data]
- Urgência: Crítica / Alta / Média / Baixa

**Workaround Temporário:**
[Se houver forma de contornar temporariamente]

**Status das Ações:**
- Aguardando: [quem/o quê]
- Prazo: [quando você pode resolver]
```

---

## 💡 TEMPLATE 7: CONSOLIDAÇÃO DIÁRIA (HEARTBEAT)

**Usado para:** Resumo automático do final do dia

```
**[HEARTBEAT] Consolidação Diária - YYYY-MM-DD**

**Status:** Concluído ✅

**Resumo do Dia:**
[1-2 linhas do que foi feito]

**Checklist - Rotina Diária:**
- [x] Conversas analisadas
- [x] Lições extraídas
- [x] Decisões documentadas
- [x] Projetos atualizados
- [x] Blockers identificados
- [x] Git commit feito
- [x] Relatório criado

**O Que Foi Feito:**
1. [Tarefa 1] - Status
2. [Tarefa 2] - Status
3. [Tarefa n] - Status

**Lições Aprendidas:**
- [Aprendizado 1]
- [Aprendizado 2]

**Decisões Tomadas:**
- [Decisão 1] (motivo)
- [Decisão 2] (motivo)

**Projetos Avançados:**
- [Projeto 1]: X% → Y% (progresso)
- [Projeto 2]: X% → Y% (progresso)

**Blockers Identificados:**
- [Blocker 1] (quando resolve?)
- [Blocker 2] (quando resolve?)

**Próximas 24h:**
1. [Tarefa planejada]
2. [Tarefa planejada]

**Relatório Completo:**
[Arquivo memory/YYYY-MM-DD.md]
```

---

## 🎯 RESUMO: Como Usar

**Quando criar card:**
- ✅ Antes de começar uma tarefa → Tipo apropriado + Checklist
- ✅ Se encontrar blocker → Template BLOCKER imediatamente
- ✅ Ao terminar → Mover pra "Concluído" + atualizar resultado

**Nível de Detalhamento:**
- ❌ Genérico ("Fazer coisa")
- ✅ Específico ("Criar script que faz X, salva em Y, documenta em Z")

**Para Gustavo Entender:**
- Sempre incluir POR QUÊ
- Sempre incluir PRÓXIMOS PASSOS
- Sempre linkar documentação
- Sempre mostrar PROGRESSO (não vago)

**Checklist sempre deve ter:**
- Ações concretas (não genéricas)
- Itens testáveis/verificáveis
- Ordem lógica

---

**Use esses templates! Gustavo vai entender perfeitamente o que você tá fazendo 🚀**
