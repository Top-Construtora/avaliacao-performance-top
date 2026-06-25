interface GioLoadingProps {
  /** Ocupa a tela inteira com fundo obsidian (#1A1A1A). Default: true. */
  fullScreen?: boolean;
  /** Diâmetro do anel em px. Default: 120. */
  size?: number;
}

/**
 * Tela de carregamento "gio Loading Circular":
 * anel cinza estático + arco lime (#D2FF00) girando + "gio" central
 * sobre fundo obsidian (#1A1A1A). Réplica da referência visual oficial.
 */
export function GioLoading({ fullScreen = true, size = 120 }: GioLoadingProps) {
  // Geometria do anel (viewBox 100x100, centro 50,50).
  const stroke = 7;
  const r = 50 - stroke; // raio com folga para o stroke não cortar
  const c = 2 * Math.PI * r;

  const ring = (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Carregando"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full animate-spin">
        {/* track cinza estático */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#8B8B95"
          strokeWidth={stroke}
          opacity="0.3"
        />
        {/* arco lime girando (1/4 da circunferência) */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="hsl(var(--gio-lime))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * 0.25} ${c}`}
        />
      </svg>
      {/* "gio" estático no centro */}
      <span
        className="absolute inset-0 flex items-center justify-center font-bold text-lime"
        style={{ fontSize: size * 0.32 }}
      >
        gio
      </span>
    </div>
  );

  if (!fullScreen) {
    return <div className="flex items-center justify-center">{ring}</div>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A1A1A]">
      {ring}
    </div>
  );
}

export default GioLoading;
