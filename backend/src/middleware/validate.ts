import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../errors/AppError';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware de validação com Zod. Valida `body`/`query`/`params` contra os
 * schemas informados e SUBSTITUI os valores pelos dados já parseados e tipados
 * (campos desconhecidos são descartados — proteção contra mass-assignment).
 *
 * Em caso de falha, lança `AppError` VALIDATION_ERROR com `details` por campo,
 * que o `errorHandler` formata no envelope padrão.
 */
export const validate =
  (schemas: ValidationSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
      if (schemas.params) Object.assign(req.params, schemas.params.parse(req.params));
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        }));
        return next(AppError.badRequest('Falha na validação dos dados', details));
      }
      next(err);
    }
  };
