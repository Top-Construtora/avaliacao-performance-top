# 0004 — Topologia de deploy e ambientes

- **Status:** Aceito
- **Data:** 2026-06-22
- **Contexto:** sistema interno (Vercel + Render + Supabase), rumo a vários portais

## Contexto

O trio Vercel + Render + Supabase funciona, mas faltava: borda (SSL/WAF/CDN),
domínio próprio, backups testados, separação de ambientes e visibilidade de
erro. Para um sistema com dado sensível de RH, confiabilidade e recuperação
importam mais que escala. O detalhe da arquitetura está no runbook
(`docs/deployment.md`); aqui ficam as decisões.

## Decisão

1. **Cloudflare na frente de tudo** (`app.*` → Vercel, `api.*` → Render): SSL
   strict, WAF, CDN, proteção DDoS e domínio próprio. Ganho grande, custo ~zero.

2. **Backups antes de performance.** Supabase **Pro + PITR** na produção, com
   restore **testado**. É o item de maior prioridade do deploy.

3. **Três ambientes isolados** (dev / staging / prod), cada um com seu projeto
   Supabase e seu conjunto de envs. Migrações sobem no staging primeiro
   (`db push`), depois prod. `backend/.env.example` é a fonte de verdade.

4. **Observabilidade ligada por env, não por deploy.** `SENTRY_DSN` no ambiente
   ativa o Sentry (código pronto na Sprint 4). Logs JSON do Pino vão para o
   Better Stack; uptime monitora `GET /health`.

5. **Sem complexidade prematura.** Nada de Kubernetes, microserviços, Redis ou
   filas até existir um problema concreto que os justifique. O foco é o
   "golden path" confiável, não sofisticação.

## Consequências

- **+** Borda profissional, domínio próprio e recuperação de desastre reais.
- **+** Staging permite validar schema e código antes da prod.
- **+** Ligar Sentry/observabilidade é configuração de ambiente.
- **−** Custo incremental do Supabase Pro e do plano do Render (consciente).
- **−** As ações são manuais nos dashboards (não automatizáveis pelo repo);
  o runbook existe para torná-las repetíveis.
