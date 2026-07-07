-- Segurança (C4): fechar o acesso direto pela anon key às tabelas que HOJE só
-- o backend usa. A anon key é pública (vai no bundle) e o PostgREST expõe todo
-- o schema `public`; sem RLS, um atacante lê direto, por exemplo,
-- `GET /rest/v1/user_calculated_salaries` e obtém todos os salários.
--
-- Estratégia:
--   * Tabelas SOMENTE-BACKEND → `enable row level security` SEM nenhuma policy.
--     Isso NEGA todo acesso direto de anon/authenticated. O backend usa a
--     service_role, que IGNORA o RLS, então continua funcionando normalmente.
--   * Tabelas lidas pela VIEW users_safe (security_invoker) → precisam de uma
--     policy de SELECT para authenticated, senão a view para de retornar
--     nome do cargo/time/departamento. São dados de baixa sensibilidade.
--
-- NÃO inclui a tabela `users` — ver nota no final.
--
-- TESTAR EM STAGING antes de produção. A verificação recomendada é:
--   select relname, relrowsecurity from pg_class
--   where relnamespace = 'public'::regnamespace and relkind = 'r';
-- e conferir, logado como um colaborador comum no app, que nenhuma tela
-- quebrou.

-- ---------------------------------------------------------------------------
-- 1) Tabelas SOMENTE-BACKEND: RLS habilitado, SEM policy (deny-all direto).
--    O frontend nunca faz `supabase.from(...)` nestas tabelas; tudo passa
--    pela API (service_role).
-- ---------------------------------------------------------------------------
alter table public.consensus_evaluations   enable row level security;
alter table public.development_plans        enable row level security;
alter table public.evaluation_cycles        enable row level security;
alter table public.salary_classes           enable row level security;
alter table public.salary_levels            enable row level security;
alter table public.track_positions          enable row level security;
alter table public.progression_history      enable row level security;
alter table public.user_calculated_salaries enable row level security;
alter table public.audit_logs               enable row level security;

-- ---------------------------------------------------------------------------
-- 2) Tabelas lidas pela view users_safe (security_invoker): RLS habilitado com
--    SELECT liberado para autenticados (necessário para a view resolver
--    cargo/time/departamento). Escrita permanece só via service_role.
-- ---------------------------------------------------------------------------
alter table public.teams enable row level security;
drop policy if exists "teams_select" on public.teams;
create policy "teams_select"
  on public.teams for select to authenticated using (true);

alter table public.departments enable row level security;
drop policy if exists "departments_select" on public.departments;
create policy "departments_select"
  on public.departments for select to authenticated using (true);

alter table public.job_positions enable row level security;
drop policy if exists "job_positions_select" on public.job_positions;
create policy "job_positions_select"
  on public.job_positions for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- NOTA sobre `public.users` (NÃO tratada aqui, de propósito):
--
-- A view `users_safe` é `security_invoker = true` e lê a base `users` com as
-- permissões de quem chama. Portanto:
--   * Se habilitarmos RLS em `users` com uma policy permissiva (using true),
--     um atacante lê `GET /rest/v1/users?select=*` e obtém os cargos SEM o
--     mascaramento da view (pior que hoje).
--   * Se habilitarmos com policy restritiva (só a própria linha), a view
--     users_safe passa a retornar só o próprio usuário e quebra o diretório.
--
-- O caminho correto é converter `users_safe` para SECURITY DEFINER (view ou
-- função) — que lê `users` com privilégio elevado e devolve já mascarado — e
-- então trancar `users` com RLS restritiva. Isso deve ser feito e testado num
-- passo dedicado, com o schema em mãos. Antes disso, CONFIRME no painel se
-- `users` já tem RLS habilitado em produção (`relrowsecurity`).
