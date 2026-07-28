-- Fase 1 (roadmap): preferências de notificação por e-mail.
--
-- Uma linha por (usuário, categoria). Ausência de linha = e-mail habilitado
-- (default ligado). O backend lê/escreve com service_role; anon/authenticated
-- não têm acesso direto (padrão backend-only, ver docs/rls-rollout-plan.md).

create table if not exists public.notification_preferences (
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in (
    'avaliacoes', 'pdi', 'pesquisas', 'entrevistas',
    'carreira', 'recrutamento', 'equipe'
  )),
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.notification_preferences enable row level security;

revoke all on public.notification_preferences from anon;
revoke all on public.notification_preferences from authenticated;

-- service_role ignora RLS; a política explícita documenta a intenção.
create policy "Service manages notification preferences"
  on public.notification_preferences
  for all
  to service_role
  using (true)
  with check (true);
