-- Fase 5A (roadmap): módulo de Learning — cursos, turmas, inscrições,
-- progresso, catálogo com autoinscrição e cursos externos com aprovação.
--
-- Conteúdos referenciam URLs (vídeo, link, arquivo hospedado). Upload nativo
-- para Supabase Storage, trilhas e pesquisa de satisfação de curso ficam
-- para o corte 5B.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  workload_hours numeric(6,1),
  cover_url text,
  active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_contents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  -- agrupador simples de conteúdos (módulo/seção do curso)
  section text,
  title text not null,
  type text not null default 'link' check (type in ('video', 'link', 'file')),
  url text not null,
  mandatory boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  -- permite concluir depois do prazo (senão o progresso trava no vencimento)
  allow_late_completion boolean not null default true,
  -- turma aberta no catálogo para autoinscrição
  self_enrollment boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.course_classes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  mandatory boolean not null default false,
  progress int not null default 0 check (progress between 0 and 100),
  completed_at timestamptz,
  enrolled_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique (class_id, user_id)
);

create table if not exists public.content_progress (
  enrollment_id uuid not null references public.class_enrollments(id) on delete cascade,
  content_id uuid not null references public.course_contents(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (enrollment_id, content_id)
);

create table if not exists public.external_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  institution text,
  workload_hours numeric(6,1),
  completed_at date,
  certificate_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.users(id),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_contents_course on public.course_contents (course_id, position);
create index if not exists idx_course_classes_course on public.course_classes (course_id);
create index if not exists idx_class_enrollments_user on public.class_enrollments (user_id);
create index if not exists idx_class_enrollments_class on public.class_enrollments (class_id);
create index if not exists idx_external_courses_user on public.external_courses (user_id);

-- RLS backend-only (padrão do projeto)
alter table public.courses enable row level security;
alter table public.course_contents enable row level security;
alter table public.course_classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.content_progress enable row level security;
alter table public.external_courses enable row level security;

revoke all on public.courses from anon, authenticated;
revoke all on public.course_contents from anon, authenticated;
revoke all on public.course_classes from anon, authenticated;
revoke all on public.class_enrollments from anon, authenticated;
revoke all on public.content_progress from anon, authenticated;
revoke all on public.external_courses from anon, authenticated;

create policy "Service manages courses" on public.courses
  for all to service_role using (true) with check (true);
create policy "Service manages course contents" on public.course_contents
  for all to service_role using (true) with check (true);
create policy "Service manages course classes" on public.course_classes
  for all to service_role using (true) with check (true);
create policy "Service manages class enrollments" on public.class_enrollments
  for all to service_role using (true) with check (true);
create policy "Service manages content progress" on public.content_progress
  for all to service_role using (true) with check (true);
create policy "Service manages external courses" on public.external_courses
  for all to service_role using (true) with check (true);

-- Nova categoria de preferência de e-mail: 'learning'
alter table public.notification_preferences
  drop constraint if exists notification_preferences_category_check;
alter table public.notification_preferences
  add constraint notification_preferences_category_check
  check (category in (
    'avaliacoes', 'pdi', 'pesquisas', 'entrevistas',
    'carreira', 'recrutamento', 'equipe', 'feedbacks', 'reunioes', 'learning'
  ));
