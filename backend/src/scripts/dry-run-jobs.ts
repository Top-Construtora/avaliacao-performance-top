/**
 * Dry-run dos jobs de lembrete: mostra quantas notificações e quantos e-mails
 * sairiam se `ENABLE_JOBS=true` fosse ligado agora, sem gravar nem enviar nada.
 *
 * Como funciona: substitui `notificationService.send` por um coletor e chama as
 * funções reais dos jobs — as consultas executadas são exatamente as de
 * produção, sem duplicação de lógica. O coletor replica em modo leitura o
 * anti-spam (cooldown/aggregate), o filtro de opt-out por categoria e o filtro
 * de usuário ativo com e-mail, que é o que `dispatchEmails` faz de verdade.
 *
 * Só roda os jobs que apenas leem. Ficam de fora `autoCloseExpired` e
 * `resyncPdiActions`, que escrevem no banco (encerram ciclos e pesquisas,
 * reespelham as ações do PDI).
 *
 * Uso: npm run dry-run-jobs
 */
import { supabaseAdmin } from '../config/supabase';
import { notificationService } from '../services/notificationService';
import { NOTIFICATION_TYPE_CONFIG, SendNotificationInput } from '../types/notification.types';
import {
  remindEvaluationCycleDeadline,
  remindStalePdis,
  remindSurveyDeadline,
  remindInterviewsTomorrow,
  remindCourseDeadline,
  remindPdiActionDeadlines,
} from '../jobs/reminderJobs';

interface PlannedSend {
  job: string;
  type: string;
  title: string;
  groupKey: string | null;
  /** Se este disparo manda e-mail (config do tipo, com o override do disparo aplicado). */
  emailType: boolean;
  /** Passaram pelo anti-spam: viram notificação in-app. */
  novos: string[];
  /** Barrados pelo cooldown/aggregate. */
  suprimidos: string[];
  /** Subconjunto de `novos` que também receberia e-mail. */
  comEmail: string[];
}

const planejados: PlannedSend[] = [];
let jobAtual = '';

/** Replica a checagem de anti-spam do send() — só leitura. */
async function passaNoAntiSpam(
  recipientId: string,
  input: SendNotificationInput,
): Promise<boolean> {
  const antiSpam = input.anti_spam || 'always';
  if (!input.group_key || antiSpam === 'always') return true;

  if (antiSpam === 'aggregate') {
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('group_key', input.group_key)
      .eq('read', false)
      .eq('archived', false)
      .limit(1)
      .single();
    return !data; // existindo, o send() agrega na notificação antiga e não manda e-mail
  }

  if (antiSpam === 'cooldown') {
    const minutos = input.cooldown_minutes || 30;
    const limite = new Date(Date.now() - minutos * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('group_key', input.group_key)
      .gte('created_at', limite)
      .limit(1)
      .single();
    return !data;
  }

  return true;
}

/** Replica o filtro de dispatchEmails: ativo, com e-mail, sem opt-out da categoria. */
async function quemReceberiaEmail(recipientIds: string[], categoria: string): Promise<string[]> {
  if (recipientIds.length === 0) return [];

  const [{ data: users }, { data: optOuts }] = await Promise.all([
    supabaseAdmin.from('users').select('id, email').in('id', recipientIds).eq('active', true),
    (supabaseAdmin as any)
      .from('notification_preferences')
      .select('user_id')
      .in('user_id', recipientIds)
      .eq('category', categoria)
      .eq('email_enabled', false),
  ]);

  const optOutIds = new Set((optOuts || []).map((p: any) => p.user_id));
  return (users || []).filter((u) => u.email && !optOutIds.has(u.id)).map((u) => u.id);
}

const sendInterceptado = async (_client: unknown, input: SendNotificationInput): Promise<void> => {
  const recipientIds = await notificationService.resolveRecipients(supabaseAdmin, input.targets);
  const filtrados = input.actor_id
    ? recipientIds.filter((id) => id !== input.actor_id)
    : recipientIds;
  if (filtrados.length === 0) return;

  const config = NOTIFICATION_TYPE_CONFIG[input.type];
  const novos: string[] = [];
  const suprimidos: string[] = [];

  for (const id of filtrados) {
    if (await passaNoAntiSpam(id, input)) novos.push(id);
    else suprimidos.push(id);
  }

  // O disparo pode desligar o e-mail mesmo em tipo com email: true.
  const enviaEmail = input.email ?? config.email;
  const comEmail = enviaEmail ? await quemReceberiaEmail(novos, config.category) : [];

  planejados.push({
    job: jobAtual,
    type: input.type,
    title: input.title,
    groupKey: input.group_key || null,
    emailType: enviaEmail,
    novos,
    suprimidos,
    comEmail,
  });
};

async function rodar(nome: string, job: () => Promise<void>): Promise<void> {
  jobAtual = nome;
  try {
    await job();
  } catch (error: any) {
    console.error(`  !! ${nome} falhou: ${error?.message}`);
  }
}

async function nomesDe(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabaseAdmin.from('users').select('id, name, email').in('id', ids);
  return new Map((data || []).map((u: any) => [u.id, `${u.name} <${u.email}>`]));
}

async function main(): Promise<void> {
  // Trava dupla: além da interceptação, aborta se o e-mail estiver ligado no
  // ambiente onde o script roda, para nenhum caminho residual conseguir enviar.
  if (process.env.EMAIL_ENABLED === 'true') {
    console.error('Abortado: EMAIL_ENABLED=true. Rode o dry-run com o e-mail desligado.');
    process.exit(1);
  }

  (notificationService as any).send = sendInterceptado;

  console.log(`\nDry-run dos jobs de lembrete — ${new Date().toLocaleString('pt-BR')}`);
  console.log(`Banco: ${process.env.SUPABASE_URL}\n`);

  await rodar('remindEvaluationCycleDeadline', remindEvaluationCycleDeadline);
  await rodar('remindSurveyDeadline', remindSurveyDeadline);
  await rodar('remindInterviewsTomorrow', remindInterviewsTomorrow);
  await rodar('remindCourseDeadline', remindCourseDeadline);
  await rodar('remindPdiActionDeadlines', remindPdiActionDeadlines);
  await rodar('remindStalePdis', remindStalePdis);

  // --- Por job ---
  console.log('POR JOB');
  console.log('-'.repeat(78));
  console.log(
    'job'.padEnd(34) +
      'disparos'.padStart(9) +
      'notific.'.padStart(10) +
      'suprim.'.padStart(9) +
      'e-mails'.padStart(9),
  );

  const jobs = [
    'remindEvaluationCycleDeadline',
    'remindSurveyDeadline',
    'remindInterviewsTomorrow',
    'remindCourseDeadline',
    'remindPdiActionDeadlines',
    'remindStalePdis',
  ];

  for (const nome of jobs) {
    const doJob = planejados.filter((p) => p.job === nome);
    const notif = doJob.reduce((s, p) => s + p.novos.length, 0);
    const supr = doJob.reduce((s, p) => s + p.suprimidos.length, 0);
    const mails = doJob.reduce((s, p) => s + p.comEmail.length, 0);
    console.log(
      nome.padEnd(34) +
        String(doJob.length).padStart(9) +
        String(notif).padStart(10) +
        String(supr).padStart(9) +
        String(mails).padStart(9),
    );
  }

  const totalEmails = planejados.reduce((s, p) => s + p.comEmail.length, 0);
  const totalNotif = planejados.reduce((s, p) => s + p.novos.length, 0);
  console.log('-'.repeat(78));
  console.log(
    'TOTAL'.padEnd(34) +
      String(planejados.length).padStart(9) +
      String(totalNotif).padStart(10) +
      String(planejados.reduce((s, p) => s + p.suprimidos.length, 0)).padStart(9) +
      String(totalEmails).padStart(9),
  );

  // --- Por destinatário: o que interessa para "flood de caixa de entrada" ---
  const porUsuario = new Map<string, string[]>();
  for (const p of planejados) {
    for (const id of p.comEmail) {
      if (!porUsuario.has(id)) porUsuario.set(id, []);
      porUsuario.get(id)!.push(`${p.type} — ${p.title}`);
    }
  }

  const ranking = [...porUsuario.entries()].sort((a, b) => b[1].length - a[1].length);
  const nomes = await nomesDe(ranking.slice(0, 15).map(([id]) => id));

  console.log('\nE-MAILS POR PESSOA (as 15 maiores caixas)');
  console.log('-'.repeat(78));
  if (ranking.length === 0) {
    console.log('Ninguém receberia e-mail com os dados de hoje.');
  } else {
    for (const [id, itens] of ranking.slice(0, 15)) {
      console.log(`${String(itens.length).padStart(3)}x  ${nomes.get(id) || id}`);
      for (const item of itens) console.log(`      · ${item}`);
    }
  }

  const distrib = new Map<number, number>();
  for (const [, itens] of ranking) distrib.set(itens.length, (distrib.get(itens.length) || 0) + 1);

  console.log('\nDISTRIBUIÇÃO');
  console.log('-'.repeat(78));
  for (const n of [...distrib.keys()].sort((a, b) => a - b)) {
    console.log(`${String(n).padStart(3)} e-mail(s): ${distrib.get(n)} pessoa(s)`);
  }
  console.log(`\nPessoas atingidas: ${ranking.length}`);
  console.log(`Pior caixa: ${ranking[0]?.[1].length || 0} e-mail(s) numa única manhã`);
  console.log(
    `Envio sequencial de ${totalEmails} e-mail(s): ~${Math.ceil((totalEmails * 1.5) / 60)} min ` +
      `(estimando 1,5 s por envio, que é como sendNotificationToMany roda hoje)\n`,
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
