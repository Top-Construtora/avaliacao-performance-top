import cron from 'node-cron';
import { logger } from '../lib/logger';
import { captureException } from '../lib/observability';
import {
  remindEvaluationCycleDeadline,
  remindStalePdis,
  remindSurveyDeadline,
  remindInterviewsTomorrow,
  remindMeetingsTomorrow,
  materializeOverdueRecurrences,
  remindCourseDeadline,
  autoCloseExpired,
} from './reminderJobs';
import { auditService } from '../services/auditService';

const jobLogger = logger.child({ module: 'jobs' });

async function runSafely(name: string, job: () => Promise<void>): Promise<void> {
  const started = Date.now();
  try {
    await job();
    jobLogger.info({ job: name, durationMs: Date.now() - started }, 'Job concluído');
  } catch (error: any) {
    jobLogger.error({ job: name, err: error?.message }, 'Job falhou');
    captureException(error, { path: 'jobs', method: name });
  }
}

/**
 * Agendador in-process (fase 1 do roadmap). O backend roda como processo
 * persistente no Render, então node-cron é suficiente. Guard por env:
 * ENABLE_JOBS=true deve estar setado em EXATAMENTE UMA instância — se o
 * backend um dia escalar horizontalmente, mover o disparo para pg_cron.
 *
 * Os jobs são idempotentes (anti-spam por group_key), então uma execução
 * duplicada ocasional não gera notificação repetida.
 */
export function startJobs(): void {
  if (process.env.ENABLE_JOBS !== 'true') {
    jobLogger.info('Jobs agendados desligados (ENABLE_JOBS != true)');
    return;
  }

  const timezone = 'America/Sao_Paulo';

  // 00:10 — encerramentos automáticos por data vencida
  cron.schedule('10 0 * * *', () => void runSafely('autoCloseExpired', autoCloseExpired), {
    timezone,
  });

  // 09:00 — lembretes diários
  cron.schedule(
    '0 9 * * *',
    async () => {
      await runSafely('remindEvaluationCycleDeadline', remindEvaluationCycleDeadline);
      await runSafely('remindSurveyDeadline', remindSurveyDeadline);
      await runSafely('remindInterviewsTomorrow', remindInterviewsTomorrow);
      await runSafely('remindMeetingsTomorrow', remindMeetingsTomorrow);
      await runSafely('materializeOverdueRecurrences', materializeOverdueRecurrences);
      await runSafely('remindCourseDeadline', remindCourseDeadline);
      await runSafely('remindStalePdis', remindStalePdis);
    },
    { timezone },
  );

  // Dia 1 de cada mês, 01:00 — expurgo da auditoria (retenção de 24 meses)
  cron.schedule(
    '0 1 1 * *',
    () => void runSafely('purgeAuditLogs', () => auditService.purgeOldEntries(24)),
    { timezone },
  );

  jobLogger.info(
    { timezone },
    'Jobs agendados iniciados (00:10 encerramentos, 09:00 lembretes, mensal expurgo auditoria)',
  );
}
