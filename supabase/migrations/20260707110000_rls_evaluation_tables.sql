-- Épico RLS · Fase 3 · Chunk B1 — RLS nas tabelas de avaliação por-pessoa que
-- o frontend só LÊ (writes são do backend via service_role, que ignora RLS).
--
-- Fecha o over-reading de usuário logado em self/leader_evaluations e
-- evaluation_competencies. As LEITURAS diretas do front (EvaluationContext,
-- NineBox, Consensus) continuam funcionando, porém ESCOPADAS pela RLS:
--   - colaborador comum: vê só o próprio (employee_id = auth.uid());
--   - líder direto: vê os subordinados (users.reports_to = auth.uid());
--   - diretor/admin: vê todos.
--
-- CRÍTICO: as policies PERMISSIVAS antigas (ex.: "Authenticated can view ..."
-- USING (auth.uid() IS NOT NULL)) precisam ser REMOVIDAS — senão, como policies
-- são OR, elas continuariam liberando tudo e a restritiva seria inútil. Por isso
-- o DO-block que dropa TODAS as policies de cada tabela antes de recriar.
--
-- ⚠️ Comportamento a validar: NineBox p/ um LÍDER passa a mostrar só os
-- subordinados dele (antes, sem RLS, podia mostrar todos). Isso é o correto,
-- mas confirme com o time se era o esperado. Testar logado como colaborador
-- comum E como líder.
--
-- Rollback por tabela: alter table public.<t> disable row level security;

-- ---------------------------------------------------------------------------
-- Função de visibilidade (idempotente). security definer p/ ler `users`
-- independentemente do RLS da própria tabela; search_path fixo p/ segurança.
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
      where e.id = target_employee and e.reports_to = auth.uid()
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
-- self_evaluations
-- ---------------------------------------------------------------------------
do $$ declare pol record; begin
  for pol in select policyname from pg_policies
    where schemaname='public' and tablename='self_evaluations'
  loop execute format('drop policy if exists %I on public.self_evaluations', pol.policyname); end loop;
end $$;

alter table public.self_evaluations enable row level security;

create policy "self_evaluations_select"
  on public.self_evaluations for select to authenticated
  using (public.can_view_employee(employee_id));

-- ---------------------------------------------------------------------------
-- leader_evaluations (também visível ao avaliador)
-- ---------------------------------------------------------------------------
do $$ declare pol record; begin
  for pol in select policyname from pg_policies
    where schemaname='public' and tablename='leader_evaluations'
  loop execute format('drop policy if exists %I on public.leader_evaluations', pol.policyname); end loop;
end $$;

alter table public.leader_evaluations enable row level security;

create policy "leader_evaluations_select"
  on public.leader_evaluations for select to authenticated
  using (public.can_view_employee(employee_id) or evaluator_id = auth.uid());

-- ---------------------------------------------------------------------------
-- evaluation_competencies (filha; lida via embed no select das avaliações).
-- Visível se a avaliação-pai correspondente for visível.
-- ---------------------------------------------------------------------------
do $$ declare pol record; begin
  for pol in select policyname from pg_policies
    where schemaname='public' and tablename='evaluation_competencies'
  loop execute format('drop policy if exists %I on public.evaluation_competencies', pol.policyname); end loop;
end $$;

alter table public.evaluation_competencies enable row level security;

create policy "evaluation_competencies_select"
  on public.evaluation_competencies for select to authenticated
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
