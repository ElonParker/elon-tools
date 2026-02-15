# 💡 Lessons

Erros cometidos, descobertas técnicas, padrões que informam decisões futuras.

---

## 🔴 Erros (Não Repetir)

### Chaves Anthropic Inválidas
- **Erro:** Testei 3 chaves de autenticação - todas rejeitadas
- **Causa:** Chaves não eram válidas/ativas na Anthropic
- **Lição:** SEMPRE gerar chave NOVA ao invés de reutilizar antigas
- **Como evitar:**
  - Pedir chave nova em console.anthropic.com
  - Copiar direto sem espaços/edições
  - Testar imediatamente com curl antes de configurar

### Config.patch com Estrutura Errada
- **Erro:** Tentei `models.providers.anthropic` e falhou
- **Causa:** OpenClaw espera chave em `env.vars`
- **Lição:** Consultar schema.config antes de fazer patch
- **Comando correto:** `gateway config.patch` com `env.vars.ANTHROPIC_API_KEY`

---

## 🟡 Descobertas Técnicas

### OpenClaw Memory System
- **Descoberta:** Memory_search + memory_get funcionam bem, mas precisam de organização
- **Implementação:** Topic files pattern (projects, decisions, lessons, people, pending, daily)
- **Benefício:** Escalável infinitamente, sem perder contexto
- **Padrão:** 4 camadas (Sessão → Diário → Topics → Índice)

### Gateway Restart Behavior
- **Descoberta:** Config.patch dispara SIGUSR1 automaticamente
- **Tempo:** ~2 segundos de delay antes de reiniciar
- **Log:** Salvo em `/data/.openclaw/restart-sentinel.json`
- **Implicação:** Não precisa fazer restart manual após config change

### Telegram Connector
- **Funcionamento:** ✅ OK (user 5955985265 pareado)
- **Policy:** allowlist (só recebe msgs desse user)
- **Stream Mode:** partial (envia parcialmente durante digitação)
- **Implicação:** Pronto pra processar mensagens quando API funcionar

---

## 🟢 Padrões Recomendados

### Para Memória
```
✅ Usar 4 camadas (não 2 ou 3)
✅ Topic files com responsabilidade clara
✅ MEMORY.md como índice compacto
✅ Diários com retenção 30 dias
✅ Links para facilitar navegação
```

### Para Configuração
```
✅ config.patch pra mudanças pequenas
✅ Sempre validar com config.schema
✅ Git commit após cada mudança
✅ Documentar razão em commit message
```

### Para Autenticação
```
✅ Testar ANTES de configurar
✅ Usar curl pra validação
✅ Documentar resultado do teste
✅ Manter histórico de tentativas
```

---

## 📚 O Que Aprendi Sobre Gustavo

### Preferências Técnicas
- Gosta de **soluções visuais** (enviou 2 imagens com arquitetura)
- Aprecia **documentação clara** (pediu explicação detalhada de memória)
- **Direto ao ponto** (sem enrolação)
- Prefere **português sempre**

### Padrão de Trabalho
- **Proativo:** Manda solutions antes de eu pedir
- **Organizado:** Segue estrutura (MEMORY.md → Topics → Diários)
- **Exigente:** Quer tudo bem documentado
- **Prático:** Testa antes de implementar em produção

---

## 🔮 Próximas Lições Esperadas

- [ ] Como Gustavo prefere relatórios (format, frequência?)
- [ ] Qual velocidade de resposta é ideal?
- [ ] Como estruturar projetos (naming, estrutura de pastas)
- [ ] Integração com Trello (quando configurar)

---

## 🔗 Relacionados
- decisions.md → Decisões baseadas em lições
- projects.md → Como aplicar padrões
- people.md → Como trabalhar com Gustavo
