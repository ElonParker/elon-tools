# Gmail Integration — Status & Capacidades

**Data Ativação:** 2026-02-15  
**Status:** ✅ OPERACIONAL

---

## Credenciais

- **Email:** elon.parker@castelodigital.net
- **Authenticação:** OAuth2 (Google)
- **Scopes:** `gmail.send` (envio de emails)
- **Tokens:** Armazenados em `.env` (não versionado)

---

## Capacidades Atuais

✅ **Enviar emails** via Gmail API
- Endpoint: `POST /gmail/v1/users/me/messages/send`
- Testado em: 2026-02-15 (email enviado pra glcbranco96@icloud.com)
- Message ID primeiro teste: `19c5fbb186f9b2a4`
- **RFC 2047 encoding** para subjects com caracteres especiais (ç, ã, é, etc)
  - Problema corrigido: Subject "Teste de AutenticAÇÃÃÃÃÃo" → "Teste de Autenticação" ✅
  - Solução: `=?UTF-8?B?[base64]?=` standard SMTP

### Script Pronto
- **Local:** `scripts/send-email.js`
- **Uso:** `node scripts/send-email.js --to email@test.com --subject "Assunto" --body "Conteúdo"`
- **Encoding automático** de caracteres especiais no subject

---

## Futura Expansão

Se precisar:
- **Ler inbox** (scope: `gmail.readonly`)
- **Ler/enviar** (scope: `gmail`)
- **Gerenciar rótulos** (scope: `gmail.labels`)
- **Calendar** (scope: `calendar`)

Basta Gustavo aprovar e refazer OAuth com escopo maior.

---

## Integração com OpenClaw

Agora posso:
1. Enviar lembretes por email
2. Notificar resultados de tarefas
3. Consolidar relatórios automáticos
4. Responder via email (quando expandir scopes)

Tudo integrado! 🚀
