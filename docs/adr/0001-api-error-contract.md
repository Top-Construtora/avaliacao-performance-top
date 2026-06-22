# 0001 — Contrato de erro da API, versionamento e validação

- **Status:** Aceito
- **Data:** 2026-06-22
- **Contexto:** backend Express + Supabase (sistema de referência da plataforma)

## Contexto

O backend tinha tratamento de erro inconsistente: respostas de erro ora vinham
do `errorHandler` (`{ success: false, error: "<string>" }`), ora inline nos
controllers/middleware. Não havia validação de entrada centralizada (sem Zod),
nem correlation id, nem ponto único para observabilidade. Como esta base vai
servir de **implementação de referência** para os próximos sistemas internos, o
contrato precisa ser explícito e copiável.

Restrição-chave: o frontend **em produção** lê `error` como **string**. Mudar o
shape globalmente quebraria a UI.

## Decisão

1. **Envelope de erro versionado.** O contrato canônico (`/api/v1`) é:

   ```json
   {
     "success": false,
     "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] },
     "requestId": "uuid",
     "timestamp": "ISO-8601"
   }
   ```

   O `code` vem de um catálogo fechado (`ErrorCode` em `errors/AppError.ts`):
   `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
   `RATE_LIMITED`, `INTERNAL_ERROR`.

2. **Versionamento como boundary de contrato.** Rotas montam em `/api/v1`
   (canônico) **e** `/api` (alias legado, transitório). O `errorHandler`
   serializa o envelope novo só quando `res.locals.apiVersion === 'v1'`; o
   legado mantém `error` como string. Assim o frontend atual **não quebra** e a
   migração é rota a rota. Não há `/v2` enquanto front e back evoluírem juntos —
   o prefixo é só o gancho para o primeiro consumidor independente.

3. **`AppError` tipado.** Toda falha esperada é lançada como `AppError` com
   `code` semântico. Erros desconhecidos viram `INTERNAL_ERROR` (500) e, em
   produção, têm a mensagem omitida do cliente. `ApiError(status, message)` é
   mantido como subclasse para retrocompat dos services existentes.

4. **Validação com Zod no boundary.** `validate({ body, query, params })`
   valida e **substitui** a entrada pelos dados parseados (descarta campos
   desconhecidos → barra mass-assignment). Falha vira `AppError` 400 com
   `details` por campo. Rota de referência: `POST /cycles`.

5. **Observabilidade desde já, com costura.** `requestId` injeta um correlation
   id (log + header `X-Request-Id` + Sentry). O `errorHandler` chama
   `captureException` para todo 5xx. Hoje `captureException` é no-op em produção;
   na Sprint 4 o Sentry é plugado **só** em `lib/observability.ts` — nada mais
   muda. Construído uma vez, não duas.

## Consequências

- **+** Erros consistentes, com código estável para o cliente tratar.
- **+** Entrada validada e tipada antes de chegar no service.
- **+** Correlation id ponta a ponta; integração de Sentry vira plugar 1 arquivo.
- **+** Padrão copiável: `errors/`, `validators/`, `middleware/validate.ts`,
  `middleware/requestId.ts`, `lib/observability.ts`.
- **−** Dualidade temporária de formato (`/api` vs `/api/v1`) até o frontend
  migrar. O alias `/api` deve ser removido quando ninguém mais o consumir.
- **Próximo:** migrar as demais rotas para `validate` + `AppError`; remover os
  `res.json({ success:false, error })` inline dos controllers/middleware.
