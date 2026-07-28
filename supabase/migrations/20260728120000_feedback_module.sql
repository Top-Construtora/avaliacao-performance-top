-- Fase 3 (roadmap): módulo de feedback contínuo.
--
-- Três tabelas backend-only (acesso via API; anon/authenticated sem GRANT):
--   feedback_types    — tipos configuráveis pelo RH (Advertência restrita)
--   feedbacks         — feedback enviado, com leitura/ciência do destinatário
--   feedback_requests — solicitações de feedback entre colaboradores

create table if not exists public.feedback_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default 'gray',
  icon text not null default 'MessageSquare',
  restricted_to_admin boolean not null default false,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id),
  recipient_id uuid not null references public.users(id),
  type_id uuid not null references public.feedback_types(id),
  message text not null,
  competencies text[] not null default '{}',
  -- Observação interna: visível apenas a admin/diretoria, nunca ao destinatário
  internal_note text,
  request_id uuid,
  read_at timestamptz,
  acknowledged_at timestamptz,
  recipient_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedbacks_no_self check (author_id <> recipient_id)
);

create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  -- requester pede feedback SOBRE SI para requested (que será o autor)
  requester_id uuid not null references public.users(id),
  requested_id uuid not null references public.users(id),
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'fulfilled', 'declined')),
  feedback_id uuid references public.feedbacks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_requests_no_self check (requester_id <> requested_id)
);

alter table public.feedbacks
  add constraint feedbacks_request_fk
  foreign key (request_id) references public.feedback_requests(id) on delete set null;

create index if not exists idx_feedbacks_recipient on public.feedbacks (recipient_id, created_at desc);
create index if not exists idx_feedbacks_author on public.feedbacks (author_id, created_at desc);
create index if not exists idx_feedback_requests_requested on public.feedback_requests (requested_id, status);
create index if not exists idx_feedback_requests_requester on public.feedback_requests (requester_id, status);

-- RLS backend-only (padrão do projeto)
alter table public.feedback_types enable row level security;
alter table public.feedbacks enable row level security;
alter table public.feedback_requests enable row level security;

revoke all on public.feedback_types from anon, authenticated;
revoke all on public.feedbacks from anon, authenticated;
revoke all on public.feedback_requests from anon, authenticated;

create policy "Service manages feedback types" on public.feedback_types
  for all to service_role using (true) with check (true);
create policy "Service manages feedbacks" on public.feedbacks
  for all to service_role using (true) with check (true);
create policy "Service manages feedback requests" on public.feedback_requests
  for all to service_role using (true) with check (true);

-- Seed dos tipos padrão (renomeáveis pelo RH)
insert into public.feedback_types (name, color, icon, restricted_to_admin, position) values
  ('Positivo',       'green',  'ThumbsUp',      false, 1),
  ('Reconhecimento', 'lime',   'Award',         false, 2),
  ('Desenvolvimento','blue',   'TrendingUp',    false, 3),
  ('Orientação',     'amber',  'Compass',       false, 4),
  ('Advertência',    'red',    'AlertTriangle', true,  5)
on conflict (name) do nothing;

-- Nova categoria de preferência de e-mail: 'feedbacks'
alter table public.notification_preferences
  drop constraint if exists notification_preferences_category_check;
alter table public.notification_preferences
  add constraint notification_preferences_category_check
  check (category in (
    'avaliacoes', 'pdi', 'pesquisas', 'entrevistas',
    'carreira', 'recrutamento', 'equipe', 'feedbacks'
  ));
