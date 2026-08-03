import CursorGrid from './CursorGrid';

/**
 * Fundo compartilhado das telas de autenticação (Login, ForgotPassword,
 * ResetPassword): obsidian liso + grade reativa ao cursor — o fluxo inteiro
 * de auth fala a mesma língua visual.
 */
export default function AuthBackdrop() {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <CursorGrid
          cellSize={70}
          color="#D2FF00"
          radius={140}
          falloff="smooth"
          holdTime={400}
          fadeDuration={800}
          lineWidth={1.2}
          maxOpacity={0.55}
          gridOpacity={0.05}
          subCells={4}
          subGridOpacity={0.02}
          anchorBottom
          clickPulse
          pulseSpeed={600}
        />
      </div>
    </>
  );
}
