# Architecture Decision Records (ADR)

Registro de decisões de arquitetura. **Append-only e datado**: um ADR nunca é
editado depois de aceito — se a decisão muda, cria-se um novo ADR que
**supersede** o anterior (referenciando-o). É o "porquê" histórico do projeto;
não apodrece porque não descreve o estado atual, e sim a decisão no momento.

> Convenção (não documentação): o que pode ser **forçado por tooling**
> (lint, types, error handler) mora no código, não aqui. O ADR guarda só o que
> não dá para mecanizar — o contexto, os trade-offs e o motivo da escolha.

## Formato

`NNNN-titulo-em-kebab-case.md`, numeração sequencial. Status: `Proposto` →
`Aceito` → (eventualmente) `Substituído por NNNN`.

## Índice

- [0001](0001-api-error-contract.md) — Contrato de erro da API, versionamento e validação
- [0002](0002-versioned-migrations.md) — Migrações de banco versionadas (Supabase CLI)
- [0003](0003-observability-logging.md) — Observabilidade: logs estruturados (Pino) + Sentry
- [0004](0004-deploy-and-environments.md) — Topologia de deploy e ambientes
