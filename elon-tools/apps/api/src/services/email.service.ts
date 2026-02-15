/**
 * Pluggable email provider interface + MailChannels implementation.
 */

export interface EmailProvider {
  send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<boolean>;
}

/**
 * MailChannels — free transactional email via Cloudflare Workers.
 * No API key needed when sending from a Worker (uses DNS SPF).
 * Docs: https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels
 */
export class MailChannelsProvider implements EmailProvider {
  constructor(private fromEmail: string = 'noreply@elontools.com') {}

  async send(params: { to: string; subject: string; html: string; from?: string }): Promise<boolean> {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: params.from ?? this.fromEmail, name: 'ElonTools' },
        subject: params.subject,
        content: [{ type: 'text/html', value: params.html }],
      }),
    });
    return res.status === 202 || res.status === 200;
  }
}

/**
 * Generic HTTP email provider (SendGrid, Resend, etc.)
 * Requires EMAIL_API_KEY secret.
 */
export class HttpEmailProvider implements EmailProvider {
  constructor(
    private apiUrl: string,
    private apiKey: string,
    private fromEmail: string = 'noreply@elontools.com',
  ) {}

  async send(params: { to: string; subject: string; html: string; from?: string }): Promise<boolean> {
    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: params.from ?? this.fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    return res.ok;
  }
}

/**
 * Build magic link email HTML.
 */
export function buildMagicLinkEmail(url: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="margin: 0 0 16px; color: #111;">🔐 ElonTools — Login</h2>
    <p style="color: #555; line-height: 1.6;">Clique no botão abaixo para acessar sua conta. Este link expira em <strong>15 minutos</strong>.</p>
    <a href="${url}" style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Entrar no ElonTools</a>
    <p style="color: #999; font-size: 13px;">Se você não solicitou este login, ignore este email.</p>
  </div>
</body>
</html>`.trim();
}
