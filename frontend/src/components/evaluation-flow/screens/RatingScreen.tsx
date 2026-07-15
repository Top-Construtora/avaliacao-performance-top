import { useEffect, useRef } from 'react';
import RatingScale from '../RatingScale';
import type { RatingOption } from '../../../constants/ratingScales';
import type { FlowScreenContext } from '../types';

interface RatingScreenProps {
  /** Rótulo do grupo (ex.: "Competência Técnica"). */
  eyebrow?: string;
  title: string;
  description?: string;
  options: RatingOption[];
  value?: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  autoAdvance?: boolean;
  ctx: FlowScreenContext;
}

/**
 * Uma competência/critério por tela: enunciado + escala de nota.
 * Teclas 1-4 selecionam; ao escolher, avança suavemente (auto-advance).
 */
export default function RatingScreen({
  eyebrow,
  title,
  description,
  options,
  value,
  onChange,
  readOnly = false,
  autoAdvance = true,
  ctx,
}: RatingScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>();
  const labelId = `rating-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const select = (v: number) => {
    if (readOnly) return;
    onChange(v);
    if (autoAdvance && !ctx.isLast) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => ctx.goNext(), 260);
    }
  };

  // Teclado: dígitos 1..N escolhem a nota
  useEffect(() => {
    const el = rootRef.current;
    if (!el || readOnly) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const n = Number(e.key);
      if (!Number.isNaN(n) && options.some((o) => o.value === n)) {
        e.preventDefault();
        select(n);
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, readOnly, ctx.isLast]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  return (
    <div ref={rootRef} data-flow-autofocus tabIndex={-1} className="outline-none">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lime-deep dark:text-lime">
          {eyebrow}
        </p>
      )}
      <h2 id={labelId} className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}

      <div className="mt-6">
        <RatingScale
          options={options}
          value={value}
          onChange={select}
          readOnly={readOnly}
          labelledBy={labelId}
        />
      </div>
    </div>
  );
}
