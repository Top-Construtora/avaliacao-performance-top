import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../lib/logger';

const emailLogger = logger.child({ module: 'email' });

export interface NotificationEmailInput {
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string;
}

let transporter: Transporter | null = null;

/**
 * E-mail ligado exige EMAIL_ENABLED=true + credenciais SMTP completas.
 * Sem isso o serviço vira no-op silencioso (dev/staging funcionam sem SMTP).
 */
export function isEmailEnabled(): boolean {
  return (
    process.env.EMAIL_ENABLED === 'true' &&
    !!process.env.EMAIL_HOST &&
    !!process.env.EMAIL_USER &&
    !!process.env.EMAIL_PASS
  );
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.EMAIL_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Layout base dos e-mails do GIO: header escuro com wordmark, corpo claro,
 * botão de ação em lima. CSS inline (obrigatório para clients de e-mail).
 */
export function renderNotificationEmail(input: NotificationEmailInput): string {
  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const fullActionUrl =
    input.actionUrl && frontendUrl
      ? input.actionUrl.startsWith('http')
        ? input.actionUrl
        : `${frontendUrl}${input.actionUrl}`
      : null;

  const button = fullActionUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr><td style="border-radius:8px;background:#D2FF00;">
          <a href="${fullActionUrl}"
             style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#1A1A1A;text-decoration:none;border-radius:8px;">
            ${escapeHtml(input.actionLabel || 'Abrir no GIO')}
          </a>
        </td></tr>
      </table>`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#F3F4F6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="background:#1A1A1A;border-radius:12px 12px 0 0;padding:20px 32px;">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#FFFFFF;">GIO</span>
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#D2FF00;margin-left:8px;">Gente &amp; Gestão</span>
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;border-radius:0 0 12px 12px;padding:32px;">
            <h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#1A1A1A;">
              ${escapeHtml(input.title)}
            </h1>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
              ${escapeHtml(input.message)}
            </p>
            ${button}
            <p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#9CA3AF;">
              Você recebeu este e-mail porque tem notificações ativas no GIO.
              Para ajustar suas preferências, acesse Configurações &gt; Notificações no sistema.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const emailService = {
  /**
   * Envia um e-mail com 1 retry. Nunca lança — falha de e-mail não pode
   * derrubar fluxo de negócio. Retorna true se enviado.
   */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!isEmailEnabled()) return false;

    const mail = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      to,
      subject,
      html,
    };

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await getTransporter().sendMail(mail);
        emailLogger.info({ to, subject }, 'E-mail enviado');
        return true;
      } catch (error: any) {
        emailLogger.warn({ to, subject, attempt, err: error.message }, 'Falha ao enviar e-mail');
        if (attempt === 2) return false;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return false;
  },

  /**
   * Envia a mesma notificação para vários destinatários, sequencialmente
   * (evita estourar limites do provedor SMTP em envios "para todos").
   */
  async sendNotificationToMany(
    recipients: Array<{ email: string }>,
    input: NotificationEmailInput,
  ): Promise<void> {
    if (!isEmailEnabled() || recipients.length === 0) return;

    const html = renderNotificationEmail(input);
    let sent = 0;
    for (const recipient of recipients) {
      if (!recipient.email) continue;
      const ok = await this.send(recipient.email, `GIO — ${input.title}`, html);
      if (ok) sent++;
    }
    emailLogger.info(
      { total: recipients.length, sent, title: input.title },
      'Lote de e-mails processado',
    );
  },
};
