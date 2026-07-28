-- Fase 5B (roadmap): trilhas de aprendizagem com liberação progressiva,
-- pesquisa de avaliação por turma e bucket de arquivos de curso.
--
-- Liberação progressiva: a inscrição no próximo curso da trilha é criada
-- automaticamente quando o anterior é concluído (não há "lock" — o curso
-- seguinte simplesmente ainda não existe como inscrição).

create table if not exists public.learning_tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_track_courses (
  track_id uuid not null references public.learning_tracks(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  position int not null default 0,
  primary key (track_id, course_id)
);

create table if not exists public.learning_track_enrollments (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.learning_tracks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  enrolled_by uuid references public.users(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (track_id, user_id)
);

create index if not exists idx_track_enrollments_user
  on public.learning_track_enrollments (user_id);

-- Pesquisa de avaliação vinculada à turma: disparada ao concluir o curso
alter table public.course_classes
  add column if not exists survey_id uuid references public.satisfaction_surveys(id) on delete set null;

-- RLS backend-only (padrão do projeto)
alter table public.learning_tracks enable row level security;
alter table public.learning_track_courses enable row level security;
alter table public.learning_track_enrollments enable row level security;

revoke all on public.learning_tracks from anon, authenticated;
revoke all on public.learning_track_courses from anon, authenticated;
revoke all on public.learning_track_enrollments from anon, authenticated;

create policy "Service manages learning tracks" on public.learning_tracks
  for all to service_role using (true) with check (true);
create policy "Service manages track courses" on public.learning_track_courses
  for all to service_role using (true) with check (true);
create policy "Service manages track enrollments" on public.learning_track_enrollments
  for all to service_role using (true) with check (true);

-- Bucket público de arquivos de curso (upload só pelo backend/service_role;
-- leitura pública via URL — conteúdo de treinamento, não dado sensível)
insert into storage.buckets (id, name, public)
values ('learning', 'learning', true)
on conflict (id) do nothing;
