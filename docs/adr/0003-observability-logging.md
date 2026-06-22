# 0003 — Observabilidade: logs estruturados (Pino) + Sentry

- **Status:** Aceito
- **Data:** 2026-06-22
- **Contexto:** backend Express; até aqui, visibilidade de erro = `console` + reclamação de usuário

## Contexto

Não havia rastreio de erro em produção: uma exceção sumia num `console.error`
do Render e só era descoberta quando alguém reclamava. A Sprint 1 já tinha
preparado a base — `requestId` (correlation id), log com shape estruturado e a
**costura** `captureException` chamada para todo 5xx —, faltava plugar as
ferramentas reais.

## Decisão

1. **Pino como logger estruturado** (`lib/logger.ts`), substituindo `console`.
   JSON em uma linha em produção (pronto para Better Stack/Render/Datadog),
   colorido via `pino-pretty` em dev. Campos sensíveis (Authorization, senha,
   token) são redigidos por padrão. Nível por `LOG_LEVEL`.

2. **Sentry sob feature-flag de env** (`lib/sentry.ts`). `initSentry()` roda no
   boot e só ativa se `SENTRY_DSN` existir — sem DSN é no-op, seguro em dev e em
   qualquer ambiente sem Sentry. Captura é **manual** via a costura já existente
   (`tracesSampleRate: 0`, sem instrumentação de performance por ora).

3. **Separação de responsabilidades:** o `errorHandler` (e os handlers de
   processo) fazem o LOG local via Pino; `lib/observability.captureException`
   só envia ao Sentry. Sem log duplicado.

4. **Erros de processo** (`uncaughtException`/`unhandledRejection`) também vão
   para Pino + Sentry.

## Consequências

- **+** Erro em produção vira evento com stack, requestId, rota, método e
  usuário — minutos em vez de "alguém reclamou".
- **+** O mesmo `requestId` aparece no header de resposta, no log e no Sentry.
- **+** Ligar/desligar Sentry é uma env (`SENTRY_DSN`), sem deploy de código.
- **−** Perf/tracing do Sentry fica desligado (decisão consciente — custo/ruído).
  Reavaliar se houver necessidade de APM.
- **Próximo (Sprint 5):** centralizar os logs JSON num painel (Better Stack) e
  ligar uptime/alertas.
