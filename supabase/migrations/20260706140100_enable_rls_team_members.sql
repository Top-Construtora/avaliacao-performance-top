-- Segurança (H6): habilitar RLS em team_members.
--
-- As três escritas que o frontend fazia direto no Supabase com a anon key
-- (RegisterUser insert; EditUser delete + insert) foram movidas para o backend
-- (PUT/POST /users/:id/teams, protegidas por diretor). Portanto:
--   * SELECT liberado para autenticados — a leitura de composição de times é
--     usada em vários pontos da UI e pela view users_safe (security_invoker).
--   * SEM política de INSERT/UPDATE/DELETE → escrita direta pelo navegador fica
--     bloqueada; o backend (service_role) ignora o RLS e segue funcionando.
--
-- Pré-requisito: o deploy do frontend que remove os `supabase.from('team_members')`
-- deve ir junto/antes, senão a edição de times pela tela quebra.
--
-- TESTAR EM STAGING antes de produção.

alter table public.team_members enable row level security;

drop policy if exists "team_members_select" on public.team_members;
create policy "team_members_select"
  on public.team_members
  for select
  to authenticated
  using (true);
