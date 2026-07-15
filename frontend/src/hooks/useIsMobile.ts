import { useEffect, useState } from 'react';

/**
 * Retorna `true` quando a viewport é menor que `breakpoint` (px).
 * Padrão 768px = breakpoint `md` do Tailwind — mesma fronteira usada no Layout.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const query = `(max-width: ${breakpoint - 1}px)`;

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Sincroniza caso o breakpoint mude entre renders
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}

export default useIsMobile;
