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
      // A preferência por IPv4 é definida globalmente em app.ts
      // (dns.setDefaultResultOrder) — ver a explicação lá.
      //
      // Timeouts explícitos: os padrões do nodemailer são longos demais
      // (2 min só para conectar) e deixariam a requisição pendurada além do
      // limite do navegador.
      connectionTimeout: 20_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
  }
  return transporter;
}

/** Descarta o transporte em cache — usado quando a config muda ou falha. */
export function resetTransporter(): void {
  transporter = null;
}

/**
 * Testa a conexão e a autenticação SMTP sem enviar mensagem.
 * Usado no diagnóstico para separar "não conecta" de "não envia".
 */
export async function verifySmtp(): Promise<{ ok: boolean; error?: string; ms: number }> {
  if (!isEmailEnabled()) return { ok: false, error: 'Serviço de e-mail desligado', ms: 0 };
  const started = Date.now();
  try {
    await getTransporter().verify();
    const ms = Date.now() - started;
    emailLogger.info({ ms }, 'Handshake SMTP concluído');
    return { ok: true, ms };
  } catch (error: any) {
    const ms = Date.now() - started;
    resetTransporter();
    emailLogger.warn({ ms, err: error?.message }, 'Handshake SMTP falhou');
    return { ok: false, error: error?.message || String(error), ms };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Layout base dos e-mails da GIO: header escuro com wordmark, corpo claro,
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
            ${escapeHtml(input.actionLabel || 'Abrir na GIO')}
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
              Você recebeu este e-mail porque tem notificações ativas na GIO.
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
   * derrubar fluxo de negócio. Retorna o resultado com a causa do erro,
   * que o diagnóstico exibe para o admin.
   */
  async sendWithResult(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ sent: boolean; error?: string }> {
    if (!isEmailEnabled()) return { sent: false, error: 'Serviço de e-mail desligado' };

    const mail = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      to,
      subject,
      html,
    };

    let lastError = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await getTransporter().sendMail(mail);
        emailLogger.info({ to, subject }, 'E-mail enviado');
        return { sent: true };
      } catch (error: any) {
        lastError = error?.message || String(error);
        emailLogger.warn({ to, subject, attempt, err: lastError }, 'Falha ao enviar e-mail');
        // Conexão pode ter ficado num estado ruim — força reconectar no retry
        resetTransporter();
        if (attempt === 2) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return { sent: false, error: lastError };
  },

  /** Atalho booleano — usado pelos fluxos que só querem disparar e seguir. */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    const { sent } = await this.sendWithResult(to, subject, html);
    return sent;
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
