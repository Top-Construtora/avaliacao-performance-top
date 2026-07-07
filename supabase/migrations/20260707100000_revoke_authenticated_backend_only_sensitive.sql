-- Épico RLS · Fase 3a (ganho seguro, sem refactor de frontend).
--
-- Fecha o OVER-READING de usuário logado nas tabelas/views por-pessoa mais
-- sensíveis que o FRONTEND NUNCA acessa direto (confirmado por grep em
-- frontend/src: zero `.from()`/embed dessas). Hoje, com RLS desligado e grant
-- para `authenticated`, um colaborador logado consegue puxar via PostgREST,
-- com a anon key pública + o próprio JWT:
--   GET /rest/v1/user_calculated_salaries   → salário de todo mundo
--   GET /rest/v1/development_plans           → PDI de todo mundo
--   GET /rest/v1/progression_history         → histórico de progressão
--   GET /rest/v1/audit_logs                  → trilha de auditoria
--
-- Como só o backend (service_role, que tem grants próprios e ignora isto) lê
-- essas tabelas, basta REVOGAR o acesso de anon/authenticated. Não usa RLS —
-- é a abordagem correta para a VIEW `user_calculated_salaries` (não aceita
-- `enable row level security`) e a mais simples para as tabelas backend-only.
--
-- Reversível: `grant select on <obj> to authenticated;`
--
-- VALIDAR após aplicar (logado como COLABORADOR comum, não admin/diretor):
--   - nenhuma tela quebrou (essas telas não existem no front → nada usa);
--   - script autenticado como colaborador em user_calculated_salaries /
--     development_plans deve retornar `permission denied` (0 linhas).

revoke all on public.user_calculated_salaries from anon, authenticated;
revoke all on public.development_plans        from anon, authenticated;
revoke all on public.progression_history      from anon, authenticated;
revoke all on public.audit_logs               from anon, authenticated;
