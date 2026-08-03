import { ReactNode, useRef } from 'react';

/**
 * Card com glow que segue o mouse (padrão "spotlight" do React Bits, reescrito
 * em Tailwind + CSS custom properties — sem canvas, custo próximo de zero).
 * O glow usa o lime da marca e só aparece no hover; em touch não há hover,
 * então o card se comporta como um card comum.
 */
interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Cor do glow em rgb (default: lime da marca). */
  spotlightColor?: string;
  onClick?: () => void;
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = '210, 255, 0',
  onClick,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`group relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(${spotlightColor}, 0.12), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
