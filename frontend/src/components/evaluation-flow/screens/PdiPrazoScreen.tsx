import { useState, type ElementType } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { PDI_STATUS_OPTIONS } from '../../../constants/ratingScales';
import type { ActionItem, Prazo } from '../../../hooks/useLeaderEvaluationForm';

type Draft = Omit<ActionItem, 'id'> & { prazo: Prazo };

interface PdiPrazoScreenProps {
  prazo: Prazo;
  icon: ElementType;
  title: string;
  subtitle: string;
  description: string;
  items: ActionItem[];
  onAdd: (draft: Draft) => boolean;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof ActionItem, value: string) => void;
  readOnly?: boolean;
}

const inputCls =
  'w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40';

const labelCls = 'mb-1 block text-xs font-medium text-muted-foreground';

function emptyDraft(prazo: Prazo): Draft {
  return {
    competencia: '',
    calendarizacao: '',
    comoDesenvolver: '',
    resultadosEsperados: '',
    status: '1',
    observacao: '',
    prazo,
  };
}

/** Uma tela de PDI por prazo: lista de itens editáveis + formulário de adição. */
export default function PdiPrazoScreen({
  prazo,
  icon: Icon,
  title,
  subtitle,
  description,
  items,
  onAdd,
  onRemove,
  onUpdate,
  readOnly = false,
}: PdiPrazoScreenProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(prazo));

  const submit = () => {
    if (onAdd(draft)) {
      setDraft(emptyDraft(prazo));
      setAdding(false);
    }
  };

  return (
    <div data-flow-autofocus tabIndex={-1} className="outline-none">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-lime/15 text-lime-deep dark:text-lime">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-deep dark:text-lime">
            PDI · {subtitle}
          </p>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      {/* Itens existentes */}
      <div className="mt-5 space-y-3">
        {items.length === 0 && !adding && (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum item ainda.
          </p>
        )}

        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                {item.competencia || 'Competência'}
              </p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label="Remover item"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {readOnly ? (
              <dl className="mt-2 space-y-1.5 text-sm">
                <Field label="Como desenvolver" value={item.comoDesenvolver} />
                <Field label="Resultados esperados" value={item.resultadosEsperados} />
                <Field label="Prazo" value={item.calendarizacao} />
                <Field
                  label="Status"
                  value={PDI_STATUS_OPTIONS.find((o) => o.value === item.status)?.label ?? ''}
                />
                {item.observacao && <Field label="Observação" value={item.observacao} />}
              </dl>
            ) : (
              <div className="mt-3 space-y-3">
                <div>
                  <label className={labelCls}>Competência a desenvolver</label>
                  <input
                    className={inputCls}
                    value={item.competencia}
                    onChange={(e) => onUpdate(item.id, 'competencia', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Como desenvolver</label>
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={item.comoDesenvolver}
                    onChange={(e) => onUpdate(item.id, 'comoDesenvolver', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Resultados esperados</label>
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={item.resultadosEsperados}
                    onChange={(e) => onUpdate(item.id, 'resultadosEsperados', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                  <div>
                    <label className={labelCls}>Prazo (mês)</label>
                    <input
                      type="month"
                      className={inputCls}
                      value={item.calendarizacao}
                      onChange={(e) => onUpdate(item.id, 'calendarizacao', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select
                      className={inputCls}
                      value={item.status}
                      onChange={(e) => onUpdate(item.id, 'status', e.target.value)}
                    >
                      {PDI_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Observação</label>
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={item.observacao}
                    onChange={(e) => onUpdate(item.id, 'observacao', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Formulário de adição */}
        {adding && !readOnly && (
          <div className="rounded-2xl border border-lime/40 bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Novo item</p>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setDraft(emptyDraft(prazo));
                }}
                aria-label="Cancelar"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className={labelCls}>Competência a desenvolver *</label>
                <input
                  className={inputCls}
                  value={draft.competencia}
                  onChange={(e) => setDraft((p) => ({ ...p, competencia: e.target.value }))}
                  placeholder="Ex.: Liderança de equipe"
                />
              </div>
              <div>
                <label className={labelCls}>Como desenvolver *</label>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={draft.comoDesenvolver}
                  onChange={(e) => setDraft((p) => ({ ...p, comoDesenvolver: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Resultados esperados *</label>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={draft.resultadosEsperados}
                  onChange={(e) => setDraft((p) => ({ ...p, resultadosEsperados: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                <div>
                  <label className={labelCls}>Prazo (mês)</label>
                  <input
                    type="month"
                    className={inputCls}
                    value={draft.calendarizacao}
                    onChange={(e) => setDraft((p) => ({ ...p, calendarizacao: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    className={inputCls}
                    value={draft.status}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, status: e.target.value as ActionItem['status'] }))
                    }
                  >
                    {PDI_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={submit}
                className="h-11 w-full rounded-xl bg-lime text-sm font-semibold text-obsidian hover:opacity-90"
              >
                Adicionar item
              </button>
            </div>
          </div>
        )}
      </div>

      {!adding && !readOnly && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-lime hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Adicionar item de {title.toLowerCase()}
        </button>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || '—'}</dd>
    </div>
  );
}
