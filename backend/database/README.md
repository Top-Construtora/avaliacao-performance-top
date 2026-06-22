# SQL legado — CONGELADO ❄️

Os arquivos `.sql` desta pasta (e de `backend/sql/`) são **históricos**: foram
aplicados manualmente em produção pelo SQL Editor, antes da adoção de migrações
versionadas. Ficam aqui só como registro.

**Não adicione novos `.sql` aqui.** Toda mudança de schema agora passa por
`supabase/migrations/` — ver `supabase/README.md` e `docs/adr/0002`.

Quando o baseline da produção for capturado (`supabase db pull`), o conteúdo
destes arquivos já estará refletido no schema versionado. Eles podem ser
removidos com segurança depois disso.

| Arquivo                                     | O que fez                                   |
| ------------------------------------------- | ------------------------------------------- |
| `rls_policies.sql` / `fix_rls_policies.sql` | Políticas RLS                               |
| `add_ninebox_promotion.sql`                 | Promoção de quadrante 9-box                 |
| `add_committee_deliberations.sql`           | Deliberações do comitê                      |
| `add_potential_details.sql`                 | Detalhes de potencial                       |
| `add_position_confidentiality.sql`          | Cargo sigiloso (`position_is_confidential`) |
| `fix_user_salaries.sql`                     | Correção de salários                        |
| `../sql/create_notifications_table.sql`     | Tabela de notificações                      |
