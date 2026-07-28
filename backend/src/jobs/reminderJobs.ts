import { supabaseAdmin } from '../config/supabase';
import { notificationService } from '../services/notificationService';
import { auditService } from '../services/auditService';
import { logger } from '../lib/logger';

const jobLogger = logger.child({ module: 'jobs' });

/**
 * Jobs de lembrete e encerramento automático (fase 1 do roadmap).
 *
 * Idempotência: todos os disparos usam anti_spam 'cooldown' com group_key
 * específico do dia/entidade — rodar o job duas vezes no mesmo dia não
 * duplica notificação nem e-mail.
 */

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Ciclos abertos com fim em até 3 dias: cobra quem não concluiu a autoavaliação. */
export async function remindEvaluationCycleDeadline(): Promise<void> {
  const today = toDateOnly(new Date());
  const limit = toDateOnly(daysFromNow(3));

  const { data: cycles, error } = await supabaseAdmin
    .from('evaluation_cycles')
    .select('id, title, end_date')
    .eq('status', 'open')
    .gte('end_date', today)
    .lte('end_date', limit);

  if (error) {
    jobLogger.error({ err: error.message }, 'remindEvaluationCycleDeadline: erro ao buscar ciclos');
    return;
  }

  for (const cycle of cycles || []) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(cycle.end_date).getTime() - Date.now()) / 86400000),
    );

    // Quem já enviou a autoavaliação (existência da linha = concluída)
    const { data: done } = await supabaseAdmin
      .from('self_evaluations')
      .select('employee_id')
      .eq('cycle_id', cycle.id);

    const doneIds = new Set((done || []).map((r: any) => r.employee_id));

    const { data: users } = await supabaseAdmin.from('users').select('id').eq('active', true);

    const pendingIds = (users || []).map((u) => u.id).filter((id) => !doneIds.has(id));
    if (pendingIds.length === 0) continue;

    const dayLabel = daysLeft <= 1 ? 'amanhã' : `em ${daysLeft} dias`;

    await notificationService.send(supabaseAdmin, {
      type: 'self_evaluation_pending',
      title: 'Autoavaliação pendente',
      message: `O ciclo "${cycle.title}" encerra ${dayLabel}. Complete sua autoavaliação antes do prazo.`,
      targets: pendingIds.map((id) => ({ type: 'user' as const, user_id: id })),
      action_url: '/self-evaluation',
      entity_type: 'evaluation_cycle',
      entity_id: cycle.id,
      group_key: `cycle_deadline:${cycle.id}:${daysLeft}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 20 * 60,
    });

    jobLogger.info(
      { cycleId: cycle.id, daysLeft, pending: pendingIds.length },
      'Lembrete de autoavaliação enviado',
    );
  }
}

/** PDIs ativos sem atualização há 30+ dias: lembra o colaborador de atualizar. */
export async function remindStalePdis(): Promise<void> {
  const threshold = daysFromNow(-30).toISOString();

  const { data: stale, error } = await supabaseAdmin
    .from('development_plans')
    .select('id, employee_id, updated_at')
    .eq('status', 'active')
    .lt('updated_at', threshold);

  if (error) {
    jobLogger.error({ err: error.message }, 'remindStalePdis: erro ao buscar PDIs');
    return;
  }

  for (const pdi of stale || []) {
    await notificationService.send(supabaseAdmin, {
      type: 'pdi_deadline_approaching',
      title: 'Seu PDI precisa de atualização',
      message:
        'Seu Plano de Desenvolvimento Individual está sem atualização há mais de 30 dias. Revise o andamento das suas ações.',
      targets: [{ type: 'user', user_id: pdi.employee_id }],
      action_url: '/my-pdi',
      entity_type: 'development_plan',
      entity_id: pdi.id,
      group_key: `pdi_stale:${pdi.id}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 7 * 24 * 60, // no máximo 1 lembrete por semana
    });
  }

  if ((stale || []).length > 0) {
    jobLogger.info({ count: stale!.length }, 'Lembretes de PDI sem atualização enviados');
  }
}

/** Pesquisas ativas com fim em até 2 dias: cobra quem ainda não respondeu. */
export async function remindSurveyDeadline(): Promise<void> {
  const now = new Date().toISOString();
  const limit = daysFromNow(2).toISOString();

  const { data: surveys, error } = await supabaseAdmin
    .from('satisfaction_surveys')
    .select('id, title, end_date')
    .eq('status', 'active')
    .not('end_date', 'is', null)
    .gte('end_date', now)
    .lte('end_date', limit);

  if (error) {
    jobLogger.error({ err: error.message }, 'remindSurveyDeadline: erro ao buscar pesquisas');
    return;
  }

  for (const survey of surveys || []) {
    // Quem já respondeu (satisfaction_participants registra a resposta)
    const { data: responded } = await supabaseAdmin
      .from('satisfaction_participants')
      .select('respondent_id')
      .eq('survey_id', survey.id);

    const respondedIds = new Set(
      (responded || []).map((r: any) => r.respondent_id).filter(Boolean),
    );

    const { data: users } = await supabaseAdmin.from('users').select('id').eq('active', true);

    const pendingIds = (users || []).map((u) => u.id).filter((id) => !respondedIds.has(id));
    if (pendingIds.length === 0) continue;

    await notificationService.send(supabaseAdmin, {
      type: 'survey_deadline_approaching',
      title: 'Pesquisa perto de encerrar',
      message: `A pesquisa "${survey.title}" encerra em breve. Sua resposta é importante.`,
      targets: pendingIds.map((id) => ({ type: 'user' as const, user_id: id })),
      action_url: `/satisfaction/${survey.id}/respond`,
      entity_type: 'satisfaction_survey',
      entity_id: survey.id,
      group_key: `survey_deadline:${survey.id}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 20 * 60,
    });

    jobLogger.info(
      { surveyId: survey.id, pending: pendingIds.length },
      'Lembrete de pesquisa enviado',
    );
  }
}

/** Entrevistas agendadas para amanhã: lembra entrevistador e colaborador. */
export async function remindInterviewsTomorrow(): Promise<void> {
  const start = daysFromNow(1);
  start.setHours(0, 0, 0, 0);
  const end = daysFromNow(1);
  end.setHours(23, 59, 59, 999);

  const { data: interviews, error } = await supabaseAdmin
    .from('interviews')
    .select('id, type, scheduled_date, employee_id, interviewer_id')
    .eq('status', 'scheduled')
    .gte('scheduled_date', start.toISOString())
    .lte('scheduled_date', end.toISOString());

  if (error) {
    jobLogger.error({ err: error.message }, 'remindInterviewsTomorrow: erro ao buscar entrevistas');
    return;
  }

  for (const interview of interviews || []) {
    const time = new Date(interview.scheduled_date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    const targets = [interview.employee_id, interview.interviewer_id]
      .filter(Boolean)
      .map((id: string) => ({ type: 'user' as const, user_id: id }));

    if (targets.length === 0) continue;

    await notificationService.send(supabaseAdmin, {
      type: 'interview_scheduled',
      title: 'Lembrete: entrevista amanhã',
      message: `Você tem uma entrevista agendada para amanhã às ${time}.`,
      targets,
      action_url: `/interviews/${interview.id}`,
      entity_type: 'interview',
      entity_id: interview.id,
      group_key: `interview_reminder:${interview.id}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 20 * 60,
    });
  }

  if ((interviews || []).length > 0) {
    jobLogger.info({ count: interviews!.length }, 'Lembretes de entrevista enviados');
  }
}

/** Reuniões agendadas para amanhã: lembra organizador e participantes. */
export async function remindMeetingsTomorrow(): Promise<void> {
  const start = daysFromNow(1);
  start.setHours(0, 0, 0, 0);
  const end = daysFromNow(1);
  end.setHours(23, 59, 59, 999);

  const { data: meetings, error } = await supabaseAdmin
    .from('meetings')
    .select('id, title, scheduled_at, organizer_id, participants:meeting_participants(user_id)')
    .eq('status', 'scheduled')
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString());

  if (error) {
    jobLogger.error({ err: error.message }, 'remindMeetingsTomorrow: erro ao buscar reuniões');
    return;
  }

  for (const meeting of meetings || []) {
    const time = new Date(meeting.scheduled_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    const userIds = new Set<string>([meeting.organizer_id]);
    (meeting.participants || []).forEach((p: any) => userIds.add(p.user_id));

    await notificationService.send(supabaseAdmin, {
      type: 'meeting_scheduled',
      title: 'Lembrete: reunião amanhã',
      message: `Você tem uma reunião${meeting.title ? ` (${meeting.title})` : ''} amanhã às ${time}.`,
      targets: Array.from(userIds).map((id) => ({ type: 'user' as const, user_id: id })),
      action_url: '/meetings',
      entity_type: 'meeting',
      entity_id: meeting.id,
      group_key: `meeting_reminder:${meeting.id}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 20 * 60,
    });
  }

  if ((meetings || []).length > 0) {
    jobLogger.info({ count: meetings!.length }, 'Lembretes de reunião enviados');
  }
}

/**
 * Reuniões recorrentes cuja data passou há 1+ dia sem serem concluídas:
 * materializa a próxima ocorrência para a série não morrer.
 */
export async function materializeOverdueRecurrences(): Promise<void> {
  const threshold = daysFromNow(-1).toISOString();

  const { data: overdue, error } = await supabaseAdmin
    .from('meetings')
    .select('*')
    .eq('status', 'scheduled')
    .neq('recurrence', 'none')
    .lt('scheduled_at', threshold);

  if (error) {
    jobLogger.error({ err: error.message }, 'materializeOverdueRecurrences: erro ao buscar');
    return;
  }

  const { meetingService } = await import('../services/meetingService');
  let created = 0;
  for (const meeting of overdue || []) {
    const next = await meetingService.materializeNext(supabaseAdmin, meeting);
    if (next) created++;
  }

  if (created > 0) {
    jobLogger.info({ created }, 'Ocorrências recorrentes materializadas');
  }
}

/**
 * Reconciliação diária JSONB → pdi_actions (fase 5C). Cobre planos editados
 * por código antigo (sem dual-write) ou qualquer divergência: reespelha os
 * itens preservando due_date/course_id, que vivem só na tabela.
 */
export async function resyncPdiActions(): Promise<void> {
  const { data: plans, error } = await supabaseAdmin
    .from('development_plans')
    .select('id, items')
    .eq('status', 'active');

  if (error) {
    jobLogger.error({ err: error.message }, 'resyncPdiActions: erro ao buscar planos');
    return;
  }

  const { pdiActionsService } = await import('../services/pdiActionsService');
  let synced = 0;
  for (const plan of plans || []) {
    if (!Array.isArray(plan.items)) continue;
    // Itens sem id (salvos por código antigo) ganham id e voltam ao JSONB
    const withIds = pdiActionsService.ensureItemIds(plan.items as any);
    const changed = withIds.some(
      (item: any, index: number) => item.id !== (plan.items as any)[index]?.id,
    );
    if (changed) {
      await supabaseAdmin.from('development_plans').update({ items: withIds }).eq('id', plan.id);
    }
    await pdiActionsService.syncFromItems(supabaseAdmin, plan.id, withIds);
    synced++;
  }

  jobLogger.info({ synced }, 'Reconciliação de ações do PDI concluída');
}

/** Ações do PDI com prazo em até 7 dias (fase 5C): lembra o colaborador. */
export async function remindPdiActionDeadlines(): Promise<void> {
  const today = toDateOnly(new Date());
  const limit = toDateOnly(daysFromNow(7));

  const { data: actions, error } = await supabaseAdmin
    .from('pdi_actions')
    .select(
      'id, competencia, due_date, development_plan_id, plan:development_plans!pdi_actions_development_plan_id_fkey(id, employee_id, status)',
    )
    .not('due_date', 'is', null)
    .gte('due_date', today)
    .lte('due_date', limit)
    .not('status', 'in', '("4","5")');

  if (error) {
    jobLogger.error({ err: error.message }, 'remindPdiActionDeadlines: erro ao buscar ações');
    return;
  }

  const active = (actions || []).filter((a: any) => a.plan?.status === 'active');
  for (const action of active) {
    const dueLabel = new Date(`${action.due_date}T00:00:00`).toLocaleDateString('pt-BR');
    await notificationService.send(supabaseAdmin, {
      type: 'pdi_deadline_approaching',
      title: 'Ação do PDI perto do prazo',
      message: `A ação "${action.competencia}" do seu PDI vence em ${dueLabel}.`,
      targets: [{ type: 'user', user_id: (action as any).plan.employee_id }],
      action_url: '/my-pdi',
      entity_type: 'development_plan',
      entity_id: action.development_plan_id,
      group_key: `pdi_action_due:${action.development_plan_id}:${action.id}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 3 * 24 * 60, // no máximo a cada 3 dias por ação
    });
  }

  if (active.length > 0) {
    jobLogger.info({ count: active.length }, 'Lembretes de prazo de ação de PDI enviados');
  }
}

/** Turmas com prazo em até 3 dias: cobra inscritos que não concluíram. */
export async function remindCourseDeadline(): Promise<void> {
  const today = toDateOnly(new Date());
  const limit = toDateOnly(daysFromNow(3));

  const { data: classes, error } = await supabaseAdmin
    .from('course_classes')
    .select('id, name, end_date, course:courses!course_classes_course_id_fkey(title)')
    .eq('active', true)
    .not('end_date', 'is', null)
    .gte('end_date', today)
    .lte('end_date', limit);

  if (error) {
    jobLogger.error({ err: error.message }, 'remindCourseDeadline: erro ao buscar turmas');
    return;
  }

  for (const cls of classes || []) {
    const { data: pending } = await supabaseAdmin
      .from('class_enrollments')
      .select('user_id')
      .eq('class_id', cls.id)
      .is('completed_at', null);

    const pendingIds = (pending || []).map((e: any) => e.user_id);
    if (pendingIds.length === 0) continue;

    const courseTitle = (cls as any).course?.title || cls.name;

    await notificationService.send(supabaseAdmin, {
      type: 'course_deadline_approaching',
      title: 'Prazo de curso se aproximando',
      message: `O prazo da turma "${cls.name}" do curso "${courseTitle}" termina em breve. Conclua os conteúdos pendentes.`,
      targets: pendingIds.map((id) => ({ type: 'user' as const, user_id: id })),
      action_url: '/learning',
      entity_type: 'course_class',
      entity_id: cls.id,
      group_key: `course_deadline:${cls.id}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 20 * 60,
    });

    jobLogger.info({ classId: cls.id, pending: pendingIds.length }, 'Lembrete de curso enviado');
  }
}

/** Encerra automaticamente ciclos e pesquisas com data final vencida. */
export async function autoCloseExpired(): Promise<void> {
  const today = toDateOnly(new Date());
  const now = new Date().toISOString();

  // Ciclos de avaliação
  const { data: expiredCycles } = await supabaseAdmin
    .from('evaluation_cycles')
    .select('id, title')
    .eq('status', 'open')
    .lt('end_date', today);

  for (const cycle of expiredCycles || []) {
    const { error } = await supabaseAdmin
      .from('evaluation_cycles')
      .update({ status: 'closed', updated_at: now })
      .eq('id', cycle.id)
      .eq('status', 'open');

    if (error) {
      jobLogger.error(
        { cycleId: cycle.id, err: error.message },
        'autoClose: erro ao encerrar ciclo',
      );
      continue;
    }

    await notificationService.send(supabaseAdmin, {
      type: 'evaluation_cycle_closed',
      title: 'Ciclo de avaliação encerrado',
      message: `O ciclo "${cycle.title}" foi encerrado automaticamente ao atingir a data final.`,
      targets: [{ type: 'all' }],
      action_url: '/',
      entity_type: 'evaluation_cycle',
      entity_id: cycle.id,
      group_key: `cycle_autoclose:${cycle.id}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 24 * 60,
    });

    auditService.logSystem('cycle.auto_closed', 'evaluation_cycles', cycle.id, {
      new: { status: 'closed', title: cycle.title },
    });

    jobLogger.info({ cycleId: cycle.id, title: cycle.title }, 'Ciclo encerrado automaticamente');
  }

  // Pesquisas de satisfação
  const { data: expiredSurveys } = await supabaseAdmin
    .from('satisfaction_surveys')
    .select('id, title')
    .eq('status', 'active')
    .not('end_date', 'is', null)
    .lt('end_date', now);

  for (const survey of expiredSurveys || []) {
    const { error } = await supabaseAdmin
      .from('satisfaction_surveys')
      .update({ status: 'closed' })
      .eq('id', survey.id)
      .eq('status', 'active');

    if (error) {
      jobLogger.error(
        { surveyId: survey.id, err: error.message },
        'autoClose: erro ao encerrar pesquisa',
      );
      continue;
    }

    await notificationService.send(supabaseAdmin, {
      type: 'survey_closed',
      title: 'Pesquisa encerrada',
      message: `A pesquisa "${survey.title}" foi encerrada automaticamente ao atingir a data final.`,
      targets: [{ type: 'role', role: 'director' }],
      action_url: `/satisfaction/${survey.id}/results`,
      entity_type: 'satisfaction_survey',
      entity_id: survey.id,
      group_key: `survey_autoclose:${survey.id}`,
      anti_spam: 'cooldown',
      cooldown_minutes: 24 * 60,
    });

    auditService.logSystem('survey.auto_closed', 'satisfaction_surveys', survey.id, {
      new: { status: 'closed', title: survey.title },
    });

    jobLogger.info(
      { surveyId: survey.id, title: survey.title },
      'Pesquisa encerrada automaticamente',
    );
  }
}
