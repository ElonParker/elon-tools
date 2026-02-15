#!/usr/bin/env node

/**
 * send-email.js - Enviar emails via Gmail API (OAuth2)
 * 
 * RFC 2822 (formato email) + RFC 2047 (headers UTF-8)
 * Uso: node send-email.js --to email@example.com --subject "Teste" --body "Conteúdo"
 */

const https = require('https');
require('dotenv').config();

// Carregar access token do .env
const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ Erro: GOOGLE_ACCESS_TOKEN não configurado em .env');
  process.exit(1);
}

/**
 * Encoding RFC 2047: converte strings com caracteres especiais
 * para padrão SMTP-safe com UTF-8
 */
function encodeRFC2047(text) {
  const encoded = Buffer.from(text, 'utf-8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
}

/**
 * Enviar email via Gmail API
 */
function sendEmail(options) {
  const {
    to = 'test@example.com',
    subject = 'Teste',
    body = 'Conteúdo do email'
  } = options;

  // RFC 2047 para subject com caracteres especiais
  const encodedSubject = encodeRFC2047(subject);

  // Montar email RFC 2822
  const emailContent = `From: elon.parker@castelodigital.net
To: ${to}
Subject: ${encodedSubject}
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

${body}`;

  // Codificar em base64 para raw Gmail API
  const base64Email = Buffer.from(emailContent)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const payload = JSON.stringify({ raw: base64Email });

  const httpOptions = {
    hostname: 'www.googleapis.com',
    path: '/gmail/v1/users/me/messages/send',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(httpOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.id) {
            resolve({
              success: true,
              messageId: response.id,
              to,
              subject
            });
          } else {
            reject(response);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// CLI
if (require.main === module) {
  const args = require('minimist')(process.argv.slice(2));
  
  sendEmail({
    to: args.to || 'test@example.com',
    subject: args.subject || 'Teste',
    body: args.body || 'Conteúdo do email'
  })
    .then((result) => {
      console.log('✅ Email enviado!');
      console.log(`Para: ${result.to}`);
      console.log(`Assunto: ${result.subject}`);
      console.log(`Message ID: ${result.messageId}`);
    })
    .catch((error) => {
      console.error('❌ Erro ao enviar email:');
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    });
}

module.exports = { sendEmail, encodeRFC2047 };
