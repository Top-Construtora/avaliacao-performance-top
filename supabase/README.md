# Banco de dados — migrações versionadas (Supabase)

A partir de agora, **toda mudança de schema é uma migração versionada** em
`supabase/migrations/`. Acabou rodar SQL solto no SQL Editor — era exatamente o
que gerava _drift_ entre ambientes. Os SQLs antigos em `backend/database/` e
`backend/sql/` estão **congelados** (já aplicados em produção) — ver
`backend/database/README.md`.

## Fluxo do dia a dia

```bash
# 1. criar a migração (gera supabase/migrations/<timestamp>_nome.sql vazio)
npm run db:new -- nome_descritivo

# 2. escrever o SQL idempotente no arquivo gerado (convenção abaixo)

# 3. testar do zero: sobe um Postgres local e aplica TODAS as migrações + seed
npm run db:reset

# 4. aplicar na produção (depois de linkado)
npm run db:push
```

## Baseline de um banco que JÁ existe (rodar UMA vez)

A produção já tem schema (criado no dashboard). Antes de versionar, capture o
estado atual como _baseline_ — sem isso, `db push` tentaria recriar tudo:

```bash
# linka o repo ao projeto remoto (precisa do ref do projeto + senha do banco)
npx supabase link --project-ref <PROJECT_REF>

# gera supabase/migrations/<timestamp>_remote_schema.sql com o schema atual
npx supabase db pull

# marca a baseline como JÁ aplicada na prod (não re-roda)
npx supabase migration repair --status applied <timestamp_da_baseline>
```

A partir daí, `db push` aplica **apenas** migrações novas.

## Convenção

- **Idempotente** sempre que possível: `create table if not exists`,
  `add column if not exists`, `create or replace function`, `drop ... if exists`.
- Um arquivo = uma mudança coesa, nome descritivo (`add_cycle_sla_column`).
- **Nunca** editar uma migração já aplicada — crie outra que corrige.
- Dados de exemplo para dev ficam em `supabase/seed.sql` (rodam no `db:reset`).

## Exemplo de migração

```sql
-- supabase/migrations/20260622120000_add_cycle_sla.sql
alter table public.evaluation_cycles
  add column if not exists sla_days integer not null default 14;
```
