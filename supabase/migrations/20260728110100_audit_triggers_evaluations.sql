-- Fase 2 (roadmap): auditoria por trigger nas tabelas de avaliação que o
-- FRONTEND ainda escreve direto no Supabase (self/leader/consensus) — ver
-- docs/rls-rollout-plan.md, fases 2-4. O backend audita via auditService;
-- estes triggers cobrem o caminho que não passa pelo backend.
--
-- REMOVER estes triggers quando o refactor mover essas escritas para a API.

create or replace function public.fn_audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id uuid;
  v_old jsonb;
  v_new jsonb;
begin
  -- Escritas do backend usam service_role (auth.uid() nulo) e já são
  -- auditadas pelo auditService com o ator completo. O trigger cobre
  -- apenas o caminho direto do frontend (authenticated).
  if auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'DELETE' then
    v_record_id := old.id;
    v_old := to_jsonb(old);
    v_new := null;
  elsif tg_op = 'INSERT' then
    v_record_id := new.id;
    v_old := null;
    v_new := to_jsonb(new);
  else
    v_record_id := new.id;
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
  end if;

  insert into public.audit_logs
    (user_id, action, table_name, record_id, old_data, new_data, created_at)
  values
    (auth.uid(), lower(tg_op), tg_table_name, v_record_id, v_old, v_new, now());

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
exception when others then
  -- Auditoria nunca pode derrubar a operação principal
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_audit_self_evaluations on public.self_evaluations;
create trigger trg_audit_self_evaluations
  after insert or update or delete on public.self_evaluations
  for each row execute function public.fn_audit_row();

drop trigger if exists trg_audit_leader_evaluations on public.leader_evaluations;
create trigger trg_audit_leader_evaluations
  after insert or update or delete on public.leader_evaluations
  for each row execute function public.fn_audit_row();

drop trigger if exists trg_audit_consensus_evaluations on public.consensus_evaluations;
create trigger trg_audit_consensus_evaluations
  after insert or update or delete on public.consensus_evaluations
  for each row execute function public.fn_audit_row();
