# Épico: rollout de RLS (Row Level Security) em produção

Status: **em andamento** — mitigação de baixo risco aplicada; RLS "de verdade" bloqueado por refactor de frontend.

## Contexto (estado do banco em 2026-07-07)

Diagnóstico feito direto no Postgres de produção revelou:

1. **Quase todas as tabelas têm `rls_ligado = false`, mas já possuem policies** (herdadas de um setup anterior). Como o RLS está desligado, essas policies estão **inertes** — o acesso é governado só pelos GRANTs. Com o `anon`/`authenticated` tendo grant, os dados ficavam **abertos**.
2. `user_calculated_salaries` é uma **VIEW** (`relkind = 'v'`), não tabela → `alter table ... enable row level security` **falha** nela. Views se protegem via `revoke`/`security_invoker`.
3. As migrações `supabase/migrations/20260706140000..150100` foram escritas assumindo tabelas "limpas". No banco real elas:
   - **não removem as policies permissivas antigas** (ex.: `self_evaluations` tem `"Authenticated can view self evaluations" USING (auth.uid() IS NOT NULL)` — qualquer logado lê tudo). Ligar RLS + adicionar policy restritiva **não fecha nada**, porque a policy antiga continua e policies são OR.
   - classificam como "backend-only / deny-all" tabelas que **o frontend acessa direto** → quebrariam telas.

## Fase 1 — Mitigação de baixo risco (APLICADA ✅)

- `revoke all ... from anon` em todas as tabelas/views de dados → fecha a exposição **sem login** (C4/H11). Verificado: cliente anônimo recebe `401 permission denied`.
- `130000` (revoke anon em `users_safe`) e `130100` (INSERT de `notifications` só via `service_role`, anti-spoofing).

Não resolve o **over-reading de usuário logado** (um colaborador logado ainda pode ler dados de outros direto no PostgREST) — isso exige RLS de verdade (fases 2–4).

## Fase 3a — Revogar tabelas por-pessoa sem acesso direto do front (FEITA ✅ — migração `20260707100000`)

Ganho seguro sem refactor: `revoke ... from authenticated` em `user_calculated_salaries` (view), `development_plans`, `progression_history`, `audit_logs`. O frontend nunca lê essas (grep confirmado); só o backend (service_role). Fecha o over-reading de **salário e PDI** — o pedaço mais sensível do 🔴. Reversível via `grant`.

## Refinamento de estratégia (importante)

Nem tudo precisa de refactor (Fase 2). Dividir por natureza do dado:

- **Referência (não é por-pessoa):** `salary_levels`, `track_positions`, `job_positions`, `career_tracks`, `competencies`, `organizational_competencies`. São estrutura salarial/cargos, iguais p/ todos. O `revoke anon` (Fase 1) já basta — logado ler isso não é "over-read de terceiro". **Não precisam de refactor.**
- **Backend-only por-pessoa:** ver Fase 3a (revoke authenticated, sem refactor).
- **Por-pessoa lidas direto pelo front:** `self_evaluations`, `leader_evaluations`, `consensus_evaluations`, `evaluation_competencies` (embed). **Estas** precisam da RLS com `can_view_employee` + drop das policies antigas. O front pode continuar lendo direto (a RLS escopa) — não precisa mover a LEITURA; só o **write** de `consensus_evaluations` (Consensus.tsx:884, tela de diretor) precisa ir pro backend.

## Fase 2 — Refactor frontend → API (BLOQUEADOR)

Enquanto o frontend ler/escrever essas tabelas direto com a chave, não dá para trancá-las. Migrar para endpoints de backend (service_role + autorização):

| Arquivo                            | Tabela                                                               | Operação          |
| ---------------------------------- | -------------------------------------------------------------------- | ----------------- |
| `Consensus.tsx` (465, 835, 885)    | `consensus_evaluations`                                              | read + **insert** |
| `Consensus.tsx` (518)              | `self_evaluations`                                                   | read              |
| `Consensus.tsx` (545)              | `leader_evaluations`                                                 | read              |
| `NineBox.tsx` (440)                | `leader_evaluations`                                                 | read              |
| `EvaluationContext.tsx` (182, 187) | `self_/leader_evaluations`                                           | read              |
| `EditUser/RegisterUser.tsx`        | `career_tracks`, `track_positions`, `job_positions`, `salary_levels` | read              |
| `EditUser.tsx` (333)               | `team_members`                                                       | read              |

(Confirmar caso a caso com grep `\.from\('<tabela>'` no frontend antes de trancar cada uma.)

## Fase 3 — Reescrever as migrações de RLS

Para cada tabela, na ordem:

1. **`drop policy`** de TODAS as policies permissivas antigas (ex.: `"Authenticated can view ..."`, `"Users can manage own ..."` se o write for pra API).
2. `enable row level security`.
3. Criar as policies restritivas (ex.: `can_view_employee(employee_id)`).
4. `user_calculated_salaries`: **não** usar RLS — manter `revoke` de anon/authenticated (só backend lê).

## Fase 4 — Aplicar com validação

- Sem staging: aplicar **uma tabela/grupo por vez**, e testar logado como **colaborador comum** (não admin/diretor, que enxergam tudo) que nenhuma tela quebrou.
- Rollback por tabela: `alter table X disable row level security;`.
- Verificação de vazamento: script anônimo + script autenticado como colaborador tentando ler dados de terceiros (esperado: 0 linhas).

## Referências

- Migrações: `supabase/migrations/20260706130000..150100`
- Auditoria original: branch `security/owasp-hardening` (mergeada via PR #8)
