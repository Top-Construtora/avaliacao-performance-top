# Plano Técnico — Endomarketing e Acompanhamento de PDI via WhatsApp

> **OKR 02:** Desenvolver um sistema de endomarketing e acompanhamento de PDI via WPP — em conjunto com Gente e Gestão.
> **KR1:** Desenvolver a estrutura de comunicação para WhatsApp Business (fundação).
> **KR2:** Implementação das comunicações via automação de WPP.
>
> **Escopo do 1º entregável (decidido):** Endomarketing (campanhas) primeiro. A fundação (KR1) é compartilhada e serve tanto para campanhas quanto para PDI depois.

---

## 1. Recomendação de provedor

**Recomendação: Meta WhatsApp Cloud API (oficial, integração direta).**

| Critério              | Meta Cloud API (✅ recomendado)                             | BSP nacional (Zenvia/Gupshup)  | Twilio                   |
| --------------------- | ----------------------------------------------------------- | ------------------------------ | ------------------------ |
| Custo por conversa    | Menor (preço Meta direto, sem markup)                       | Meta + markup do BSP           | Meta + markup, em USD    |
| Onboarding            | Médio (verificar Business Manager)                          | Fácil (suporte PT)             | Fácil (SDK ótimo)        |
| Lock-in               | Nenhum                                                      | Alto (painel/templates do BSP) | Médio                    |
| Controle de templates | Total (via Graph API)                                       | Pelo painel do BSP             | Via API Twilio           |
| Adequação ao projeto  | Alta — stack já é Node/Express, chamamos a Graph API direto | Boa se quisermos painel pronto | Boa se já usassem Twilio |

**Por quê Meta direto:** o sistema já tem a espinha dorsal de mensageria (`notificationService` com resolução de destinatários, anti-spam e config por tipo). Não precisamos do "painel de campanhas" de um BSP — vamos construir o nosso, integrado ao RBAC e aos segmentos (time/depto) que já existem. Isso elimina o markup por mensagem e o lock-in. A Graph API é REST simples; encapsulamos num `whatsappProvider` de ~150 linhas.

**Custo estimado (Meta, faixa Brasil — modelo por conversa de 24h):**

- Conversa de **marketing** (endomarketing/campanha): ~US$ 0,05–0,07 cada.
- Conversa de **utilidade** (lembrete de PDI, prazo): ~US$ 0,01–0,02 cada.
- **Escala atual do projeto (~80 pessoas):** 80 × 2 campanhas/mês = 160 conversas ≈ **US$ 8–11/mês (~R$ 45–65)**. Lembretes de PDI (utilidade): ~US$ 1–2/mês. **Total realista: ~US$ 10–15/mês.**
- As primeiras ~1.000 conversas/mês de serviço iniciadas pelo usuário são gratuitas → nessa escala o custo tende ao piso.
- Referência de escala maior: 1.000 pessoas × 2 campanhas/mês ≈ US$ 100–140/mês.
- Preços mudam; validar na tabela oficial antes de fechar orçamento.

**Requisitos operacionais (fora do código, Gente & Gestão / TI):**

1. Conta no **Meta Business Manager** verificada.
2. Número de telefone dedicado (não pode ser um WhatsApp comum já ativo).
3. App no Meta for Developers → produto WhatsApp → obter `PHONE_NUMBER_ID`, `WABA_ID` e token permanente (System User).
4. Aprovação dos **templates HSM** (leva de horas a ~1 dia por template).

---

## 2. Arquitetura

Princípio: **WhatsApp é um segundo canal de entrega**, não um sistema novo. Reusamos o pipeline de notificação.

```
Gatilho (campanha agendada | evento de PDI | cron de prazo)
  → notificationService.send({ ..., channels: ['in_app','whatsapp'] })
      → in_app: INSERT em notifications (fluxo atual, intacto)
      → whatsapp: se opt-in + template válido → whatsappProvider.sendTemplate()
                    → Graph API (Meta) → registra em whatsapp_messages (status: queued)
Webhook Meta (status callback)
  → PATCH whatsapp_messages (sent → delivered → read | failed)
      → métricas de campanha (taxa de entrega/leitura) alimentam o progresso do KR
```

Regras herdadas do padrão atual:

- **Fire-and-forget:** falha de WhatsApp nunca quebra o fluxo principal (mesmo `try/catch` silencioso do `notificationService`).
- **Anti-spam** e resolução de destinatários (`user/role/team/department/all`) já existem — reusar.

---

## 3. Schema (migrações Supabase)

Seguindo a convenção `supabase/migrations/AAAAMMDDHHMMSS_descricao.sql`.

### 3.1 `..._whatsapp_opt_in.sql` — consentimento LGPD + telefone E.164

```sql
alter table users
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists whatsapp_opt_in_at timestamptz,
  add column if not exists phone_e164 text; -- normalizado +55DDDNXXXXXXXX
```

### 3.2 `..._whatsapp_templates.sql` — catálogo de templates HSM

```sql
create table whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,            -- nome aprovado na Meta (ex.: 'endomarketing_geral')
  category text not null,               -- 'MARKETING' | 'UTILITY'
  language text not null default 'pt_BR',
  body text not null,                   -- texto com {{1}}, {{2}} placeholders
  variables jsonb not null default '[]',-- descrição de cada variável
  meta_status text not null default 'pending', -- pending|approved|rejected
  active boolean not null default true,
  created_at timestamptz default now()
);
```

### 3.3 `..._whatsapp_campaigns.sql` — campanhas de endomarketing (MVP)

```sql
create table whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  template_id uuid not null references whatsapp_templates(id),
  segment jsonb not null,               -- RecipientTarget[] reusa o formato do notificationService
  variables jsonb not null default '{}',-- valores fixos das variáveis do template
  scheduled_at timestamptz,             -- null = enviar já
  status text not null default 'draft', -- draft|scheduled|sending|sent|failed|cancelled
  created_by uuid references users(id),
  stats jsonb not null default '{}',    -- {recipients, sent, delivered, read, failed}
  created_at timestamptz default now()
);
```

### 3.4 `..._whatsapp_messages.sql` — log de entrega (auditoria + métricas)

```sql
create table whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references whatsapp_campaigns(id) on delete set null,
  recipient_id uuid references users(id) on delete set null,
  template_name text,
  wa_message_id text,                   -- id retornado pela Meta (p/ casar webhook)
  status text not null default 'queued',-- queued|sent|delivered|read|failed
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on whatsapp_messages (wa_message_id);
create index on whatsapp_messages (campaign_id);
```

**RLS:** todas as tabelas acima são **backend-only** (`revoke ... from anon, authenticated`), no mesmo padrão do hardening já aplicado. O frontend fala só via API. Ver `docs/rls-rollout-plan.md` e memória de auditoria.

---

## 4. Backend — arquivos a criar/alterar

| Arquivo                                                | Ação    | Conteúdo                                                                                                                                                                                                       |
| ------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/lib/whatsapp/graphClient.ts`              | novo    | Wrapper da Graph API: `sendTemplate(toE164, templateName, lang, components)`. Lê `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` do env.                                                                          |
| `backend/src/services/whatsappProvider.ts`             | novo    | Camada de canal: valida opt-in, monta variáveis, chama `graphClient`, grava `whatsapp_messages`. Fire-and-forget.                                                                                              |
| `backend/src/services/notificationService.ts`          | alterar | Aceitar `channels?: ('in_app'\|'whatsapp')[]` no input; após o insert in-app, se incluir `whatsapp`, delega ao `whatsappProvider`. **Mudança aditiva, retrocompatível** (default = `['in_app']`).              |
| `backend/src/services/campaignService.ts`              | novo    | CRUD de campanhas + `dispatch(campaignId)`: resolve segmento (reusa `resolveRecipients`), envia em lote respeitando rate limit da Meta, atualiza `stats`.                                                      |
| `backend/src/controllers/campaignController.ts`        | novo    | Endpoints REST (abaixo).                                                                                                                                                                                       |
| `backend/src/controllers/whatsappWebhookController.ts` | novo    | `GET` (verificação do webhook Meta) + `POST` (status callbacks → atualiza `whatsapp_messages` e agrega em `campaign.stats`).                                                                                   |
| `backend/src/routes/campaignRoutes.ts`                 | novo    | Rotas de campanha (admin/diretor).                                                                                                                                                                             |
| `backend/src/routes/whatsappRoutes.ts`                 | novo    | Rota pública do webhook (sem auth, valida `X-Hub-Signature-256`).                                                                                                                                              |
| `backend/src/routes/index.ts`                          | alterar | Registrar `/campaigns` e `/webhooks/whatsapp`.                                                                                                                                                                 |
| `backend/src/validators/campaign.validator.ts`         | novo    | Zod schemas das mutações.                                                                                                                                                                                      |
| `backend/src/utils/phone.ts`                           | novo    | `toE164(brPhone)` — `(11) 98888-7777` → `+5511988887777`.                                                                                                                                                      |
| `backend/src/services/templateService.ts`              | novo    | **Gerência de templates pelo sistema** via Graph API: `create()` (`POST /{WABA_ID}/message_templates`), `list()`/`syncStatus()` (lê status de aprovação da Meta), `delete()`. Espelha em `whatsapp_templates`. |
| `backend/src/controllers/templateController.ts`        | novo    | Endpoints de CRUD de template (admin/G&G).                                                                                                                                                                     |

### Endpoints (todos sob auth admin/diretor, exceto webhook)

```
GET    /api/campaigns                 # listar
POST   /api/campaigns                 # criar (draft)
GET    /api/campaigns/:id             # detalhe + stats
PATCH  /api/campaigns/:id             # editar draft
POST   /api/campaigns/:id/schedule    # agendar (scheduled_at)
POST   /api/campaigns/:id/send        # disparar agora
POST   /api/campaigns/:id/cancel      # cancelar
GET    /api/campaigns/templates       # listar templates aprovados
GET    /api/templates                 # listar templates (com status Meta)
POST   /api/templates                 # criar + submeter à Meta (Graph API)
POST   /api/templates/sync            # sincronizar status de aprovação
DELETE /api/templates/:id             # remover
GET    /api/webhooks/whatsapp         # verificação Meta (challenge)
POST   /api/webhooks/whatsapp         # status callbacks
```

### Segurança do webhook

- Validar `hub.verify_token` no GET e assinatura `X-Hub-Signature-256` (HMAC do `APP_SECRET`) no POST — senão qualquer um forja status.
- Rate limit no endpoint público (reusar `middleware/rateLimit.ts`).

### Variáveis de ambiente novas (`backend/.env`)

```
WHATSAPP_TOKEN=            # System User token permanente
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WABA_ID=
WHATSAPP_APP_SECRET=       # p/ validar assinatura do webhook
WHATSAPP_VERIFY_TOKEN=     # string qualquer que casa com o painel Meta
```

---

## 5. Frontend — telas (MVP endomarketing)

| Arquivo                                                | Conteúdo                                                                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/pages/communications/Campaigns.tsx`      | Lista de campanhas + status + métricas (enviadas/entregues/lidas).                                                                                 |
| `frontend/src/pages/communications/CampaignForm.tsx`   | Criar/editar: escolher template, preencher variáveis, escolher segmento (time/depto/todos), agendar. Preview da mensagem.                          |
| `frontend/src/services/campaign.service.ts`            | Cliente HTTP dos endpoints acima.                                                                                                                  |
| `frontend/src/pages/communications/Templates.tsx`      | **Editor de templates dentro do sistema**: lista moldes com status de aprovação (pendente/aprovado/rejeitado da Meta), botão "sincronizar status". |
| `frontend/src/pages/communications/TemplateEditor.tsx` | Criar/editar molde: cabeçalho, corpo com variáveis `{{n}}`, rodapé, botões, categoria (MARKETING/UTILITY), preview ao vivo, e "Submeter à Meta".   |
| `frontend/src/services/template.service.ts`            | Cliente HTTP do CRUD de templates.                                                                                                                 |
| `frontend/src/pages/users/EditUser.tsx` (alterar)      | Toggle de opt-in de WhatsApp + exibir `phone_e164`.                                                                                                |
| `Sidebar.tsx` (alterar)                                | Item "Comunicação" (visível a admin/diretor).                                                                                                      |

Reusar os componentes de seleção de segmento que já existem nas telas de time/notificação.

---

## 6. KR2 — Automação (fase 2, após MVP de campanhas)

Com a fundação pronta, a automação é incremental:

1. **Campanhas agendadas:** cron varre `whatsapp_campaigns` com `status='scheduled'` e `scheduled_at <= now()` → `dispatch()`.
2. **PDI:** nos gatilhos que já existem (`pdi_created`, `pdi_updated`), adicionar `channels: ['in_app','whatsapp']`.
3. **Lembretes de prazo de PDI:** cron diário varre PDIs ativos, calcula proximidade do prazo (`curto/medio/longo`) e dispara `pdi_deadline_approaching` via WhatsApp (o tipo já existe; falta o job).
4. **Ciclo de avaliação — 4 avisos:**
   - **Ciclo aberto** (`evaluation_cycle_opened`) e **ciclo encerrado** (`evaluation_cycle_closed`) **já disparam** no `evaluationController` (linhas 79 e 116) — só adicionar `channels: ['in_app','whatsapp']` + templates `ciclo_aberto`/`ciclo_encerrado`.
   - **Fecha em 1 semana** e **fecha amanhã** são **novos**: exigem 2 tipos novos de notificação + cron diário que compara `end_date` do ciclo `open` com a data de hoje.

   ```ts
   // notification.types.ts — adicionar:
   | 'evaluation_cycle_closing_soon'      // 7 dias antes → template ciclo_fecha_1semana
   | 'evaluation_cycle_closing_tomorrow'  // 1 dia antes  → template ciclo_fecha_amanha
   ```

   Cron diário (`dispatch-scheduled.ts`): busca ciclos `status='open'`; se `end_date - hoje == 7` → dispara `closing_soon`; se `== 1` → `closing_tomorrow`. Anti-spam por `group_key` (ex.: `cycle:{id}:d7`) garante 1 envio por colaborador por marco.

5. **Scheduler:** no Render, usar **Cron Job** dedicado (`node dist/scripts/dispatch-scheduled.js`) — mais robusto que `setInterval` no web service (que dorme). Alternativa: `pg_cron` no Supabase chamando um endpoint interno.

---

## 6b. Fase 3 — Chatbot (colaborador responde de volta)

> **Decisão:** começar **determinístico** (menu/botões). IA (Claude) é evolução posterior, opcional.

A "porta de entrada" já existe: o webhook do PR 3 recebe eventos `messages` da Meta, não só `statuses`. Um chatbot determinístico é: ao chegar uma mensagem do colaborador, responder com um **menu de botões** e reagir ao que ele tocar, buscando dados nos services que já existem.

### Por que determinístico primeiro

- Previsível, sem alucinação, sem custo de IA.
- Fluxos fechados cobrem 90% do uso: _ver meu PDI_, _responder pesquisa_, _falar com G&G_.
- Valida o webhook de entrada e a segurança de identidade antes de qualquer IA.

### Novo schema — `..._whatsapp_conversations.sql`

```sql
create table whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  wa_phone text not null,               -- E.164 de quem escreveu
  state text not null default 'idle',   -- máquina de estados do fluxo (idle|menu|survey_q1|...)
  context jsonb not null default '{}',   -- dados do fluxo em andamento
  last_inbound_at timestamptz,          -- controla a janela de 24h
  updated_at timestamptz default now()
);
create index on whatsapp_conversations (wa_phone);
```

Backend-only (revoke anon/authenticated), como as demais.

### Fluxo (determinístico)

```
Colaborador escreve qualquer coisa → webhook recebe `messages`
  → resolve wa_phone → user (só se opt-in + telefone bate com um usuário ativo)
     → NÃO resolveu: resposta genérica "não reconheci seu número, fale com G&G"
     → resolveu: abre/atualiza whatsapp_conversations, responde MENU de botões:
          [Ver meu PDI]  [Responder pesquisa]  [Falar com G&G]
  → toque em [Ver meu PDI]  → pdiService.getPDI(user) → resume metas + prazos
  → toque em [Responder pesquisa] → guia pergunta a pergunta (state machine) e grava resposta
  → toque em [Falar com G&G] → registra pedido/encaminha
```

### Arquivos

| Arquivo                                         | Conteúdo                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `whatsappWebhookController.ts` (estender)       | Tratar evento `messages` além de `statuses`.                                        |
| `backend/src/services/chatbotService.ts` (novo) | Máquina de estados + montagem de menus/respostas. Lê dados via services existentes. |
| `graphClient.ts` (estender)                     | `sendInteractive()` (botões/listas) além de `sendTemplate()`.                       |

### ⚠️ Segurança de identidade (LGPD) — inegociável

- Só responde dado sensível se `wa_phone` casa com um usuário **com opt-in** e telefone verificado; senão, resposta genérica.
- Só revela dados **do próprio** colaborador — reusa `accessControl.ts` + RLS por-usuário já endurecidos na auditoria.
- Toda conversa fica logada para auditoria.

### Evolução para IA (Claude) — fase futura, opcional

Quando quiser linguagem natural, trocar o motor de resposta por Claude, passando **apenas o recorte daquele usuário** como contexto (nunca o banco todo), com o menu determinístico como fallback. A fundação (webhook de entrada, mapa telefone→usuário, tabela de conversas) não muda — só o "cérebro" da resposta.

---

## 7. Ordem de PRs (entregas pequenas e verificáveis)

| PR  | Título                                               | Entrega                                                                                                                                                     |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `feat: fundação de canal WhatsApp (schema + opt-in)` | Migrações 3.1–3.4 + `phone.ts` + toggle opt-in no EditUser. Nada envia ainda.                                                                               |
| 2   | `feat: provider WhatsApp + graphClient`              | `graphClient.ts` + `whatsappProvider.ts` + envio de teste manual (script). Valida integração ponta a ponta com 1 número.                                    |
| 3   | `feat: webhook de status WhatsApp`                   | `whatsappWebhookController` + rota + validação de assinatura. Status começa a atualizar.                                                                    |
| 4   | `feat: gestão de templates pelo sistema (Graph API)` | `templateService` + `templateController` + telas `Templates.tsx`/`TemplateEditor.tsx`. Cria e submete os 10 templates iniciais à Meta pelo próprio sistema. |
| 5   | `feat: campanhas de endomarketing (backend)`         | `campaignService` + `campaignController` + rotas + validators. **← KR1 fecha aqui.**                                                                        |
| 6   | `feat: telas de campanha (frontend)`                 | `Campaigns.tsx` + `CampaignForm.tsx` + service. **← 1º entregável de endomarketing.**                                                                       |
| 7   | `feat: agendamento + cron de campanhas`              | Cron job no Render. **← início do KR2.**                                                                                                                    |
| 8   | `feat: automação de PDI via WhatsApp`                | Gatilhos de PDI + cron de prazos.                                                                                                                           |
| 9   | `feat: avisos de ciclo de avaliação via WhatsApp`    | Canal WhatsApp em ciclo aberto/encerrado + 2 tipos novos (fecha em 1 semana / amanhã) + cron. **← KR2 fecha.**                                              |
| 10  | `feat: webhook de entrada + mapa telefone→usuário`   | Estende webhook p/ `messages` + `whatsapp_conversations` + resolução segura de identidade.                                                                  |
| 11  | `feat: chatbot determinístico (menu/botões)`         | `chatbotService` + `sendInteractive` + fluxos "ver PDI / responder pesquisa / falar com G&G". **← Fase 3.**                                                 |

---

## 8. Estimativa

| Fase                                 | PRs   | Esforço dev | Bloqueios externos                                                       |
| ------------------------------------ | ----- | ----------- | ------------------------------------------------------------------------ |
| Fundação + gestão de templates (KR1) | 1–5   | ~4–5 dias   | Conta Meta verificada; templates são criados pelo próprio sistema (PR 4) |
| MVP endomarketing                    | 6     | ~1–2 dias   | —                                                                        |
| Automação: PDI + ciclos (KR2)        | 7–9   | ~3–4 dias   | Cron no Render                                                           |
| Chatbot determinístico (Fase 3)      | 10–11 | ~2–3 dias   | —                                                                        |

**Caminho crítico externo:** verificação do Business Manager + aprovação de templates pela Meta. Iniciar **já**, em paralelo ao PR 1, porque não depende de código e é o que costuma travar o cronograma.

---

## 9. Riscos e cuidados

- **LGPD:** só enviar com `whatsapp_opt_in = true`. Registrar data do consentimento. Todo template de marketing precisa de opção de descadastro. Sem opt-in, `whatsappProvider` pula silenciosamente.
- **Janela de 24h:** mensagens iniciadas pela empresa **exigem template aprovado**. Não dá para mandar texto livre. Isso é regra da Meta, não limitação nossa.
- **Qualidade do número:** muita gente marcando "bloquear/spam" derruba a _quality rating_ e limita o volume diário. Segmentar bem e não abusar de frequência.
- **Rate limits da Meta:** enviar campanhas em lote com throttle (o `dispatch()` controla isso). Tier inicial costuma ser 1.000 destinatários/dia, sobe com o histórico.
- **Retrocompatibilidade:** a mudança no `notificationService` é aditiva (`channels` default `['in_app']`) — nenhum gatilho atual muda de comportamento.
- **Idempotência do webhook:** a Meta reenvia callbacks; casar por `wa_message_id` e atualizar só se o novo status for "mais avançado".

---

## 10. Textos dos templates (gerenciados pelo próprio sistema)

> **Decisão:** os templates são **criados, submetidos e monitorados pelo próprio sistema** via Graph API (`POST /{WABA_ID}/message_templates`), não pelo painel da Meta. Inclusive os iniciais abaixo. Isso dá à G&G autonomia para criar/editar moldes sem acessar a Meta. O painel da Meta é usado **só** para o setup de conta (verificação + número + credenciais).
>
> **Como funciona a aprovação:** a Meta aprova o **molde** (estrutura + variáveis) **uma vez**. No envio, as variáveis `{{n}}` são preenchidas **livremente, sem nova aprovação**. Por isso o `comunicado_geral` cobre até anúncios urgentes: aprova-se o molde uma vez e manda-se qualquer texto pelas variáveis. Só formatos **novos** exigem nova aprovação (minutos a ~1 dia). Texto **100% livre** só dentro da janela de 24h (respostas do chatbot).
>
> Idioma de todos: **pt_BR**. Ao submeter, cada `{{n}}` exige um **valor de exemplo**. A Meta rejeita corpo que seja quase só variável — por isso há texto fixo em volta.

### 1. `comunicado_geral` — categoria **MARKETING** (cobre endomarketing + urgências)

```
Cabeçalho (texto): 📢 Comunicado — Top Construtora
Corpo:
Olá {{1}}!

*{{2}}*

{{3}}

— Equipe Gente & Gestão
Rodapé: Você recebe por ter aceitado comunicações no WhatsApp.
Botão (opcional): [Abrir no sistema] → URL {{4}}
```

Variáveis: `{{1}}`=primeiro nome · `{{2}}`=título do comunicado · `{{3}}`=corpo da mensagem · `{{4}}`=link (se houver).
Exemplos p/ submissão: `Maria` · `Nova política de home office` · `A partir de 01/08 o modelo passa a ser híbrido...` · `topconstrutora.app/avisos`.

### 2. `pesquisa_disponivel` — categoria **UTILITY**

```
Corpo:
Olá {{1}}! A pesquisa *{{2}}* já está disponível e leva poucos minutos. Sua opinião é muito importante para a gente. 💬
Botão (URL): [Responder pesquisa] → {{3}}
```

Variáveis: `{{1}}`=nome · `{{2}}`=título da pesquisa · `{{3}}`=link com token do respondente.
Exemplos: `João` · `Clima Organizacional 2026` · `topconstrutora.app/s/AB12`.

### 3. `pdi_registrado` — categoria **UTILITY**

```
Corpo:
Olá {{1}}! Seu Plano de Desenvolvimento Individual (PDI) do ciclo *{{2}}* foi registrado pelo seu líder. Você tem *{{3}}* meta(s) para acompanhar.
Botão (URL): [Ver meu PDI] → {{4}}
```

Variáveis: `{{1}}`=nome · `{{2}}`=ciclo · `{{3}}`=nº de metas · `{{4}}`=link do PDI.
Exemplos: `Ana` · `Q3 2026` · `3` · `topconstrutora.app/pdi`.

### 4. `pdi_lembrete_prazo` — categoria **UTILITY**

```
Corpo:
Olá {{1}}! Sua meta de PDI *{{2}}* está próxima do prazo: *{{3}}*. Como está o andamento? Se precisar de apoio, fale com seu líder.
Botão (URL): [Atualizar PDI] → {{4}}
```

Variáveis: `{{1}}`=nome · `{{2}}`=competência/meta · `{{3}}`=data do prazo · `{{4}}`=link do PDI.
Exemplos: `Pedro` · `Liderança de time` · `30/09/2026` · `topconstrutora.app/pdi`.

### 5. `confirmacao_opt_in` — categoria **UTILITY** (usado 1x, se optar por confirmar consentimento pelo WhatsApp)

```
Corpo:
Olá {{1}}! A Top Construtora quer enviar comunicados e lembretes de PDI por aqui. Você aceita receber essas mensagens?
Botões (resposta rápida): [Sim, aceito]  [Não, obrigado]
```

Variáveis: `{{1}}`=nome. Exemplo: `Carla`.

> Observação: mesmo esse envio inicial exige uma base mínima de opt-in (ex.: aceite coletado no sistema). O caminho mais seguro é coletar o opt-in **dentro do sistema** (ver §11) e usar este template só para reconfirmar.

### 6. `ciclo_aberto` — categoria **UTILITY** (ciclo de avaliação iniciado)

```
Corpo:
Olá {{1}}! O ciclo de avaliação *{{2}}* começou. O período vai até *{{3}}*. Já pode registrar sua autoavaliação. 📝
Botão (URL): [Iniciar avaliação] → {{4}}
```

Variáveis: `{{1}}`=nome · `{{2}}`=título do ciclo · `{{3}}`=data de término · `{{4}}`=link.
Exemplos: `Bruno` · `Avaliação Q3 2026` · `30/09/2026` · `topconstrutora.app/avaliacao`.

### 7. `ciclo_fecha_1semana` — categoria **UTILITY** (falta 1 semana)

```
Corpo:
Olá {{1}}! O ciclo *{{2}}* encerra em *1 semana* ({{3}}). Se ainda não concluiu sua avaliação, aproveite para finalizar. ⏳
Botão (URL): [Concluir avaliação] → {{4}}
```

Variáveis: `{{1}}`=nome · `{{2}}`=título · `{{3}}`=data de término · `{{4}}`=link.
Exemplos: `Bruno` · `Avaliação Q3 2026` · `30/09/2026` · `topconstrutora.app/avaliacao`.

### 8. `ciclo_fecha_amanha` — categoria **UTILITY** (falta 1 dia)

```
Corpo:
Olá {{1}}! *Último dia amanhã* ({{3}}) para concluir sua avaliação do ciclo *{{2}}*. Não deixe para depois! ⚠️
Botão (URL): [Concluir agora] → {{4}}
```

Variáveis: `{{1}}`=nome · `{{2}}`=título · `{{3}}`=data de término · `{{4}}`=link.
Exemplos: `Bruno` · `Avaliação Q3 2026` · `30/09/2026` · `topconstrutora.app/avaliacao`.

### 9. `ciclo_encerrado` — categoria **UTILITY** (ciclo encerrado)

```
Corpo:
Olá {{1}}! O ciclo de avaliação *{{2}}* foi encerrado. Obrigado pela participação! Em breve os resultados e o feedback estarão disponíveis. ✅
Botão (URL): [Ver no sistema] → {{3}}
```

Variáveis: `{{1}}`=nome · `{{2}}`=título · `{{3}}`=link.
Exemplos: `Bruno` · `Avaliação Q3 2026` · `topconstrutora.app/avaliacao`.

### 10. `codigo_verificacao` — categoria **AUTHENTICATION** (validar posse do telefone)

```
Corpo:
{{1}} é o seu código de verificação da Top Construtora. Válido por 10 minutos.
Botão (copiar código): [Copiar código]
```

Variáveis: `{{1}}`=código de 6 dígitos. Exemplo: `394512`.

> Categoria AUTHENTICATION é a própria Meta que trata (formato de OTP). Disparado quando o colaborador pede a verificação **dentro do sistema** — o pedido é o ato de consentimento.

**Notas de conformidade dos templates:**

- Templates de **MARKETING** devem deixar claro o motivo do recebimento (rodapé) — feito no `comunicado_geral`.
- Links nos botões URL são melhores que links no corpo (menos chance de spam-flag).
- Não usar `{{n}}` como corpo inteiro — sempre com texto fixo em volta (regra da Meta).

---

## 11. Pré-requisitos e decisões (destravar antes/junto do código)

### 11.1 Confirmação e validação do telefone pelo colaborador (opt-in + posse) — DECIDIDO

O colaborador confirma e **valida o próprio telefone dentro do sistema**. Isso entrega, de uma vez: **consentimento LGPD** (com data) + **prova de posse** do número (antes de qualquer mensagem de PDI/dado sensível).

**Fluxo (in-app):**

```
Próximo login → modal "Ative os avisos por WhatsApp"
  1. Mostra/edita o telefone (normalizado p/ E.164)
  2. Checkbox: "Aceito receber comunicados, avisos de ciclo e lembretes de PDI por WhatsApp"
  3. [Enviar código] → sistema dispara template AUTHENTICATION `codigo_verificacao`
  4. Colaborador digita o código de 6 dígitos recebido no WhatsApp
  5. Confere → phone_verified=true, whatsapp_opt_in=true, whatsapp_opt_in_at=now()
```

- Sem verificação, o colaborador **não recebe** mensagens business-initiated (o `whatsappProvider` só envia se `whatsapp_opt_in=true AND phone_verified=true`).
- Pode ser adiado ("agora não"), mas o banner reaparece até concluir.
- **Opt-out** a qualquer momento em `Configurações` (LGPD).

**Schema — estender a migração 3.1:**

```sql
alter table users
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz;

create table whatsapp_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  code_hash text not null,              -- hash do código, nunca em claro
  expires_at timestamptz not null,      -- +10 min
  attempts int not null default 0,      -- trava após N tentativas
  consumed_at timestamptz,
  created_at timestamptz default now()
);
```

**Endpoints:**

```
POST /api/whatsapp/verify/start     # gera código, envia via WhatsApp (rate-limited)
POST /api/whatsapp/verify/confirm   # valida código → marca verified + opt-in
POST /api/whatsapp/opt-out          # revoga consentimento
```

**Frontend:** `frontend/src/components/WhatsAppOptInModal.tsx` (modal de confirmação) + seção em `Settings.tsx` (opt-out / re-verificar). Landa no **PR 1** (UI + schema) e ganha o envio real do código quando o provider existir (**PR 2**).

### 11.2 Telefones existentes → pré-normalizar (a maioria já tem)

A maioria dos colaboradores **já tem telefone cadastrado**. Isso encurta o onboarding:

- **Script de backfill** na migração 3.1: normaliza todos os `phone` existentes para `phone_e164`. Os inválidos/ambíguos ficam marcados para revisão.
- O modal 11.1 aparece com o número **pré-preenchido** → confirmação em 1 toque (o colaborador só confere e pede o código). Quem trocou de número corrige ali.
- Só quem **nunca loga** precisa de preenchimento manual pela G&G (minoria).

> ⚠️ Ter o telefone no cadastro **não** equivale a consentimento (foi coletado para ficha de RH) nem a prova de posse (pode estar desatualizado). Por isso a confirmação de 11.1 continua necessária **antes de mensagens com dado sensível**.

### 11.2b Consentimento em camadas (decisão de G&G + jurídico)

Opção de tratar exigências diferentes por tipo de mensagem:

| Tipo de mensagem                                                      | Exigência                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Dado sensível** (PDI, resultado de avaliação, salário)              | opt-in **+ `phone_verified`** (código) — inegociável                     |
| **Comunicado geral / endomarketing** (ciclo abrindo, evento, cultura) | pode bastar **opt-in simples** (aceite no sistema + opt-out), sem código |

Isso agiliza comunicados amplos, reservando a verificação por código para o que é sensível. **Definição jurídica/RH — não técnica.** O `whatsappProvider` aplica a regra que a G&G escolher (flag por template/categoria).

### 11.3 Métrica do KR (0% → progresso)

Definir com a G&G qual número representa o avanço do OKR. Sugestões (todas já mensuráveis pelas tabelas do plano):

- **KR1:** % de colaboradores com telefone verificado + opt-in (`phone_verified=true`).
- **KR2:** nº de campanhas/automações enviadas + **taxa de leitura** (via `whatsapp_messages.status='read'`).
  Um endpoint `GET /api/whatsapp/metrics` alimenta um card no painel.

### 11.4 Fronteira painel Meta × sistema (resumo)

- **Só no painel Meta (1x):** verificar Business Manager + cadastrar número + gerar credenciais.
- **No sistema (via API):** criar/gerenciar templates (§10), enviar, campanhas, automação, chatbot, métricas, opt-in/verificação.
