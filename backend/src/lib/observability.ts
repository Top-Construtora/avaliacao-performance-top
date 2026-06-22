import { Sentry, isSentryEnabled } from './sentry';

/**
 * Costura de observabilidade externa (telemetry sink).
 *
 * O LOG local é responsabilidade do `errorHandler`/`logger` (Pino). Aqui é só
 * o envio para o Sentry — quando há `SENTRY_DSN`. Sem DSN, é no-op seguro.
 * Chamado pelo `errorHandler` para todo erro 5xx.
 */

export interface ErrorContext {
  requestId?: string;
  path?: string;
  method?: string;
  userId?: string;
}

export function captureException(error: unknown, context: ErrorContext = {}): void {
  if (!isSentryEnabled()) return;
  Sentry.captureException(error, {
    tags: context.requestId ? { requestId: context.requestId } : undefined,
    user: context.userId ? { id: context.userId } : undefined,
    extra: { path: context.path, method: context.method },
  });
}
