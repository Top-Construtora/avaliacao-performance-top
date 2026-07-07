-- Segurança (H11): remover acesso NÃO autenticado ao diretório de funcionários.
--
-- A migração 20260706120000 concedeu `select` em public.users_safe para o papel
-- `anon`. Como a chave anônima do Supabase é pública (embarcada no bundle do
-- frontend), isso permite que qualquer pessoa, SEM login, enumere todas as
-- linhas da view (nome, e-mail, departamento, reports_to) — apenas o cargo
-- sigiloso é mascarado. A aplicação sempre consome a view autenticada, então
-- revogar `anon` não quebra nenhum fluxo legítimo.
--
-- Referência: auditoria de segurança 2026-07-06, achado H11.

revoke select on public.users_safe from anon;

-- Mantém o acesso apenas para usuários autenticados.
grant select on public.users_safe to authenticated;
