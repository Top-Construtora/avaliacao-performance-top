-- Fase 4 (roadmap): módulo de reuniões 1:1.
--
-- Tabelas backend-only (acesso via API): tipos, reuniões com recorrência,
-- participantes, pauta, anotações (públicas/privadas) e tarefas.

create table if not exists public.meeting_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.meeting_types(id),
  organizer_id uuid not null references public.users(id),
  title text,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  location text,
  meeting_url text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  recurrence text not null default 'none'
    check (recurrence in ('none', 'weekly', 'biweekly', 'monthly')),
  -- ocorrência gerada a partir de uma reunião recorrente anterior
  parent_meeting_id uuid references public.meetings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meeting_participants (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (meeting_id, user_id)
);

create table if not exists public.meeting_topics (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  text text not null,
  position int not null default 0,
  covered boolean not null default false,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  author_id uuid not null references public.users(id),
  content text not null,
  -- anotação privada: visível apenas ao autor
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_tasks (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  description text not null,
  assignee_id uuid references public.users(id),
  due_date date,
  done_at timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_meetings_organizer on public.meetings (organizer_id, scheduled_at desc);
create index if not exists idx_meetings_scheduled on public.meetings (status, scheduled_at);
create index if not exists idx_meeting_participants_user on public.meeting_participants (user_id);

-- RLS backend-only (padrão do projeto)
alter table public.meeting_types enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_topics enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.meeting_tasks enable row level security;

revoke all on public.meeting_types from anon, authenticated;
revoke all on public.meetings from anon, authenticated;
revoke all on public.meeting_participants from anon, authenticated;
revoke all on public.meeting_topics from anon, authenticated;
revoke all on public.meeting_notes from anon, authenticated;
revoke all on public.meeting_tasks from anon, authenticated;

create policy "Service manages meeting types" on public.meeting_types
  for all to service_role using (true) with check (true);
create policy "Service manages meetings" on public.meetings
  for all to service_role using (true) with check (true);
create policy "Service manages meeting participants" on public.meeting_participants
  for all to service_role using (true) with check (true);
create policy "Service manages meeting topics" on public.meeting_topics
  for all to service_role using (true) with check (true);
create policy "Service manages meeting notes" on public.meeting_notes
  for all to service_role using (true) with check (true);
create policy "Service manages meeting tasks" on public.meeting_tasks
  for all to service_role using (true) with check (true);

-- Seed dos tipos padrão (renomeáveis pelo RH)
insert into public.meeting_types (name, position) values
  ('1:1', 1),
  ('Alinhamento', 2),
  ('Devolutiva', 3),
  ('Outro', 4)
on conflict (name) do nothing;

-- Nova categoria de preferência de e-mail: 'reunioes'
alter table public.notification_preferences
  drop constraint if exists notification_preferences_category_check;
alter table public.notification_preferences
  add constraint notification_preferences_category_check
  check (category in (
    'avaliacoes', 'pdi', 'pesquisas', 'entrevistas',
    'carreira', 'recrutamento', 'equipe', 'feedbacks', 'reunioes'
  ));
