-- Épico RLS · Fase 3 · Chunk B2 — RLS em consensus_evaluations.
--
-- Pré-requisito (JÁ FEITO no código): o insert de consenso saiu do frontend
-- (Consensus.tsx) e foi para o backend (POST /evaluations/consensus-evaluation,
-- director-gated, service_role). Promote e deliberations já eram backend. Logo,
-- não é preciso policy de escrita para `authenticated` — só o service_role
-- escreve (e ele ignora RLS).
--
-- As LEITURAS diretas do front (Consensus.tsx lê consensus_evaluations para
-- checar duplicata e exibir) continuam funcionando, porém escopadas por
-- can_view_employee (diretor vê tudo; colaborador vê o próprio).
--
-- Dropar as policies permissivas antigas antes (DO-block), senão a restritiva
-- seria inútil (policies são OR).
--
-- DEPLOY: subir o backend+frontend desta mudança ANTES de aplicar esta migração
-- (senão o "salvar consenso" quebra). Rollback: alter table ... disable row level security;

-- Função de visibilidade (idempotente — mesma do B1).
create or replace function public.can_view_employee(target_employee uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    auth.uid() = target_employee
    or exists (select 1 from public.users e where e.id = target_employee and e.reports_to = auth.uid())
    or exists (select 1 from public.users v where v.id = auth.uid()
      and (coalesce(v.is_director,false) or coalesce((to_jsonb(v)->>'is_admin')::boolean,false)));
$$;
revoke all on function public.can_view_employee(uuid) from public;
grant execute on function public.can_view_employee(uuid) to authenticated;

-- consensus_evaluations
do $$ declare pol record; begin
  for pol in select policyname from pg_policies
    where schemaname='public' and tablename='consensus_evaluations'
  loop execute format('drop policy if exists %I on public.consensus_evaluations', pol.policyname); end loop;
end $$;

alter table public.consensus_evaluations enable row level security;

create policy "consensus_evaluations_select"
  on public.consensus_evaluations for select to authenticated
  using (public.can_view_employee(employee_id));
