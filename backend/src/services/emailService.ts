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
 * Provedor de envio ativo.
 *
 * O Render — onde este backend roda — descarta tráfego de saída nas portas de
 * SMTP (25/465/587), o que faz a conexão ficar pendurada até estourar o tempo.
 * Só a saída HTTPS funciona (é por ela que falamos com o Supabase). Por isso
 * os dois provedores viáveis em produção falam HTTP/443:
 *
 * - `edge`: delega para uma Edge Function na Supabase, que abre o SMTP do
 *   Gmail de dentro da infraestrutura deles (sem bloqueio de porta). Usa o
 *   e-mail corporativo como remetente e não depende de serviço de terceiro.
 * - `brevo`: API HTTP da Brevo. Funciona, mas o remetente sai por um
 *   subdomínio compartilhado (`*.brevosend.com`) e a conta trava por IP
 *   autorizado — o Render alterna de IP, então quebra sozinho de vez em quando.
 *
 * `smtp` direto só serve para desenvolvimento local, onde não há bloqueio.
 */
export type EmailProvider = 'edge' | 'brevo' | 'smtp' | 'none';

/**
 * Chave da Brevo já higienizada: valores colados em painel de hospedagem
 * costumam vir com espaço ou quebra de linha no fim.
 */
export function brevoApiKey(): string {
  return (process.env.BREVO_API_KEY || '').trim();
}

/**
 * Descreve a chave sem expor o valor — o suficiente para diagnosticar
 * credencial trocada (a da aba SMTP não serve) ou cópia incompleta.
 */
export function describeBrevoKey(): string | null {
  const key = brevoApiKey();
  if (!key) return null;
  const prefixoEsperado = key.startsWith('xkeysib-');
  return `${key.slice(0, 8)}... (${key.length} caracteres${
    prefixoEsperado ? '' : ' - deveria comecar com "xkeysib-"'
  })`;
}

/** URL da Edge Function de envio, se o projeto Supabase estiver configurado. */
function edgeFunctionUrl(): string {
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  return base ? `${base}/functions/v1/send-email` : '';
}

function isEdgeConfigured(): boolean {
  return Boolean(edgeFunctionUrl() && process.env.SUPABASE_SERVICE_KEY);
}

/**
 * A escolha é explícita via `EMAIL_PROVIDER` para que a troca em produção
 * seja uma variável de ambiente — e possa ser revertida na mesma velocidade
 * se o provedor novo falhar. Sem ela, mantém-se a ordem automática antiga.
 */
export function getEmailProvider(): EmailProvider {
  if (process.env.EMAIL_ENABLED !== 'true') return 'none';

  const escolhido = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (escolhido === 'edge' && isEdgeConfigured()) return 'edge';
  if (escolhido === 'brevo' && brevoApiKey()) return 'brevo';
  if (escolhido === 'smtp' && process.env.EMAIL_HOST && process.env.EMAIL_USER) return 'smtp';

  if (brevoApiKey()) return 'brevo';
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'smtp';
  return 'none';
}

/**
 * E-mail ligado exige EMAIL_ENABLED=true e um provedor configurado.
 * Sem isso o serviço vira no-op silencioso (dev/staging rodam sem e-mail).
 */
export function isEmailEnabled(): boolean {
  return getEmailProvider() !== 'none';
}

function senderAddress(): string {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
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
 * Chama a Edge Function `send-email` na Supabase (HTTPS/443). É ela que abre
 * o SMTP do Gmail, de dentro da infraestrutura da Supabase.
 */
async function callEdgeFunction(
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  try {
    const response = await fetch(edgeFunctionUrl(), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    const raw = await response.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { error: raw.slice(0, 300) };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : data?.error || `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return { ok: false, status: 0, data: null, error: error?.message || String(error) };
  }
}

async function sendViaEdge(
  to: string,
  subject: string,
  html: string,
): Promise<{ sent: boolean; error?: string }> {
  const result = await callEdgeFunction({
    to,
    subject,
    html,
    ...(process.env.EMAIL_REPLY_TO ? { replyTo: process.env.EMAIL_REPLY_TO } : {}),
  });
  if (result.ok && result.data?.sent) return { sent: true };
  return { sent: false, error: result.error || 'Edge Function não confirmou o envio' };
}

/** Envia via API HTTP da Brevo (porta 443). */
async function sendViaBrevo(
  to: string,
  subject: string,
  html: string,
): Promise<{ sent: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey(),
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderAddress(), name: 'GIO — Gente & Gestão' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(process.env.EMAIL_REPLY_TO ? { replyTo: { email: process.env.EMAIL_REPLY_TO } } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      return { sent: false, error: `Brevo respondeu ${response.status}: ${detail}` };
    }
    return { sent: true };
  } catch (error: any) {
    return { sent: false, error: error?.message || String(error) };
  }
}

/**
 * Testa o provedor ativo sem enviar mensagem: chave da API (Brevo) ou
 * conexão + autenticação (SMTP). Separa "não conecta" de "não envia".
 */
export async function verifySmtp(): Promise<{
  ok: boolean;
  error?: string;
  ms: number;
  provider: EmailProvider;
}> {
  const provider = getEmailProvider();
  if (provider === 'none') {
    return { ok: false, error: 'Serviço de e-mail desligado', ms: 0, provider };
  }

  const started = Date.now();

  if (provider === 'edge') {
    const result = await callEdgeFunction({ verify: true });
    const ms = Date.now() - started;
    if (result.ok && result.data?.ok) {
      emailLogger.info({ ms, sender: result.data?.sender }, 'Edge Function de e-mail respondeu');
      return { ok: true, ms, provider };
    }
    return {
      ok: false,
      error: result.error || 'Edge Function não confirmou o handshake SMTP',
      ms,
      provider,
    };
  }

  if (provider === 'brevo') {
    try {
      const response = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': brevoApiKey(), accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      const ms = Date.now() - started;
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 200);
        return {
          ok: false,
          error: `chave rejeitada (${response.status}): ${detail}`,
          ms,
          provider,
        };
      }
      emailLogger.info({ ms }, 'Brevo autenticada');
      return { ok: true, ms, provider };
    } catch (error: any) {
      return {
        ok: false,
        error: error?.message || String(error),
        ms: Date.now() - started,
        provider,
      };
    }
  }

  try {
    await getTransporter().verify();
    const ms = Date.now() - started;
    emailLogger.info({ ms }, 'Handshake SMTP concluído');
    return { ok: true, ms, provider };
  } catch (error: any) {
    const ms = Date.now() - started;
    resetTransporter();
    emailLogger.warn({ ms, err: error?.message }, 'Handshake SMTP falhou');
    return { ok: false, error: error?.message || String(error), ms, provider };
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
    const provider = getEmailProvider();
    if (provider === 'none') return { sent: false, error: 'Serviço de e-mail desligado' };

    if (provider === 'edge') {
      const result = await sendViaEdge(to, subject, html);
      if (result.sent) {
        emailLogger.info({ to, subject }, 'E-mail enviado (Edge Function)');
      } else {
        emailLogger.warn({ to, subject, err: result.error }, 'Falha ao enviar (Edge Function)');
      }
      return result;
    }

    if (provider === 'brevo') {
      const result = await sendViaBrevo(to, subject, html);
      if (result.sent) {
        emailLogger.info({ to, subject }, 'E-mail enviado (Brevo)');
      } else {
        emailLogger.warn({ to, subject, err: result.error }, 'Falha ao enviar (Brevo)');
      }
      return result;
    }

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
