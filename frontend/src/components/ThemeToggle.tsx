import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// gio v4.0: toggle deslizante obsidian → thumb lime com ícone Sun/Moon.
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Espelha o switch do GIO (AppHeader): trilho 56×30, thumb lime 22px,
  // desliza 26px, ícone lua(escuro)/sol(claro), easing "overshoot".
  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Alternar entre modo escuro e claro"
      className="flex h-[30px] w-14 flex-shrink-0 items-center justify-start rounded-full border border-[#8B8B95]/30 bg-[#8B8B95]/20 p-[3px] transition-colors duration-300 hover:bg-[#8B8B95]/[0.34] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D2FF00]"
    >
      <span
        className="grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full bg-[#D2FF00] text-obsidian"
        style={{
          transform: isDark ? 'translateX(0)' : 'translateX(26px)',
          transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {isDark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
    </button>
  );
};
