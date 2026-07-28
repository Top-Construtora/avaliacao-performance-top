/**
 * Envio de e-mail da GIO a partir da infraestrutura da Supabase.
 *
 * Por que existe: o backend roda no Render, que descarta tráfego de saída nas
 * portas de SMTP (25/465/587) — a conexão fica pendurada até estourar o tempo.
 * O runtime de Edge Functions da Supabase não tem esse bloqueio, então o SMTP
 * do Gmail funciona daqui. Mesmo padrão já usado em produção no projeto GIO.
 *
 * O backend chama esta função por HTTPS (porta 443, que o Render libera)
 * autenticando com a service key do projeto.
 *
 * Secrets necessários (Supabase > Edge Functions > Secrets):
 *   GMAIL_EMAIL         - conta remetente
 *   GMAIL_APP_PASSWORD  - senha de app do Google (não a senha da conta)
 *
 * Deploy: supabase functions deploy send-email
 */
import nodemailer from 'npm:nodemailer@6.9.13';

interface SendEmailPayload {
  to?: string;
  subject?: string;
  html?: string;
  replyTo?: string;
  /** Só testa a conexão SMTP, sem enviar mensagem. */
  verify?: boolean;
}

const GMAIL_EMAIL = Deno.env.get('GMAIL_EMAIL') ?? '';
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? '';
const FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') ?? 'GIO — Gente & Gestão';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Porta 465 com TLS implícito — é a que o Gmail aceita de forma mais estável
 * a partir do runtime da Supabase (o STARTTLS da 587 é mais sensível a
 * ambientes serverless).
 */
function criarTransporte() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_EMAIL, pass: GMAIL_APP_PASSWORD },
    connectionTimeout: 20_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ sent: false, error: 'Use POST' }, 405);
  }

  if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
    return json(
      { sent: false, error: 'GMAIL_EMAIL/GMAIL_APP_PASSWORD não configurados nos secrets' },
      500,
    );
  }

  let payload: SendEmailPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ sent: false, error: 'Corpo inválido (JSON esperado)' }, 400);
  }

  const transporter = criarTransporte();

  if (payload.verify) {
    const inicio = Date.now();
    try {
      await transporter.verify();
      return json({ ok: true, ms: Date.now() - inicio, sender: GMAIL_EMAIL });
    } catch (error) {
      return json(
        { ok: false, ms: Date.now() - inicio, error: (error as Error)?.message ?? String(error) },
        502,
      );
    }
  }

  const { to, subject, html, replyTo } = payload;
  if (!to || !subject || !html) {
    return json({ sent: false, error: 'Campos obrigatórios: to, subject, html' }, 400);
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${GMAIL_EMAIL}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return json({ sent: true });
  } catch (error) {
    return json({ sent: false, error: (error as Error)?.message ?? String(error) }, 502);
  }
});
