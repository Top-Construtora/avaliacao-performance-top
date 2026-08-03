import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

/**
 * Número que sobe de 0 até o valor com spring curto (count-up). Escreve direto
 * no textContent via ref — sem re-render por frame. Com preferência de
 * movimento reduzido, mostra o valor final imediatamente.
 */
interface AnimatedNumberProps {
  value: number;
  /** Casas decimais exibidas (default 0 — inteiros). */
  decimals?: number;
  /** Duração em segundos (default 0.9). */
  duration?: number;
  /** Texto colado após o número (ex.: '%'). */
  suffix?: string;
  className?: string;
}

export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.9,
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  // Anima a partir do valor anterior (não do zero) quando o dado atualiza
  const previous = useRef(0);

  // toFixed (ponto decimal) para casar com o formato já usado nas notas do app
  const format = (n: number) => n.toFixed(decimals) + suffix;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion || !Number.isFinite(value)) {
      node.textContent = format(Number.isFinite(value) ? value : 0);
      previous.current = Number.isFinite(value) ? value : 0;
      return;
    }

    const controls = animate(previous.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });
    previous.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, duration, suffix, prefersReducedMotion]);

  // Conteúdo inicial já formatado evita flash de vazio no primeiro paint
  return (
    <span ref={ref} className={className}>
      {format(prefersReducedMotion ? value : 0)}
    </span>
  );
}
