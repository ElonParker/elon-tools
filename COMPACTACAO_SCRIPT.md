# 🔧 Script de Compactação - Referência

Pseudocódigo do script que roda automaticamente para compactar memória.

---

## Pseudocódigo: Compactação Automática

```python
def compactacao_diaria():
    """
    Roda automaticamente ao final de cada dia (23h)
    ou quando solicitado manualmente.
    """
    
    print("🔥 Iniciando compactação...")
    
    # PASSO 1: Capability Evolving
    print("\n1️⃣  Capability Evolving...")
    sessao_atual = get_sessao_contexto()  # ~200k tokens de contexto
    
    padroes = analisa_sessao(sessao_atual)
    # Sugere:
    # - 5 lições aprendidas
    # - 2 decisões tomadas
    # - 3 projetos com status update
    # - 1 novo bloqueio
    # - 1 novo contato
    
    print(f"  ✅ Identificadas {len(padroes)} sugestões")
    
    # PASSO 2: Extração Manual (Validação)
    print("\n2️⃣  Extração Manual...")
    
    for licao in padroes['licoes']:
        valida = valida_licao(licao)
        if valida:
            append_arquivo('memory/topics/lessons.md', licao)
            print(f"  ✅ Lição: {licao['titulo']}")
    
    for decisao in padroes['decisoes']:
        valida = valida_decisao(decisao)
        if valida:
            append_arquivo('memory/topics/decisions.md', decisao)
            print(f"  ✅ Decisão: {decisao['titulo']}")
    
    for projeto in padroes['projetos']:
        update_arquivo('memory/topics/projects.md', projeto)
        print(f"  ✅ Projeto: {projeto['nome']} → {projeto['status']}")
    
    for bloqueio in padroes['bloqueios']:
        append_arquivo('memory/topics/pending.md', bloqueio)
        print(f"  ✅ Bloqueio: {bloqueio['descricao']}")
    
    for contato in padroes['contatos']:
        update_arquivo('memory/topics/people.md', contato)
        print(f"  ✅ Contato: {contato['nome']}")
    
    # PASSO 3: Nota Diária
    print("\n3️⃣  Nota Diária...")
    
    data_hoje = datetime.now().strftime('%Y-%m-%d')
    diario = {
        'resumo': gera_resumo(sessao_atual),
        'conversa': get_mensagens(sessao_atual),
        'timestamp': datetime.now(),
        'tamanho': len(sessao_atual),
        'compactacao_feita': True
    }
    
    escreve_arquivo(f'memory/{data_hoje}.md', diario)
    print(f"  ✅ Consolidado: memory/{data_hoje}.md")
    
    # PASSO 4: Verificação - Nunca Pular!
    print("\n4️⃣  Verificação: Nunca Pular...")
    
    if len(padroes['licoes']) > 0 and not foi_extraido_lessons():
        print("  ❌ ERRO: Lições não foram extraídas!")
        print("  ⚠️  Você vai perder 80% do conhecimento!")
        return False
    
    if len(padroes['decisoes']) > 0 and not foi_extraido_decisions():
        print("  ❌ ERRO: Decisões não foram extraídas!")
        print("  ⚠️  Você vai esquecer decisões importantes!")
        return False
    
    # Tudo ok!
    print("  ✅ Nenhuma extração foi pulada")
    
    # FINAL: Git Commit
    print("\n💾 Git Commit...")
    git_commit(f"""
    chore: compactacao diaria {data_hoje}
    
    - Analisadas {len(padroes['licoes'])} licoes
    - Extraidas {len(padroes['decisoes'])} decisoes
    - Atualizados {len(padroes['projetos'])} projetos
    - Adicionados {len(padroes['bloqueios'])} bloqueios
    - Consolidado diario raw
    """)
    print("  ✅ Histórico preservado em Git")
    
    print("\n✅ Compactação concluída com sucesso!")
    return True
```

---

## 🚀 Como Chamar

### Automático (Todo dia 23h)
```
[HEARTBEAT chega às 23h]
    ↓
[Roda compactacao_diaria()]
    ↓
[Notifica Gustavo: "Compactação feita! X lições, Y decisões"]
```

### Manual (Quando Solicitado)
```
Gustavo: "Elon, compacta a memória agora?"
Elon:    [Roda compactacao_diaria()]
         "Pronto! Extraí 3 lições, 2 decisões, 5 updates"
```

---

## 📊 Saída Esperada

```
🔥 Iniciando compactação...

1️⃣  Capability Evolving...
  ✅ Identificadas 11 sugestões

2️⃣  Extração Manual...
  ✅ Lição: Chaves inválidas causaram problemas
  ✅ Lição: Memory em 4 camadas funciona melhor
  ✅ Lição: Topic files separam bem a responsabilidade
  ✅ Decisão: Haiku 4.5 é padrão (economiza tokens)
  ✅ Decisão: Nunca deletar dados (INVIOLÁVEL)
  ✅ Projeto: OpenClaw → ✅ Operacional
  ✅ Projeto: Memória → ✅ Implementada
  ✅ Bloqueio: Trello setup ainda pendente
  ✅ Contato: Gustavo (atualizado)

3️⃣  Nota Diária...
  ✅ Consolidado: memory/2026-02-15.md

4️⃣  Verificação: Nunca Pular...
  ✅ Nenhuma extração foi pulada

💾 Git Commit...
  ✅ Histórico preservado em Git

✅ Compactação concluída com sucesso!
```

---

## 🔐 Validações Internas

```
if NOT foi_extraido_lessons() AND len(licoes) > 0:
    ERRO("Perdemos 80% do conhecimento!")
    return False

if NOT foi_extraido_decisions() AND len(decisoes) > 0:
    ERRO("Esquecemos decisões importantes!")
    return False

if NOT foi_consolidado_diario():
    ERRO("Raw capture não foi salvo!")
    return False

if NOT foi_feito_git_commit():
    ERRO("Histórico não foi preservado!")
    return False
```

---

## ⚙️ Status Atual

- ✅ Modelo de compactação definido (imagem Gustavo)
- ✅ Estrutura em memory/topics/compactacao.md
- ✅ HEARTBEAT.md configurado (mas pausado)
- ⏳ **Aguardando aprovação Gustavo:**
  - [ ] "Compacta todo dia às 23h?"
  - [ ] "Notificação via Telegram?"
  - [ ] "Qual detalhamento?"

---

## 🔗 Relacionados
- compactacao.md → Descrição do modelo (4 passos)
- HEARTBEAT.md → Configuração de tarefas periódicas
- lessons.md → Destino das lições
- decisions.md → Destino das decisões
- Git commit → Preservação do histórico
