import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { FlowStep } from './types';

interface FlowProgressProps {
  steps: FlowStep[];
  index: number;
}

/**
 * Progresso do fluxo:
 * - Mobile: barra fina + contador "n de total".
 * - Desktop (md+): idem no topo; o rail lateral de grupos é renderizado
 *   separadamente por FlowSideRail.
 */
export default function FlowProgress({ steps, index }: FlowProgressProps) {
  const total = steps.length;
  const current = Math.min(index + 1, total);
  const pct = total > 0 ? (current / total) * 100 : 0;
  const group = steps[index]?.group;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="truncate text-xs font-medium text-muted-foreground">
          {group || 'Avaliação'}
        </span>
        <span
          className="flex-shrink-0 text-xs font-semibold tabular-nums text-foreground"
          aria-live="polite"
        >
          {current} <span className="text-muted-foreground">de {total}</span>
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <motion.div
          className="h-full rounded-full bg-lime"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        />
      </div>
    </div>
  );
}

interface FlowSideRailProps {
  steps: FlowStep[];
  index: number;
  onJump: (i: number) => void;
  /** Em modo leitura permite pular livremente; em edição só para trás. */
  freeNavigation: boolean;
}

/** Rail lateral de grupos (somente desktop). Lista as seções e destaca a atual. */
export function FlowSideRail({ steps, index, onJump, freeNavigation }: FlowSideRailProps) {
  // Agrupa por `group`, guardando o primeiro índice de cada grupo
  const groups: { label: string; firstIndex: number; done: boolean; active: boolean }[] = [];
  steps.forEach((s, i) => {
    const label = s.group || 'Avaliação';
    const existing = groups.find((g) => g.label === label);
    const stepDone = s.isComplete !== false;
    if (!existing) {
      groups.push({ label, firstIndex: i, done: stepDone, active: false });
    }
  });
  // Marca ativo/concluído por grupo
  const activeLabel = steps[index]?.group || 'Avaliação';
  groups.forEach((g) => {
    const groupSteps = steps.filter((s) => (s.group || 'Avaliação') === g.label);
    g.done = groupSteps.every((s) => s.isComplete !== false);
    g.active = g.label === activeLabel;
  });

  return (
    <nav aria-label="Seções da avaliação" className="flex flex-col gap-1">
      {groups.map((g) => {
        const reachable = freeNavigation || g.firstIndex <= index;
        return (
          <button
            key={g.label}
            type="button"
            disabled={!reachable}
            onClick={() => reachable && onJump(g.firstIndex)}
            className={[
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
              g.active
                ? 'bg-lime/10 font-semibold text-foreground'
                : reachable
                  ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  : 'cursor-not-allowed text-muted-foreground/50',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                g.done
                  ? 'border-lime bg-lime text-obsidian'
                  : g.active
                    ? 'border-lime text-foreground'
                    : 'border-border text-muted-foreground',
              ].join(' ')}
            >
              {g.done ? <Check className="h-3 w-3" /> : ''}
            </span>
            <span className="truncate">{g.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
