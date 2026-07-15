import { Check } from 'lucide-react';
import { RatingOption } from '../../constants/ratingScales';

interface RatingScaleProps {
  /** Opções da escala (ex.: COMPETENCY_SCALE, POTENTIAL_SCALE). */
  options: RatingOption[];
  /** Nota atualmente selecionada. */
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  /** id do rótulo que descreve a escala (para aria-labelledby). */
  labelledBy?: string;
}

/**
 * Escala de nota como pills full-width empilhadas verticalmente.
 * Alvos de toque ≥ 56px, número + rótulo + check. Mobile-first.
 * Semântica de radiogroup para teclado e leitores de tela.
 */
export default function RatingScale({
  options,
  value,
  onChange,
  readOnly = false,
  labelledBy,
}: RatingScaleProps) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(opt.value)}
            className={[
              'group flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left',
              'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              selected
                ? `${opt.color} border-transparent text-white shadow-md`
                : readOnly
                  ? 'cursor-default border-border bg-card text-muted-foreground'
                  : 'border-border bg-card text-foreground hover:border-lime active:scale-[0.99]',
            ].join(' ')}
          >
            {/* Número */}
            <span
              className={[
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base font-bold',
                selected
                  ? 'bg-white/20 text-white'
                  : 'bg-secondary text-foreground group-hover:bg-lime/15',
              ].join(' ')}
            >
              {opt.value}
            </span>

            {/* Rótulo */}
            <span className="min-w-0 flex-1 text-sm font-medium sm:text-base">{opt.label}</span>

            {/* Check quando selecionado */}
            {selected && <Check className="h-5 w-5 flex-shrink-0 text-white" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
