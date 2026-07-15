import { Check, ChevronRight, AlertCircle, ClipboardCheck } from 'lucide-react';

export interface ReviewItem {
  id: string;
  label: string;
  /** Resposta resumida (ex.: "Satisfatório"). Ausente = não respondido. */
  answer?: string;
  done: boolean;
  /** Índice da tela para editar. */
  stepIndex: number;
}

export interface ReviewGroup {
  label: string;
  items: ReviewItem[];
}

interface ReviewScreenProps {
  title?: string;
  subtitle?: string;
  groups: ReviewGroup[];
  onEdit: (stepIndex: number) => void;
  mode: 'edit' | 'view';
}

/**
 * Tela de revisão final — lista todas as respostas agrupadas, permite editar
 * item a item (salta para a tela) e dá confiança antes de enviar.
 */
export default function ReviewScreen({
  title = 'Revisão',
  subtitle,
  groups,
  onEdit,
  mode,
}: ReviewScreenProps) {
  const allItems = groups.flatMap((g) => g.items);
  const doneCount = allItems.filter((i) => i.done).length;
  const total = allItems.length;
  const complete = doneCount >= total;

  return (
    <div data-flow-autofocus tabIndex={-1} className="outline-none">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-lime/15 text-lime-deep dark:text-lime">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {subtitle ??
              (mode === 'view' ? 'Confira as respostas registradas.' : 'Revise antes de enviar.')}
          </p>
        </div>
      </div>

      {mode === 'edit' && (
        <div
          className={[
            'mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
            complete
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-warning/30 bg-warning/10 text-warning',
          ].join(' ')}
        >
          {complete ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {complete
            ? 'Tudo respondido — pronto para enviar.'
            : `${doneCount} de ${total} respondidos.`}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <section key={group.label}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>
            <ul className="overflow-hidden rounded-2xl border border-border">
              {group.items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onEdit(item.stepIndex)}
                    className={[
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
                      i > 0 ? 'border-t border-border' : '',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        item.done ? 'bg-lime text-obsidian' : 'border border-warning text-warning',
                      ].join(' ')}
                    >
                      {item.done ? <Check className="h-3.5 w-3.5" /> : '!'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <span
                        className={[
                          'block truncate text-xs',
                          item.done ? 'text-muted-foreground' : 'text-warning',
                        ].join(' ')}
                      >
                        {item.answer ?? 'Não respondido'}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
