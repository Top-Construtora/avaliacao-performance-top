import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CalendarClock, GraduationCap, Link2, Loader2 } from 'lucide-react';
import { api } from '../config/api';

/**
 * Acompanhamento das ações do PDI pelo líder: status, prazo e o curso indicado.
 *
 * Vive separado do PotentialAndPDI porque aquele edita o rascunho do PDI (o
 * JSONB, ainda não salvo), e estes campos só existem na tabela pdi_actions —
 * ou seja, depois que o plano foi salvo e as ações ganharam id.
 *
 * O curso do catálogo dá acompanhamento real: quando o colaborador conclui o
 * curso, a ação é marcada como concluída sozinha. O link externo é a saída para
 * quando o curso certo não está cadastrado, e aí a conclusão é manual.
 */

interface PdiAction {
  id: string;
  competencia: string;
  prazo: string;
  status: string;
  due_date: string | null;
  course_id: string | null;
  course: { id: string; title: string } | null;
  course_url: string | null;
  course_url_title: string | null;
}

interface CourseOption {
  id: string;
  title: string;
}

const STATUS_OPTIONS = [
  { value: '1', label: 'Não iniciado' },
  { value: '2', label: 'Em andamento' },
  { value: '3', label: 'Pausado' },
  { value: '4', label: 'Concluído' },
  { value: '5', label: 'Cancelado' },
];

const PRAZO_LABEL: Record<string, string> = {
  curto: 'Curto prazo',
  medio: 'Médio prazo',
  longo: 'Longo prazo',
};

interface Props {
  planId: string;
  /** Nome do colaborador, só para o texto de contexto. */
  colaborador?: string;
}

const PdiActionCourses: React.FC<Props> = ({ planId, colaborador }) => {
  const [actions, setActions] = useState<PdiAction[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  // Rascunho do link por ação, para não disparar PATCH a cada tecla
  const [linkDraft, setLinkDraft] = useState<Record<string, { url: string; title: string }>>({});

  const load = async () => {
    try {
      const [actionsRes, coursesRes] = await Promise.all([
        api.get(`/pdi/${planId}/actions`),
        api.get('/learning/course-options'),
      ]);
      const actionsData = (actionsRes.data || actionsRes)?.actions || [];
      setActions(actionsData);
      setCourses((coursesRes.data || coursesRes) ?? []);

      const drafts: Record<string, { url: string; title: string }> = {};
      actionsData.forEach((a: PdiAction) => {
        drafts[a.id] = { url: a.course_url || '', title: a.course_url_title || '' };
      });
      setLinkDraft(drafts);
    } catch {
      toast.error('Não foi possível carregar as ações do PDI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const patch = async (actionId: string, changes: Record<string, unknown>, aviso: string) => {
    setSavingId(actionId);
    try {
      const response = await api.patch(`/pdi/${planId}/actions/${actionId}`, changes);
      const updated = response.data || response;
      setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, ...updated } : a)));
      toast.success(aviso);
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar');
      load(); // volta ao estado real do servidor
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando ações...
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Salve o PDI para poder indicar cursos e prazos em cada ação.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Acompanhamento das ações
        </h3>
        <p className="text-sm text-muted-foreground">
          Status, prazo e curso de cada ação{colaborador ? ` de ${colaborador}` : ''}. O curso
          indicado aparece na página de Aprendizado do colaborador; ao concluir um curso do
          catálogo, a ação é marcada como concluída automaticamente.
        </p>
      </div>

      {actions.map((action) => {
        const draft = linkDraft[action.id] || { url: '', title: '' };
        const linkMudou =
          draft.url !== (action.course_url || '') ||
          draft.title !== (action.course_url_title || '');

        return (
          <div key={action.id} className="bg-secondary rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{action.competencia || 'Sem título'}</p>
                <span className="text-xs text-muted-foreground">
                  {PRAZO_LABEL[action.prazo] || action.prazo}
                </span>
              </div>
              {savingId === action.id && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Status
                <select
                  value={action.status}
                  onChange={(e) =>
                    patch(action.id, { status: e.target.value }, 'Status atualizado')
                  }
                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                Prazo
                <input
                  type="date"
                  value={action.due_date || ''}
                  onChange={(e) =>
                    patch(action.id, { due_date: e.target.value || null }, 'Prazo atualizado')
                  }
                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                />
              </label>

              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5" />
                Curso do catálogo
                <select
                  value={action.course_id || ''}
                  onChange={(e) =>
                    patch(
                      action.id,
                      { course_id: e.target.value || null },
                      e.target.value ? 'Curso vinculado' : 'Curso desvinculado',
                    )
                  }
                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs max-w-[16rem]"
                >
                  <option value="">Nenhum</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-border">
              <label className="flex-1 min-w-[14rem] text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 mb-1">
                  <Link2 className="h-3.5 w-3.5" />
                  Ou um link externo
                </span>
                <input
                  type="url"
                  value={draft.url}
                  onChange={(e) =>
                    setLinkDraft((prev) => ({
                      ...prev,
                      [action.id]: { ...draft, url: e.target.value },
                    }))
                  }
                  placeholder="https://..."
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                />
              </label>
              <label className="flex-1 min-w-[10rem] text-xs text-muted-foreground">
                <span className="mb-1 block">Nome do curso</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) =>
                    setLinkDraft((prev) => ({
                      ...prev,
                      [action.id]: { ...draft, title: e.target.value },
                    }))
                  }
                  placeholder="Ex.: Comunicação assertiva"
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                />
              </label>
              <button
                type="button"
                disabled={!linkMudou || savingId === action.id}
                onClick={() =>
                  patch(
                    action.id,
                    { course_url: draft.url || null, course_url_title: draft.title || null },
                    draft.url ? 'Link salvo' : 'Link removido',
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground disabled:opacity-40 hover:bg-background"
              >
                Salvar link
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PdiActionCourses;
