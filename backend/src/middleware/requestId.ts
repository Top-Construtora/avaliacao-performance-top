import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Correlation id desta requisição — vai para logs, header e Sentry. */
      id: string;
    }
  }
}

/**
 * Atribui um correlation id a cada requisição (reaproveita o recebido em
 * `X-Request-Id`, se houver — útil quando vários serviços encadeiam chamadas)
 * e o devolve no header de resposta. É a base da observabilidade: o mesmo id
 * aparece no log, no header e no Sentry.
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};
