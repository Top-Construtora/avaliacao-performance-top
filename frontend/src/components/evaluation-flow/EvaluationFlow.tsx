import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import FlowProgress, { FlowSideRail } from './FlowProgress';
import FlowFooter from './FlowFooter';
import type { FlowStep, FlowScreenContext } from './types';

interface EvaluationFlowProps {
  steps: FlowStep[];
  index: number;
  onIndexChange: (i: number) => void;
  mode: 'edit' | 'view';
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  /** Gating final do envio (ex.: 100% avaliado). */
  canSubmit?: boolean;
  /** Faixa compacta no topo (ciclo/prazo/nine-box/colaborador). */
  header?: ReactNode;
  /** Voltar ao dashboard (view) / cancelar (primeira tela). */
  onExit?: () => void;
}

const SWIPE_KINDS = new Set(['intro', 'rating', 'review']);
const SWIPE_THRESHOLD = 70;

function isEditableTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable === true
  );
}

/** Encontra o ancestral rolável mais próximo (o <main> do Layout). */
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export default function EvaluationFlow({
  steps,
  index,
  onIndexChange,
  mode,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  canSubmit = true,
  header,
  onExit,
}: EvaluationFlowProps) {
  const total = steps.length;
  const safeIndex = Math.max(0, Math.min(index, total - 1));
  const step = steps[safeIndex];
  const directionRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isFirst = safeIndex === 0;
  const isLast = safeIndex === total - 1;
  const freeNavigation = mode === 'view';

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(target, total - 1));
      if (clamped === safeIndex) return;
      directionRef.current = clamped > safeIndex ? 1 : -1;
      onIndexChange(clamped);
    },
    [safeIndex, total, onIndexChange],
  );

  const goNext = useCallback(() => {
    if (safeIndex < total - 1) goTo(safeIndex + 1);
  }, [safeIndex, total, goTo]);

  const goPrev = useCallback(() => {
    if (safeIndex > 0) goTo(safeIndex - 1);
  }, [safeIndex, goTo]);

  // Foco + scroll ao trocar de tela (acessibilidade e teclado)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Rola o ancestral (o <main> do Layout) para o topo do fluxo
    const scrollParent = getScrollParent(el);
    if (scrollParent) scrollParent.scrollTo({ top: 0 });
    else window.scrollTo({ top: 0 });
    // Move o foco para a região da tela (leitores anunciam o novo conteúdo)
    const focusTarget = el.querySelector<HTMLElement>('[data-flow-autofocus]') ?? el;
    focusTarget.focus({ preventScroll: true });
  }, [safeIndex]);

  // Navegação por teclado (setas) — ignorada quando o foco está num campo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(document.activeElement)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const reduceMotion = useReducedMotion();
  const swipeEnabled = mode !== 'view' || SWIPE_KINDS.has(step?.kind);
  const canDrag = SWIPE_KINDS.has(step?.kind) && swipeEnabled;

  const ctx: FlowScreenContext = {
    index: safeIndex,
    total,
    mode,
    goNext,
    goPrev,
    goTo,
    isFirst,
    isLast,
  };

  const nextDisabled =
    mode === 'edit' && step?.blockAdvanceUntilComplete === true && step?.isComplete !== true;

  const variants = {
    enter: (dir: number) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir >= 0 ? 40 : -40 },
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir >= 0 ? -40 : 40 }),
  };

  if (!step) return null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col md:flex-row md:gap-8">
      {/* Rail lateral (desktop) */}
      <aside className="hidden w-56 flex-shrink-0 md:block">
        <div className="sticky top-4">
          {header && <div className="mb-4">{header}</div>}
          <FlowSideRail
            steps={steps}
            index={safeIndex}
            onJump={goTo}
            freeNavigation={freeNavigation}
          />
        </div>
      </aside>

      {/* Coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo pegajoso: header compacto (mobile) + progresso */}
        <div className="sticky top-0 z-30 -mx-1 border-b border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          {header && <div className="mb-3 md:hidden">{header}</div>}
          <FlowProgress steps={steps} index={safeIndex} />
        </div>

        {/* Área da tela */}
        <div ref={scrollRef} tabIndex={-1} className="flex-1 outline-none" aria-live="polite">
          <div className="mx-auto max-w-2xl px-1 py-5 sm:py-8">
            <AnimatePresence mode="wait" custom={directionRef.current}>
              <motion.div
                key={step.id}
                custom={directionRef.current}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: 'easeInOut' }}
                drag={canDrag ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) < SWIPE_THRESHOLD) return;
                  if (info.offset.x < 0) goNext();
                  else goPrev();
                }}
              >
                {step.render(ctx)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Rodapé fixo */}
        <FlowFooter
          isFirst={isFirst}
          isLast={isLast}
          mode={mode}
          nextDisabled={nextDisabled}
          submitDisabled={!canSubmit}
          isSubmitting={isSubmitting}
          primaryLabel={step.primaryLabel}
          submitLabel={submitLabel}
          onPrev={goPrev}
          onNext={goNext}
          onSubmit={onSubmit}
          onExit={onExit}
        />
      </div>
    </div>
  );
}
