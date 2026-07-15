import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

interface FlowFooterProps {
  isFirst: boolean;
  isLast: boolean;
  mode: 'edit' | 'view';
  /** Próxima desabilitada (gating por tela). */
  nextDisabled?: boolean;
  /** Enviar desabilitado (gating final). */
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  primaryLabel?: string;
  submitLabel?: string;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onExit?: () => void;
}

/**
 * Barra de ação fixa no rodapé, com respiro para a safe-area do iOS.
 * Botões grandes (h-12) alcançáveis com o polegar.
 */
export default function FlowFooter({
  isFirst,
  isLast,
  mode,
  nextDisabled,
  submitDisabled,
  isSubmitting,
  primaryLabel,
  submitLabel = 'Enviar',
  onPrev,
  onNext,
  onSubmit,
  onExit,
}: FlowFooterProps) {
  const showSubmit = isLast && mode === 'edit';

  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {/* Voltar / Sair */}
        {!isFirst ? (
          <button
            type="button"
            onClick={onPrev}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Voltar</span>
          </button>
        ) : onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Sair</span>
          </button>
        ) : (
          <span className="h-12" />
        )}

        {/* Primário */}
        {mode === 'view' ? (
          isLast ? (
            <button
              type="button"
              onClick={onExit ?? onNext}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-lime text-sm font-semibold text-obsidian hover:opacity-90"
            >
              Concluir
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Próxima
              <ArrowRight className="h-4 w-4" />
            </button>
          )
        ) : showSubmit ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled || isSubmitting}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-lime text-sm font-semibold text-obsidian transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {primaryLabel ?? 'Próxima'}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
