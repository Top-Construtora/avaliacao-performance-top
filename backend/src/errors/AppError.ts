/**
 * Erro de aplicação tipado — base do contrato de erro da API.
 *
 * Toda falha esperada (operacional) deve ser lançada como `AppError`, com um
 * `code` semântico do catálogo abaixo. O `errorHandler` traduz isso para o
 * envelope HTTP padronizado. Erros não-`AppError` viram `INTERNAL_ERROR` (500)
 * e sobem para a observabilidade (Sentry, na Sprint 4).
 *
 * Esta é a peça de referência: novos sistemas copiam este arquivo.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

const DEFAULT_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  /** Operacional = falha esperada (não vira alerta de Sentry). */
  readonly isOperational = true;

  constructor(code: ErrorCode, message: string, details?: unknown, statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode ?? DEFAULT_STATUS[code];
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Requisição inválida', details?: unknown): AppError {
    return new AppError('VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Não autenticado'): AppError {
    return new AppError('UNAUTHORIZED', message);
  }

  static forbidden(message = 'Acesso negado'): AppError {
    return new AppError('FORBIDDEN', message);
  }

  static notFound(message = 'Recurso não encontrado'): AppError {
    return new AppError('NOT_FOUND', message);
  }

  static conflict(message = 'Conflito de estado', details?: unknown): AppError {
    return new AppError('CONFLICT', message, details);
  }

  static internal(message = 'Erro interno do servidor'): AppError {
    return new AppError('INTERNAL_ERROR', message);
  }
}
