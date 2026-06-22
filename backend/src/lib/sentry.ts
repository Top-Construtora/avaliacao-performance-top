import * as Sentry from '@sentry/node';
import { logger } from './logger';

let initialized = false;

/**
 * Inicializa o Sentry SE `SENTRY_DSN` estiver definido. Sem DSN, fica
 * desligado (no-op) — seguro em dev e em ambientes sem Sentry.
 *
 * Captura de erro é manual (via `captureException` em lib/observability),
 * então `tracesSampleRate: 0` — sem instrumentação de performance por ora.
 * Deve ser chamado o mais cedo possível no boot (ver app.ts).
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry desativado (SENTRY_DSN não definido)');
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0,
  });
  initialized = true;
  logger.info('Sentry ativado');
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export { Sentry };
