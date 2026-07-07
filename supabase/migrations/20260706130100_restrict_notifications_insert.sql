-- Segurança (M10): corrigir política de RLS permissiva em `notifications`.
--
-- A política "Service can insert notifications" foi criada como
--   FOR INSERT WITH CHECK (true)
-- SEM cláusula `TO`, portanto aplica-se ao papel `public` — ou seja, qualquer
-- usuário autenticado podia inserir notificação para QUALQUER destinatário
-- (spoofing/phishing interno). O backend insere notificações usando a chave
-- `service_role`, que ignora o RLS, então restringir a política ao papel de
-- serviço NÃO afeta o fluxo legítimo do servidor.
--
-- Referência: auditoria de segurança 2026-07-06, achado M10.

-- Garante que o RLS esteja habilitado (idempotente).
alter table public.notifications enable row level security;

-- Remove a política permissiva (nome conforme NOTIFICATION_SYSTEM.md).
drop policy if exists "Service can insert notifications" on public.notifications;

-- Recria a inserção restrita EXCLUSIVAMENTE ao papel de serviço.
-- (service_role já ignora o RLS; a política explícita documenta a intenção e
--  garante que os papéis anon/authenticated permaneçam sem permissão de INSERT.)
create policy "Service can insert notifications"
  on public.notifications
  for insert
  to service_role
  with check (true);
