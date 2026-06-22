# 0002 — Migrações de banco versionadas (Supabase CLI)

- **Status:** Aceito
- **Data:** 2026-06-22
- **Contexto:** schema no Supabase, até aqui evoluído via SQL manual no dashboard

## Contexto

As mudanças de schema vinham sendo aplicadas como **SQL avulso rodado no
Supabase SQL Editor**, com cópias soltas em `backend/database/*.sql` e
`backend/sql/*.sql` (8 arquivos, sem ordem nem controle de aplicação). Isso é a
principal fonte de **drift**: não há como saber, olhando o repo, qual o estado
real do banco — nem reproduzir esse estado num ambiente novo. Num futuro com
vários sistemas sobre o mesmo Supabase, isso vira ingovernável.

O Supabase CLI já estava nos devDeps da raiz, mas sem `supabase/` inicializado.

## Decisão

1. **Adotar `supabase/migrations/` como única fonte de verdade do schema.**
   Toda mudança passa a ser um arquivo `<timestamp>_nome.sql` versionado.
   Proibido SQL solto no SQL Editor para mudança de estrutura.

2. **Baseline de banco existente via `db pull` + `migration repair`.** Como a
   produção já tem schema, o primeiro passo (uma vez, com acesso à prod) é
   capturar o estado atual como migração de baseline e marcá-la como já
   aplicada. Só então `db push` passa a aplicar apenas o que é novo. O
   procedimento está em `supabase/README.md`.

3. **Congelar o SQL legado.** `backend/database/*.sql` e `backend/sql/*.sql`
   viram histórico (já estão em prod, logo serão absorvidos pelo baseline).
   `backend/database/README.md` marca a pasta como congelada; nada novo entra
   ali.

4. **Convenção idempotente.** `if not exists`, `create or replace`,
   `drop ... if exists` — para que `db reset` (recria do zero) e `db push`
   (incremental) sejam seguros. Migração aplicada nunca é editada.

5. **Scripts descobríveis na raiz:** `db:new`, `db:diff`, `db:pull`, `db:push`,
   `db:reset`, `db:lint` — envelopam o CLI para o fluxo ser óbvio.

## Consequências

- **+** Estado do banco reproduzível e auditável a partir do repo.
- **+** `db reset` recria um ambiente de dev/homolog idêntico, com seed.
- **+** Caminho claro para os próximos sistemas (mesmo trilho de schema).
- **−** Exige a etapa única de baseline com credencial de produção (não dá para
  automatizar daqui — precisa do `PROJECT_REF` + senha do banco).
- **Próximo:** rodar o baseline; depois mover as próximas mudanças (ex.: colunas
  novas) para migrações e, com o baseline confirmado, remover os `.sql` legados.
