-- Fase 5C (roadmap): normalização das ações do PDI.
--
-- As ações saem do JSONB (development_plans.items) para a tabela pdi_actions,
-- com id estável compartilhado entre as duas estruturas (transição dual-write:
-- o JSONB continua sendo escrito para as telas legadas; a tabela é a fonte
-- para vínculo com cursos, prazos reais e lembretes).
--
-- Status (mesmo domínio do JSONB): 1 Não iniciado, 2 Em andamento,
-- 3 Pausado, 4 Concluído, 5 Cancelado.

create table if not exists public.pdi_actions (
  development_plan_id uuid not null references public.development_plans(id) on delete cascade,
  -- id do item no JSONB (strings legadas tipo "curto_<ts>_<rand>" ou uuid novos)
  id text not null,
  competencia text not null default '',
  prazo text not null default 'curto' check (prazo in ('curto', 'medio', 'longo')),
  resultados_esperados text,
  como_desenvolver text,
  calendarizacao text,
  observacao text,
  status text not null default '1' check (status in ('1', '2', '3', '4', '5')),
  -- Novos campos (fase 5C) — vivem SÓ na tabela
  due_date date,
  course_id uuid references public.courses(id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (development_plan_id, id)
);

create index if not exists idx_pdi_actions_plan on public.pdi_actions (development_plan_id);
create index if not exists idx_pdi_actions_course
  on public.pdi_actions (course_id) where course_id is not null;
create index if not exists idx_pdi_actions_due
  on public.pdi_actions (due_date) where status not in ('4', '5');

alter table public.pdi_actions enable row level security;
revoke all on public.pdi_actions from anon, authenticated;
create policy "Service manages pdi actions" on public.pdi_actions
  for all to service_role using (true) with check (true);

-- 1) Garante id em todos os itens do JSONB (itens antigos sem id ganham
--    um id determinístico plano+índice)
update public.development_plans dp
set items = (
  select jsonb_agg(
    case
      when t.item ? 'id' and coalesce(t.item->>'id', '') <> '' then t.item
      else jsonb_set(t.item, '{id}', to_jsonb(dp.id::text || '_' || (t.idx - 1)::text))
    end
    order by t.idx
  )
  from jsonb_array_elements(dp.items) with ordinality as t(item, idx)
)
where jsonb_typeof(dp.items) = 'array' and jsonb_array_length(dp.items) > 0;

-- 2) Backfill das linhas a partir do JSONB
insert into public.pdi_actions
  (development_plan_id, id, competencia, prazo, resultados_esperados,
   como_desenvolver, calendarizacao, observacao, status, position)
select
  dp.id,
  t.item->>'id',
  coalesce(t.item->>'competencia', ''),
  case when t.item->>'prazo' in ('curto', 'medio', 'longo')
       then t.item->>'prazo' else 'curto' end,
  t.item->>'resultadosEsperados',
  t.item->>'comoDesenvolver',
  t.item->>'calendarizacao',
  t.item->>'observacao',
  case when t.item->>'status' in ('1', '2', '3', '4', '5')
       then t.item->>'status' else '1' end,
  t.idx - 1
from public.development_plans dp,
     lateral jsonb_array_elements(dp.items) with ordinality as t(item, idx)
where jsonb_typeof(dp.items) = 'array'
on conflict (development_plan_id, id) do nothing;
