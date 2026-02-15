# Topic: OpenClaw Configuração & Gateway

## Status Atual (2026-02-15)
- ✅ Gateway: Local mode (127.0.0.1:18789)
- ✅ Browser: Headless + noSandbox
- ✅ Telegram: Conectado (user 5955985265)
- ✅ Config: Válida sem erros
- ❌ API Anthropic: Não autenticada (chave inválida)

## Estrutura Gateway
```
Mode: local
Auth: token
TLS: off
Headless: true
NoSandbox: true
```

## Canais Ativos
| Canal | Status | Config |
|-------|--------|--------|
| Telegram | ✅ Ativo | allowlist, user 5955985265 |
| WhatsApp | ✅ Pronto | (não testado) |
| Discord | ✅ Pronto | (não testado) |
| Slack | ✅ Pronto | (não testado) |
| Google Chat | ✅ Pronto | (não testado) |

## Plugins Habilitados
- ✅ telegram, whatsapp, discord, slack, googlechat, nostr
- ❌ imessage, signal (desativados)

## Comandos Habilitados
- ✅ native: auto
- ✅ nativeSkills: auto
- ✅ bash: true
- ✅ restart: true

## Restart Events
| Data | Hora | Motivo | PID |
|------|------|--------|-----|
| 2026-02-15 | 04:00:00 | config.patch | 34 |
| Signal: SIGUSR1 | Delay: 2000ms | Mode: emit | |

## Próximas Ações
- [ ] Validar chave Anthropic quando nova
- [ ] Testar cada canal (Telegram já ok)
- [ ] Ativar signal/imessage se necessário
- [ ] Configurar webhooks se usar remote mode

## Links Relacionados
- MEMORY.md → Gateway & Infraestrutura
- anthropic-api.md → Problema de autenticação
