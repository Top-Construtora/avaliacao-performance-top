-- Indicação de curso na ação do PDI: além do curso do catálogo (course_id, que
-- já existe), o líder pode apontar um link externo.
--
-- Por que os dois caminhos: o curso do catálogo dá acompanhamento real
-- (progresso por conteúdo e conclusão automática da ação, via
-- pdiActionsService.completeActionsForCourse). O link cobre o caso em que o
-- curso certo não está cadastrado — sem ele, o líder fica travado esperando o
-- RH cadastrar, e acaba escrevendo a URL no campo de texto livre, onde o
-- sistema não enxerga.
--
-- O link não tem progresso automático: o colaborador marca a ação como
-- concluída, e pode registrar o certificado pelo fluxo de curso externo
-- (external_courses) que já existe.

alter table public.pdi_actions
  add column if not exists course_url text,
  add column if not exists course_url_title text;

comment on column public.pdi_actions.course_url is
  'Link externo indicado pelo líder quando o curso não está no catálogo. Sem progresso automático.';
comment on column public.pdi_actions.course_url_title is
  'Rótulo do link externo, exibido no lugar da URL crua.';
