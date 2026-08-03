/**
 * Skeleton de carregamento: blocos pulsantes que reservam o espaço do conteúdo
 * (sem layout shift), no lugar do spinner bloqueante que deixava a página em
 * branco. `Skeleton` é o bloco primitivo; `PageSkeleton` é a composição padrão
 * para telas de listagem/dashboard (cabeçalho + fileira de KPIs + conteúdo).
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-secondary ${className}`} />;
}

export default function PageSkeleton({
  kpis = 4,
  cards = 6,
}: {
  /** Quantidade de tiles na fileira de KPIs (0 esconde a fileira). */
  kpis?: number;
  /** Quantidade de cards no grid de conteúdo (0 mostra um bloco único). */
  cards?: number;
}) {
  return (
    <div className="space-y-6" role="status" aria-label="Carregando conteúdo">
      {/* Cabeçalho da página */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Fileira de KPIs */}
      {kpis > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: kpis }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24 max-w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {cards > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      )}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
