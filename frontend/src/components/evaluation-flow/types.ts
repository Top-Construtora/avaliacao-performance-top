import type { ReactNode } from 'react';

export type FlowStepKind = 'intro' | 'rating' | 'text' | 'form' | 'picker' | 'review';

export interface FlowScreenContext {
  index: number;
  total: number;
  mode: 'edit' | 'view';
  goNext: () => void;
  goPrev: () => void;
  goTo: (i: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

export interface FlowStep {
  /** Identificador estável — usado como `key` (essencial para AnimatePresence). */
  id: string;
  kind: FlowStepKind;
  /** Rótulo do grupo/seção (rail lateral e agrupamento do progresso). */
  group?: string;
  /** Conteúdo da tela. */
  render: (ctx: FlowScreenContext) => ReactNode;
  /** Considerada "respondida" (para progresso e gating). */
  isComplete?: boolean;
  /** Se true, o botão Próxima fica desabilitado enquanto `isComplete` for false. */
  blockAdvanceUntilComplete?: boolean;
  /** Rótulo custom para o botão primário nesta tela (senão usa Próxima/Enviar). */
  primaryLabel?: string;
}
