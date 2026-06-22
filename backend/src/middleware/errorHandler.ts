import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCode } from '../errors/AppError';
import { captureException } from '../lib/observability';
import { logger } from '../lib/logger';

/**
 * Retrocompatibilidade. Serviços legados lançam `new ApiError(status, message)`.
 * Novo código deve usar `AppError` (com `code` semântico) — ver errors/AppError.ts.
 */
function statusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL_ERROR';
  }
}

export class ApiError extends AppError {
  constructor(statusCode: number, message: string) {
    super(statusToCode(statusCode), message, undefined, statusCode);
    this.name = 'ApiError';
  }
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.') || '(root)',
      message: issue.message,
    }));
    return AppError.badRequest('Falha na validação dos dados', details);
  }
  return AppError.internal(err instanceof Error ? err.message : 'Erro interno do servidor');
}

/**
 * Handler de erro único. Responsabilidades:
 *  - normaliza qualquer erro para `AppError`;
 *  - loga de forma estruturada (com requestId) — Pino entra na Sprint 4;
 *  - manda erros 5xx para a observabilidade (costura Sentry);
 *  - serializa no contrato VERSIONADO: /api/v1 → envelope estruturado;
 *    /api (legado) → string, retrocompatível com o frontend atual.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  const appError = toAppError(err);
  const { statusCode, code, details } = appError;
  const isServerError = statusCode >= 500;
  const requestId = (req as { id?: string }).id;

  const logPayload = {
    requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    ...(isServerError && err instanceof Error ? { err } : {}),
  };
  if (isServerError) logger.error(logPayload, appError.message);
  else logger.warn(logPayload, appError.message);

  if (isServerError) {
    captureException(err, {
      requestId,
      path: req.originalUrl,
      method: req.method,
      userId: (req as { user?: { id?: string } }).user?.id,
    });
  }

  // Em produção, não vazar mensagem interna de 5xx.
  const clientMessage =
    isServerError && process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : appError.message;

  const timestamp = new Date().toISOString();

  // Contrato canônico (v1): envelope estruturado.
  if (res.locals.apiVersion === 'v1') {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: clientMessage,
        ...(details !== undefined ? { details } : {}),
      },
      requestId,
      timestamp,
    });
  }

  // Contrato legado (/api): `error` como string. Campos extras são aditivos.
  return res.status(statusCode).json({
    success: false,
    error: clientMessage,
    ...(details !== undefined ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' && err instanceof Error
      ? { code, stack: err.stack }
      : {}),
  });
};
