import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Logger estruturado (Pino). Substitui `console` no backend.
 *  - Produção: JSON em uma linha (pronto para Better Stack / Render / Datadog).
 *  - Dev: saída colorida e legível via pino-pretty.
 *  - Redige campos sensíveis (Authorization, senha, token) por padrão.
 *
 * Nível controlável por `LOG_LEVEL` (debug em dev, info em prod).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      '*.password',
      'token',
      '*.token',
      'accessToken',
      '*.accessToken',
    ],
    censor: '[redacted]',
  },
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
});
