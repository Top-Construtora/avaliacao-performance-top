-- Fase 2 (roadmap): tornar audit_logs funcional.
--
-- A tabela já existia como esqueleto (nada gravava nela). Este ajuste adiciona
-- as colunas de correlação, índices de consulta e trava o acesso no padrão
-- backend-only (a fase 3a do plano de RLS já havia revogado authenticated).

alter table public.audit_logs
  add column if not exists actor_email text,
  add column if not exists request_id text;

create index if not exists idx_audit_logs_entity
  on public.audit_logs (table_name, record_id, created_at desc);

create index if not exists idx_audit_logs_actor
  on public.audit_logs (user_id, created_at desc);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs (created_at);

alter table public.audit_logs enable row level security;

revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;

drop policy if exists "Service manages audit logs" on public.audit_logs;
create policy "Service manages audit logs"
  on public.audit_logs
  for all
  to service_role
  using (true)
  with check (true);
