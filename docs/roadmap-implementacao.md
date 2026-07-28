# Roadmap de implementação — GIO

Plano de evolução do sistema em 6 fases, na ordem de execução acordada: notificações externas e auditoria primeiro, IA por último. Cada fase é entregável de forma independente (migração + backend + frontend + CI verde) e as fases seguintes se apoiam nas anteriores.

Convenções que valem para todas as fases: migrações versionadas em `supabase/migrations/` (ADR 0002), contrato de erro `/api/v1` (ADR 0001), validação com Zod, `authorizeRoles` + `assertCanAccessEmployeeData` no backend, RLS revogado para `anon`/`authenticated` nas tabelas novas (acesso só via backend, alinhado ao plano de rollout de RLS), UI mobile-first em pt-BR seguindo o padrão de páginas existente.

---

## Fase 1 — Notificações externas (e-mail + agendador) · ~1,5 semana

Hoje o sistema só notifica in-app (23 tipos, Realtime, anti-spam). Falta canal externo e disparos por tempo. Esta fase destrava lembretes para todos os módulos atuais e futuros.

### 1.1 Serviço de e-mail

- `backend/src/services/emailService.ts` com **nodemailer + SMTP** — as variáveis `EMAIL_HOST/PORT/USER/PASS/FROM/REPLY_TO` já estão documentadas no README; funciona com Gmail hoje e troca para um provedor transacional (Resend/Postmark/SES em SMTP) sem mudar código.
- Templates HTML em `backend/src/emails/`: um layout base (logo GIO, cores, footer) + template por categoria (avaliação, PDI, pesquisa, entrevista, genérico). Texto sempre próprio, pt-BR.
- Envio assíncrono fire-and-forget com 1 retry e log estruturado (pino) de sucesso/falha; nunca bloquear a resposta HTTP por causa de e-mail.
- Flag `EMAIL_ENABLED` para desligar em dev/staging sem tirar as envs.

### 1.2 Integração com o notificationService

- O `notificationService` ganha um mapa `tipo de notificação → canal` (in-app sempre; e-mail para os tipos relevantes: ciclo aberto, avaliação pendente, consenso, PDI criado/prazo, pesquisa disponível/prazo, entrevista agendada, relatório liberado).
- Tabela `notification_preferences` (user_id, categoria, email_enabled) + aba "Notificações" em `/settings` para o usuário desligar e-mails por categoria. Default: ligado.
- Respeitar o anti-spam existente (aggregate/cooldown) também para e-mail.

### 1.3 Agendador de lembretes

- O backend roda como processo persistente no Render → **node-cron in-process** em `backend/src/jobs/` (sem infra nova). Guard `ENABLE_JOBS=true` para rodar em só uma instância; se um dia o backend escalar horizontalmente, migrar o disparo para Supabase `pg_cron` chamando um endpoint interno autenticado.
- Jobs diários (idempotentes — usam o group_key/cooldown do anti-spam para nunca duplicar):
  - **Ciclo de avaliação**: lembrete a 3 e 1 dia(s) do fim, só para quem não concluiu (consulta o dashboard do ciclo).
  - **PDI**: disparar o tipo `pdi_deadline_approaching` (já existe declarado, nunca foi acionado).
  - **Pesquisas**: lembrete de prazo para quem não respondeu; aviso de encerramento para diretores.
  - **Entrevistas**: lembrete na véspera para entrevistador e colaborador.
- **Encerramento automático por data** (opcional, mesma infraestrutura): ciclo e pesquisa passam de `open/active` → `closed` quando `end_date` vence, com notificação. Manter encerramento manual.

Critério de pronto: e-mail chega nos fluxos principais, preferências funcionam, jobs rodam 1x/dia sem duplicar, tudo logado.

---

## Fase 2 — Auditoria · ~1 semana

A tabela `audit_logs` existe no schema e nas permissões, mas nada grava nem lê. Fase fecha esse esqueleto — importante também para LGPD/compliance (o sistema guarda salário e avaliação).

### 2.1 Esquema definitivo

- Migração ajustando `audit_logs`: `id`, `actor_id`, `actor_email`, `action` (ex.: `user.role_changed`, `salary.progression`, `cycle.closed`), `entity_type`, `entity_id`, `changes` (JSONB before/after só dos campos alterados), `request_id`, `ip`, `user_agent`, `created_at`. Índices em `(entity_type, entity_id, created_at)` e `(actor_id, created_at)`. RLS: acesso zero para `anon`/`authenticated` (já revogado na fase 3a do plano de RLS) — leitura só via backend.

### 2.2 Gravação

- `backend/src/services/auditService.ts` com `audit(req, action, entity, changes)` — pega ator, requestId (middleware já existe), IP e user-agent do request. Gravação assíncrona, nunca falha a operação principal.
- Instrumentar as mutações críticas nos controllers: usuários (criar/editar/papéis/reset de senha/inativar), salário e progressão, ciclos (abrir/fechar), consenso e promoção de Nine Box, PDI, contratação de candidato, modelos de entrevista, exclusões em geral.
- **Cobertura das escritas que ainda vão direto do frontend ao Supabase** (self/leader/consensus evaluations, até o refactor previsto no plano de RLS): triggers Postgres de INSERT/UPDATE nessas 3 tabelas gravando em `audit_logs` com `actor_id = auth.uid()`. Remover os triggers quando o refactor mover essas escritas para o backend.

### 2.3 Consulta e retenção

- `GET /api/v1/audit` (admin; director com escopo restrito) com filtros por ator, entidade, ação e período + paginação.
- Página `/audit` (admin/director) com tabela filtrável e exportação XLSX (reusar o padrão de `exportSafety.ts`).
- Job mensal (scheduler da fase 1) de expurgo além de 24 meses.

Critério de pronto: toda mutação crítica gera registro consultável; nenhuma operação quebra se a auditoria falhar.

---

## Fase 3 — Feedback contínuo · ~2 semanas

Módulo novo. Complementa o ciclo formal de avaliação com reconhecimento e orientação no dia a dia; os dados alimentam o futuro Perfil do Colaborador e a fase de IA.

### 3.1 Dados

- `feedback_types`: nome, ícone, cor, ativo, `restricted_to_admin` (ex.: Advertência só para RH/diretoria). Seed inicial: Positivo, Reconhecimento, Desenvolvimento, Orientação, Advertência — todos renomeáveis.
- `feedbacks`: autor, destinatário, tipo, texto, competências vinculadas (reusar `organizational_competencies` + eventualmente as fixas), `internal_note` (visível só a admin/director), `read_at`, `acknowledged_at` (aceite/ciência), `recipient_comment`, created_at.
- `feedback_requests`: solicitante, solicitado, mensagem, status (pendente/atendida/recusada), feedback_id resultante.

### 3.2 Regras e API

- Envio aberto entre qualquer par de colaboradores; tipos restritos exigem director/admin. Configuração futura (restringir a líder↔liderado) fica prevista num campo de config, não implementada agora.
- CRUD via `/api/v1/feedbacks` + `/feedback-requests` + admin de tipos. Autor pode editar/excluir só enquanto não lido.
- Notificações (infra da fase 1): recebido (in-app + e-mail), solicitação recebida, aceite confirmado.
- Auditoria (fase 2) nos tipos restritos e exclusões.

### 3.3 UI

- `/feedbacks` com abas **Recebidos / Enviados / Solicitações**; modal de envio (destinatário, tipo, competências, texto); confirmação de leitura/ciência pelo destinatário com comentário opcional.
- Visão admin: filtros (tipo, colaborador, gestor, área, período), observações internas, exportação XLSX.
- Contadores de feedback no dashboard do colaborador e do líder.
- Fora do escopo inicial (backlog): mural público, compartilhamento externo, editor rico com anexos.

---

## Fase 4 — Reuniões 1:1 · ~1,5 semana

Módulo novo, menor que o de feedback. Estrutura as conversas líder↔liderado e conecta com PDI e devolutivas.

### 4.1 Dados

- `meeting_types` (admin define: 1:1, alinhamento, devolutiva…), `meetings` (organizador, tipo, data/hora, duração, local ou link de vídeo, status agendada/realizada/cancelada, recorrência), `meeting_participants`, `meeting_topics` (pauta, ordem, coberto?), `meeting_notes` (autor, texto, `is_private`), `meeting_tasks` (descrição, responsável, prazo, done).
- Recorrência simples: campo `recurrence` (`none|weekly|biweekly|monthly`) + job (fase 1) que materializa a próxima ocorrência quando a atual é concluída/passa.

### 4.2 Regras e API

- Colaborador vê reuniões das quais participa; líder agenda com liderados; admin vê tudo. Notas privadas visíveis só ao autor.
- `/api/v1/meetings` + subrotas de topics/notes/tasks; notificações de agendamento/cancelamento + lembrete de véspera (job).

### 4.3 UI

- `/meetings` com abas **Com meus liderados / Com minha liderança / Outras**; próximas × anteriores; card expandido com pauta, anotações e tarefas; criação com recorrência.
- Integração leve: atalho "agendar 1:1" na página do liderado (Minha Equipe) e tarefas da reunião aparecendo no dashboard do responsável.

---

## Fase 5 — Learning (cursos e trilhas) · ~3-4 semanas (o maior)

Módulo novo de T&D. Entregar em dois cortes para não travar: 5A cursos/turmas/inscrições; 5B trilhas, catálogo com autoinscrição e extras.

### 5A — Núcleo

- Dados: `courses` (título, descrição, categoria, carga horária, capa, ativo), `course_sections`, `course_contents` (tipo: vídeo por URL, PDF/arquivo via **Supabase Storage** com bucket dedicado e limite de tamanho, link externo; ordem; obrigatório?), `course_classes` (turma: datas, prazo, permitir conclusão após prazo), `enrollments` (colaborador, turma, obrigatório/opcional, status, progresso %, concluído_em), `content_progress` (conteúdo × inscrito, concluído_em).
- Regras: progresso = conteúdos obrigatórios concluídos / total; conclusão da turma ao atingir 100% dentro do prazo; inscrição pelo admin com filtros (área, cargo, gestor) ou individual.
- UI: admin (CRUD curso/turma, inscrição em massa, acompanhamento com status por colaborador e exportação); colaborador ("Meus cursos" com player/visualizador de conteúdo e barra de progresso).
- Notificações: inscrito em turma, prazo se aproximando (job), turma encerrada.

### 5B — Extensões

- **Trilhas**: `tracks_learning` + `track_courses` (sequência, liberação progressiva: curso N+1 abre ao concluir N).
- **Catálogo + autoinscrição**: cursos marcados como públicos, com categorias; colaborador se inscreve sozinho (flag por turma).
- **Cursos externos**: registro pelo colaborador com anexo de certificado (Storage) e aprovação do RH.
- **Vínculo com PDI**: ação de PDI pode referenciar um curso; concluir o curso sugere atualizar o status da ação.
- **Avaliação de curso**: reusar o módulo de pesquisas — pesquisa vinculada à turma, disparada ao concluir 100% (job). É também o primeiro caso de segmentação de público em pesquisas.

---

## Fase 6 — IA · ~2 semanas (por último, depende das fases 3-5 para ter dados)

Assistência de IA embutida nos módulos, via **API da Anthropic** com o SDK TypeScript (`@anthropic-ai/sdk`) no backend Express — a chave nunca vai ao frontend.

### 6.1 Infraestrutura

- `backend/src/services/aiService.ts`: cliente Anthropic, modelo **`claude-opus-5`** (adaptive thinking por padrão; `effort` ajustado por caso de uso — `low/medium` para reescrita de texto, `high` para análises), streaming para respostas longas via SSE ao frontend, tratamento de erros com as classes tipadas do SDK e rate limit por usuário.
- Prompt caching nas análises que reusam contexto grande (ex.: mesmo ciclo analisado várias vezes) e saídas estruturadas (`output_config.format`) quando o retorno alimenta a UI (ex.: sugestões de PDI em JSON).
- Config: `ANTHROPIC_API_KEY` no Render, flag `AI_ENABLED`, e toggle por funcionalidade para o admin.
- LGPD: enviar o mínimo de dados pessoais (pseudonimizar nome quando possível), registrar uso em `audit_logs`, e documentar o subprocessador.

### 6.2 Funcionalidades (ordem de entrega)

1. **Escrita assistida de feedback** (fase 3 pronta): melhorar/expandir/encurtar o texto antes de enviar — endpoint simples, alto valor, baixo risco.
2. **Sugestões de ação de PDI**: dado competência + contexto do colaborador, sugerir 3-5 ações estruturadas que o líder pode aceitar/editar.
3. **Resumo para devolutiva**: gerar pauta de devolutiva a partir de autoavaliação × avaliação do líder × consenso (visível só ao líder/RH).
4. **Insights para o RH**: análise agregada de um ciclo ou pesquisa (pontos fortes, gaps por área, sugestões) na página de Relatórios, com perguntas livres.

---

## Dependências e sequência

```
Fase 1 (notificações) ──► usada por TODAS as seguintes (lembretes, e-mails)
Fase 2 (auditoria)   ──► instrumenta módulos novos desde o nascimento
Fase 3 (feedback)    ──► dados para IA (6.1) e Perfil do Colaborador (futuro)
Fase 4 (1:1)         ──► independente; usa jobs da fase 1
Fase 5 (learning)    ──► 5B usa pesquisas; vínculo com PDI
Fase 6 (IA)          ──► precisa de 3 (feedback) e se beneficia de tudo
```

Estimativa total: **~10 a 12 semanas** de trabalho sequencial. Fases 3 e 4 podem ser paralelizadas se houver mais de uma pessoa.

## Fora do escopo deste plano (backlog consciente)

Avaliação por pares/360°, formulário de avaliação configurável com pesos reais, devolutiva formal, relatório individual do avaliado, segmentação/eNPS nas pesquisas, importação por planilha, multi-idioma — mapeados no comparativo (`docs/referencia-impulseup/comparativo.md`), a priorizar depois.
