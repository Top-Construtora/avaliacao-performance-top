import type { ElementType } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface TextListScreenProps {
  icon?: ElementType;
  eyebrow?: string;
  title: string;
  /** Frase de contexto (ex.: "Sei falar sobre:"). */
  prompt: string;
  items: string[];
  onUpdate: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * Editor de lista de texto (toolkit da autoavaliação) — um campo por linha,
 * com botão de remover sempre visível (nada de hover-only) e alvos ≥44px.
 */
export default function TextListScreen({
  icon: Icon,
  eyebrow,
  title,
  prompt,
  items,
  onUpdate,
  onAdd,
  onRemove,
  placeholder = 'Digite aqui…',
  readOnly = false,
}: TextListScreenProps) {
  const filled = items.filter((v) => v.trim() !== '');

  if (readOnly) {
    return (
      <div data-flow-autofocus tabIndex={-1} className="outline-none">
        <Header Icon={Icon} eyebrow={eyebrow} title={title} prompt={prompt} />
        <ul className="mt-6 space-y-2">
          {filled.length > 0 ? (
            filled.map((v, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground"
              >
                {v}
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">Nada informado.</li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div data-flow-autofocus tabIndex={-1} className="outline-none">
      <Header Icon={Icon} eyebrow={eyebrow} title={title} prompt={prompt} />

      <div className="mt-6 space-y-2.5">
        {items.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onUpdate(index, e.target.value)}
              placeholder={placeholder}
              className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label="Remover item"
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-lime hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Adicionar mais
      </button>
    </div>
  );
}

function Header({
  Icon,
  eyebrow,
  title,
  prompt,
}: {
  Icon?: ElementType;
  eyebrow?: string;
  title: string;
  prompt: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-lime/15 text-lime-deep dark:text-lime">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wide text-lime-deep dark:text-lime">
              {eyebrow}
            </p>
          )}
          <h2 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">{title}</h2>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">{prompt}</p>
    </div>
  );
}
