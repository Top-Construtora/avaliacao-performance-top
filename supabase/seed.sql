-- Seed de desenvolvimento — roda automaticamente no `supabase db reset`.
-- SOMENTE dados fictícios (este arquivo é versionado no git).
--
-- Usuários locais (senha de todos: local123):
--   admin@local.test    → admin
--   diretora@local.test → diretora
--   lider@local.test    → líder (reporta à diretora)
--   ana@local.test, bruno@local.test, carla@local.test → colaboradores do líder
--
-- Vem com um ciclo aberto e avaliações completas (auto + líder + consenso)
-- para os três colaboradores, em quadrantes diferentes do 9-Box — troque de
-- colaborador no Comitê de Gente para ver o ponto viajar pela matriz.

-- ============================== AUTH ==================================
-- GoTrue local: basta a linha em auth.users + auth.identities.
do $$
declare
  reg record;
begin
  for reg in
    select * from (values
      ('a0000000-0000-4000-8000-000000000001'::uuid, 'admin@local.test'),
      ('a0000000-0000-4000-8000-000000000002'::uuid, 'diretora@local.test'),
      ('a0000000-0000-4000-8000-000000000003'::uuid, 'lider@local.test'),
      ('a0000000-0000-4000-8000-000000000004'::uuid, 'ana@local.test'),
      ('a0000000-0000-4000-8000-000000000005'::uuid, 'bruno@local.test'),
      ('a0000000-0000-4000-8000-000000000006'::uuid, 'carla@local.test')
    ) as t(uid, mail)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', reg.uid, 'authenticated', 'authenticated',
      reg.mail, extensions.crypt('local123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), reg.uid, reg.uid::text,
      jsonb_build_object('sub', reg.uid::text, 'email', reg.mail),
      'email', now(), now(), now()
    ) on conflict (provider_id, provider) do nothing;
  end loop;
end $$;

-- ============================ ESTRUTURA ================================
insert into public.departments (id, name, description, responsible_id)
values ('d0000000-0000-4000-8000-000000000001', 'Engenharia', 'Departamento de teste', null)
on conflict (id) do nothing;

insert into public.users (id, email, name, position, is_admin, is_director, is_leader,
                          reports_to, department_id, active, must_change_password, join_date)
values
  ('a0000000-0000-4000-8000-000000000001', 'admin@local.test',    'Admin Local',      'Administrador',   true,  false, false, null, null, true, false, '2024-01-01'),
  ('a0000000-0000-4000-8000-000000000002', 'diretora@local.test', 'Diretora Local',   'Diretora',        false, true,  true,  null, 'd0000000-0000-4000-8000-000000000001', true, false, '2024-01-01'),
  ('a0000000-0000-4000-8000-000000000003', 'lider@local.test',    'Líder Local',      'Coordenador',     false, false, true,  'a0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', true, false, '2024-06-01'),
  ('a0000000-0000-4000-8000-000000000004', 'ana@local.test',      'Ana Teste',        'Analista Pleno',  false, false, false, 'a0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', true, false, '2025-02-01'),
  ('a0000000-0000-4000-8000-000000000005', 'bruno@local.test',    'Bruno Teste',      'Analista Júnior', false, false, false, 'a0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', true, false, '2025-08-01'),
  ('a0000000-0000-4000-8000-000000000006', 'carla@local.test',    'Carla Teste',      'Especialista',    false, false, false, 'a0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', true, false, '2023-03-01')
on conflict (id) do nothing;

update public.departments
  set responsible_id = 'a0000000-0000-4000-8000-000000000002'
  where id = 'd0000000-0000-4000-8000-000000000001';

insert into public.teams (id, name, department_id, responsible_id, description)
values ('e0000000-0000-4000-8000-000000000001', 'Time Produto',
        'd0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003',
        'Time de teste')
on conflict (id) do nothing;

insert into public.team_members (team_id, user_id) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003'),
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004'),
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005'),
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006')
on conflict do nothing;

-- ======================= CARREIRA E SALÁRIOS ==========================
-- Estrutura mínima para o fluxo de cadastro (departamento → trilha →
-- cargo → internível) funcionar no banco local.
insert into public.salary_classes (id, code, name, order_index)
values ('f0000000-0000-4000-8000-000000000001', 'I', 'Classe I', 1)
on conflict (id) do nothing;

insert into public.salary_levels (id, name, percentage, order_index) values
  ('f1000000-0000-4000-8000-000000000001', 'A', 0, 1),
  ('f1000000-0000-4000-8000-000000000002', 'B', 5, 2),
  ('f1000000-0000-4000-8000-000000000003', 'C', 10, 3),
  ('f1000000-0000-4000-8000-000000000004', 'D', 15, 4),
  ('f1000000-0000-4000-8000-000000000005', 'E', 20, 5)
on conflict (id) do nothing;

insert into public.career_tracks (id, department_id, name, code, description)
values ('f2000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
        'Trilha Técnica', 'TEC', 'Trilha de teste')
on conflict (id) do nothing;

insert into public.job_positions (id, name, code) values
  ('f3000000-0000-4000-8000-000000000001', 'Analista', 'AN'),
  ('f3000000-0000-4000-8000-000000000002', 'Especialista', 'ES')
on conflict (id) do nothing;

insert into public.track_positions (id, track_id, position_id, class_id, base_salary, order_index) values
  ('f4000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001',
   'f3000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 5000, 1),
  ('f4000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000001',
   'f3000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 8000, 2)
on conflict (id) do nothing;

-- ============================== CICLO ==================================
insert into public.evaluation_cycles (id, title, description, start_date, end_date, status, created_by)
values ('c0000000-0000-4000-8000-000000000001', 'Ciclo Local 2026', 'Ciclo de teste do banco local',
        '2026-01-01', '2026-12-31', 'open', 'a0000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

-- ==================== AVALIAÇÕES (3 colaboradores) =====================
-- Quadrantes distintos de propósito: Ana (alto/alto), Bruno (médio/baixo),
-- Carla (alto desempenho/baixo potencial) — bom para ver o ponto do 9-Box viajar.
insert into public.self_evaluations (id, employee_id, cycle_id, status,
                                     technical_score, behavioral_score, deliveries_score, final_score)
values
  ('50000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000001', 'completed', 3.5, 3.6, 3.4, 3.50),
  ('50000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000001', 'completed', 2.4, 2.6, 2.2, 2.40),
  ('50000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001', 'completed', 3.6, 3.2, 3.4, 3.40)
on conflict (id) do nothing;

insert into public.leader_evaluations (id, employee_id, evaluator_id, cycle_id, status,
                                       technical_score, behavioral_score, deliveries_score,
                                       final_score, potential_score)
values
  ('60000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'completed', 3.7, 3.6, 3.8, 3.70, 3.60),
  ('60000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'completed', 2.3, 2.5, 2.1, 2.30, 1.80),
  ('60000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'completed', 3.6, 3.3, 3.5, 3.50, 1.90)
on conflict (id) do nothing;

insert into public.consensus_evaluations (id, employee_id, cycle_id, self_evaluation_id, leader_evaluation_id,
                                          consensus_score, potential_score, nine_box_position, notes)
values
  ('70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000001',
   '50000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 3.60, 3.50, 'B9', 'Consenso de teste — talento alto/alto'),
  ('70000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000001',
   '50000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 2.30, 1.80, 'B2', 'Consenso de teste — em desenvolvimento'),
  ('70000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001',
   '50000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000003', 3.50, 1.90, 'B3', 'Consenso de teste — especialista de entrega')
on conflict (id) do nothing;

-- ============================= STORAGE =================================
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('learning', 'learning', true)
on conflict (id) do nothing;
