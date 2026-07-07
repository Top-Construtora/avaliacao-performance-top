-- Segurança (C4, último ponto): trancar a tabela `users` contra acesso direto
-- pela anon key, sem quebrar o diretório mascarado.
--
-- Contexto:
--   * A view `users_safe` era `security_invoker = true` — executava com as
--     permissões de quem chamava, então trancar `users` a quebraria.
--   * O frontend fazia 3 acessos diretos a `users`:
--       - leitura da hierarquia (NineBox)      → movida para a API (getUsers)
--       - update de must_change_password (modal) → movida p/ POST /auth/complete-first-login
--       - leitura via view users_safe (Evaluation) → tratada abaixo
--
-- Passos:
--   1) Tornar users_safe SECURITY DEFINER: passa a executar como o dono (que
--      ignora o RLS de `users` e das tabelas de apoio) e continua mascarando o
--      cargo via auth.uid(). Assim a view funciona mesmo com `users` trancada.
--   2) Habilitar RLS em `users` e remover QUALQUER policy existente, sem criar
--      policy para authenticated/anon → acesso direto negado. O backend
--      (service_role), a view users_safe (definer) e a função can_view_employee
--      (security definer) continuam lendo normalmente.
--
-- TESTAR EM STAGING. Requer o deploy do frontend correspondente (NineBox +
-- FirstLoginPasswordModal) junto/antes, senão essas telas quebram.

-- 1) users_safe passa a ser SECURITY DEFINER (executa como owner).
alter view public.users_safe set (security_invoker = false);

-- Reforça o grant correto (somente autenticados; anon já foi revogado antes).
revoke all on public.users_safe from anon;
grant select on public.users_safe to authenticated;

-- 2) Trancar `users`: remove todas as policies existentes e habilita RLS sem
--    nenhuma policy para papéis não-privilegiados.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'users'
  loop
    execute format('drop policy if exists %I on public.users', pol.policyname);
  end loop;
end $$;

-- ENABLE (não FORCE): o dono da tabela e papéis BYPASSRLS (service_role)
-- continuam ignorando o RLS — essencial para a view users_safe (definer) e a
-- função can_view_employee (security definer) seguirem lendo `users`. FORCE
-- sujeitaria o dono ao RLS e quebraria esses objetos.
alter table public.users enable row level security;
