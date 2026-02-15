# Topic: Chave Anthropic & Autenticação

## Status Atual
- ❌ Chave atual NÃO FUNCIONA (invalid x-api-key)
- ⚠️ Testadas 3 chaves diferentes → todas rejeitadas
- 🔄 Aguardando chave NOVA do Gustavo

## Problema Identificado
- API rejeita com: `authentication_error: invalid x-api-key`
- Configuração: `env.vars.ANTHROPIC_API_KEY`
- Última tentativa: 2026-02-15 03:55:31 UTC

## Solução Pendente
1. Gustavo gera chave NOVA em: https://console.anthropic.com/account/keys
2. Eu atualizo: `gateway config.patch`
3. Teste: curl direto + OpenClaw

## Timeline
- 2026-02-15 03:40 - Chave 1 testada (rejeitada)
- 2026-02-15 03:42 - Chave 2 testada (rejeitada)  
- 2026-02-15 03:43 - Chave 3 testada (rejeitada)
- 2026-02-15 04:00 - Config atualizada no OpenClaw (reinicio ok)
- 2026-02-15 04:05 - Teste com env var (rejeitada)

## Links Relacionados
- MEMORY.md → API & Modelos
- Testes: /data/.openclaw/workspace/tests/anthropic-auth.log (criar depois)
