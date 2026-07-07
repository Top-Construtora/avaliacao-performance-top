-- Segurança (C4/H6): habilitar RLS nas tabelas que o FRONTEND lê diretamente
-- com a anon key. Hoje o EvaluationContext faz `select *` em self_evaluations e
-- leader_evaluations SEM filtro — sem RLS, qualquer usuário logado (ou a anon
-- key) lê TODAS as avaliações de desempenho de toda a empresa, contornando o
-- backend. Estas políticas replicam o modelo de acesso da aplicação.
--
-- IMPORTANTE:
--   * O backend usa a service_role, que IGNORA o RLS — portanto estas políticas
--     NÃO afetam nenhuma leitura/escrita do servidor. Só restringem o acesso
--     direto do navegador (anon key), que é o vetor do achado H6.
--   * As ESCRITAS dessas tabelas já ocorrem via backend (service_role); por isso
--     só definimos políticas de SELECT. Sem política de INSERT/UPDATE/DELETE,
--     usuários autenticados não conseguem escrever direto — o que é desejado.
--
-- TESTAR EM STAGING antes de produção (ex.: `supabase db reset` local ou um
-- projeto de staging). Não aplicar às cegas em produção.

-- ---------------------------------------------------------------------------
-- Função de apoio: quem pode ver os dados de RH de `target_employee`.
--   - o próprio colaborador
--   - diretor ou admin (veem todos)
--   - líder direto (users.reports_to = auth.uid())
-- security definer + search_path fixo para poder ler `users` independentemente
-- do RLS da própria tabela e evitar hijack de search_path.
-- ---------------------------------------------------------------------------
create or replace function public.can_view_employee(target_employee uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = target_employee
    or exists (
      select 1 from public.users e
      where e.id = target_employee
        and e.reports_to = auth.uid()
    )
    or exists (
      select 1 from public.users v
      where v.id = auth.uid()
        and (
          coalesce(v.is_director, false)
          or coalesce((to_jsonb(v) ->> 'is_admin')::boolean, false)
        )
    );
$$;

revoke all on function public.can_view_employee(uuid) from public;
grant execute on function public.can_view_employee(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- self_evaluations: visível ao dono, líder direto, diretor/admin.
-- ---------------------------------------------------------------------------
alter table public.self_evaluations enable row level security;
drop policy if exists "self_evaluations_select" on public.self_evaluations;
create policy "self_evaluations_select"
  on public.self_evaluations
  for select
  to authenticated
  using (public.can_view_employee(employee_id));

-- ---------------------------------------------------------------------------
-- leader_evaluations: visível ao avaliado, ao avaliador, líder direto,
-- diretor/admin.
-- ---------------------------------------------------------------------------
alter table public.leader_evaluations enable row level security;
drop policy if exists "leader_evaluations_select" on public.leader_evaluations;
create policy "leader_evaluations_select"
  on public.leader_evaluations
  for select
  to authenticated
  using (
    public.can_view_employee(employee_id)
    or evaluator_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- evaluation_competencies: filha das avaliações (join no frontend). Visível
-- somente se a avaliação-pai correspondente for visível ao usuário.
-- ---------------------------------------------------------------------------
alter table public.evaluation_competencies enable row level security;
drop policy if exists "evaluation_competencies_select" on public.evaluation_competencies;
create policy "evaluation_competencies_select"
  on public.evaluation_competencies
  for select
  to authenticated
  using (
    exists (
      select 1 from public.self_evaluations s
      where s.id = evaluation_competencies.self_evaluation_id
        and public.can_view_employee(s.employee_id)
    )
    or exists (
      select 1 from public.leader_evaluations l
      where l.id = evaluation_competencies.leader_evaluation_id
        and (public.can_view_employee(l.employee_id) or l.evaluator_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- career_tracks: dado de referência (trilhas) lido no cadastro/edição de
-- usuário. Baixa sensibilidade — liberado para qualquer autenticado.
-- ---------------------------------------------------------------------------
alter table public.career_tracks enable row level security;
drop policy if exists "career_tracks_select" on public.career_tracks;
create policy "career_tracks_select"
  on public.career_tracks
  for select
  to authenticated
  using (true);
