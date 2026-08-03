import CursorGrid from './CursorGrid';

/**
 * Fundo compartilhado das telas de autenticação (Login, ForgotPassword,
 * ResetPassword): aurora estática lime + vinheta (CSS puro) sob a grade
 * reativa ao cursor — o fluxo inteiro de auth fala a mesma língua visual.
 */
export default function AuthBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(140% 140% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%),
            radial-gradient(900px 640px at 16% 38%, rgba(210,255,0,0.065), transparent 70%),
            radial-gradient(1100px 760px at 88% 96%, rgba(210,255,0,0.035), transparent 70%)`,
        }}
      />
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
          clickPulse
          pulseSpeed={600}
        />
      </div>
    </>
  );
}
