-- View: public.users_safe
--
-- Espelha a tabela `users`, mas MASCARA a coluna `position` para usuários
-- marcados como `position_is_confidential = true`, exceto quando quem consulta
-- (auth.uid()) tem permissão de ver o cargo real. Consumida pelo frontend em
-- EvaluationContext.tsx. A mesma regra existe em
-- backend/src/utils/positionMaskingUtils.ts (o backend usa service_role, que
-- bypassa RLS e a view).
--
-- Vê o cargo cru quem:
--   - é o próprio usuário          (auth.uid() = u.id)
--   - é admin                      (viewer.is_admin)
--   - é diretor                    (viewer.is_director)
--   - é líder direto               (u.reports_to = auth.uid())
--   - o alvo NÃO é sigiloso        (position_is_confidential != true)
--
-- Ao mascarar, `position` vira "<cargo-base> de <área>":
--   cargo-base: job_positions.name → position sem senioridade → "Colaborador"
--   área:       primeiro time      → departamento              → (sem área)
--
-- is_admin e position_is_confidential são lidos via to_jsonb para não quebrar a
-- criação da view caso a coluna ainda não exista no schema.

create or replace view public.users_safe
with (security_invoker = true) as
select (jsonb_populate_record(
          null::public.users,
          to_jsonb(u) || jsonb_build_object('position', v.final_position)
       )).*
from public.users u
cross join lateral (
  select
    case
      when calc.can_view                          then u.position
      when calc.base_role = '' and calc.area = ''  then 'Colaborador'
      when calc.base_role = ''                     then 'Colaborador de ' || calc.area
      when calc.area = ''                          then calc.base_role
      else calc.base_role || ' de ' || calc.area
    end as final_position
  from (
    select
      (
        coalesce((to_jsonb(u) ->> 'position_is_confidential')::boolean, false) = false
        or auth.uid() = u.id
        or u.reports_to = auth.uid()
        or exists (
          select 1
          from public.users vu
          where vu.id = auth.uid()
            and (
              coalesce(vu.is_director, false)
              or coalesce((to_jsonb(vu) ->> 'is_admin')::boolean, false)
            )
        )
      ) as can_view,
      coalesce(
        nullif(trim((select jp.name from public.job_positions jp where jp.id = u.position_id)), ''),
        nullif(trim(regexp_replace(
          coalesce(u.position, ''),
          '\s*-?\s*(M[DCLXVI]+|[IVX]+|\d+|Jr\.?|Pl\.?|Sr\.?|J[uú]nior|Pleno|S[eê]nior)\s*$',
          '', 'i'
        )), ''),
        ''
      ) as base_role,
      coalesce(
        nullif(trim((
          select t.name
          from public.team_members tm
          join public.teams t on t.id = tm.team_id
          where tm.user_id = u.id
          order by tm.created_at asc
          limit 1
        )), ''),
        nullif(trim((select d.name from public.departments d where d.id = u.department_id)), ''),
        ''
      ) as area
  ) calc
) v;

grant select on public.users_safe to anon, authenticated;
