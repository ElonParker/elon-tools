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
 * Resend — modern transactional email API.
 * Free tier: 100 emails/day, 3000/month.
 * Docs: https://resend.com/docs
 */
export class ResendProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private fromEmail: string = 'ElonTools <noreply@elontools.com>',
  ) {}

  async send(params: { to: string; subject: string; html: string; from?: string }): Promise<boolean> {
    const res = await fetch('https://api.resend.com/emails', {
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
<body style="margin: 0; padding: 0; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 500px; margin: 40px auto; padding: 0 20px;">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 16px; padding: 40px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 8px;">⚡</div>
      <h1 style="color: #f8fafc; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ElonTools</h1>
      <p style="color: #94a3b8; font-size: 15px; margin: 0 0 32px;">Seu link de acesso chegou</p>
      
      <a href="${url}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;">Acessar minha conta</a>
      
      <p style="color: #64748b; font-size: 13px; margin: 32px 0 0; line-height: 1.6;">
        Este link expira em <strong style="color: #94a3b8;">15 minutos</strong>.<br>
        Se você não solicitou, ignore este email.
      </p>
    </div>
    <p style="text-align: center; color: #475569; font-size: 12px; margin-top: 16px;">
      © ${new Date().getFullYear()} ElonTools — elontools.com
    </p>
  </div>
</body>
</html>`.trim();
}
