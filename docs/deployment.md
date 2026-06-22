# Runbook de Deploy

Topologia-alvo (custo baixo, confiabilidade alta) para sistemas internos:

```
            Cloudflare (DNS · SSL · WAF · cache · DDoS)
              │                         │
   app.sistema.com.br           api.sistema.com.br
              │                         │
          Vercel                     Render
        (frontend)                  (backend)
              │                         │
              └──────── Supabase ───────┘
                     (Postgres · Auth)
                          │
                  Sentry  +  Better Stack
                (erros)     (logs/uptime)
```

As ações abaixo são feitas nos **dashboards** (precisam das suas credenciais).
O código já está pronto: o backend lê `SENTRY_DSN`/`LOG_LEVEL`/`FRONTEND_URL` do
ambiente (ver `backend/.env.example`).

---

## 1. Cloudflare + domínio próprio

- [ ] Adicionar o domínio no Cloudflare; apontar os nameservers no registrador.
- [ ] DNS: `app` → Vercel (CNAME), `api` → Render (CNAME). Proxy (nuvem laranja) **ligado**.
- [ ] SSL/TLS em **Full (strict)**. "Always Use HTTPS" ligado.
- [ ] Vercel/Render: registrar o domínio custom em cada um (validação de certificado).
- [ ] WAF: ligar as managed rules. Cache só do estático do Vercel (não cachear `/api`).
- [ ] Atualizar `FRONTEND_URL` no backend e a allowlist de CORS para o domínio novo.

## 2. Backups do banco — PRIORIDADE (dado de RH)

- [ ] Supabase **Pro** no projeto de produção → habilita **PITR** (point-in-time recovery).
- [ ] Confirmar a janela de retenção e **testar um restore** num projeto descartável.
- [ ] Anotar o procedimento de restore aqui depois do primeiro teste.

> Perder o banco (salário, avaliação, histórico) é pior que qualquer lentidão.
> Este item vem antes de qualquer otimização.

## 3. Observabilidade (código já pronto — Sprint 4)

- [ ] Criar projeto no **Sentry**, copiar o DSN.
- [ ] Definir `SENTRY_DSN` (e opcional `SENTRY_RELEASE` = git sha) no Render.
      Sem isso, o Sentry fica desligado por design.
- [ ] **Better Stack**: apontar para os logs JSON do Render (Pino já emite JSON em prod)
      e criar um monitor de **uptime** em `GET /health`.
- [ ] Configurar alerta (e-mail/Telegram/Discord) no Sentry e no Better Stack.

## 4. Ambiente de staging

- [ ] Projeto **Supabase separado** para staging (nunca apontar staging para o banco de prod).
- [ ] Render/Vercel: ambiente de staging com seu próprio conjunto de envs
      (`NODE_ENV`, `SUPABASE_*`, `FRONTEND_URL`, `SENTRY_DSN` próprio).
- [ ] Aplicar migrações no staging primeiro: `supabase link` no projeto de staging + `npm run db:push`. Só depois promover para prod.
- [ ] Subdomínio `staging.app.*` / `staging.api.*` no Cloudflare (opcional).

## 5. CI/CD (já em pé — Sprint 2)

- GitHub Actions roda `lint · typecheck · build` em todo PR (backend bloqueante).
- Deploy continua pelo git-integration do Vercel/Render (push na branch de release).
- [ ] Quando a dívida de WIP do frontend zerar, remover os `continue-on-error`
      do job `frontend` em `.github/workflows/ci.yml` (vira gate de verdade).

---

## Convenção de ambientes

| Ambiente | Frontend       | Backend        | Banco                           |
| -------- | -------------- | -------------- | ------------------------------- |
| dev      | localhost:5173 | localhost:3001 | Supabase dev/local (`db reset`) |
| staging  | staging.app.\* | staging.api.\* | projeto Supabase de staging     |
| prod     | app.\*         | api.\*         | projeto Supabase de prod (PITR) |

Fonte de verdade das variáveis: `backend/.env.example`. Todo ambiente novo começa
copiando dele.
