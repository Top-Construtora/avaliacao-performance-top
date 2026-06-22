import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// gio v4.0: toggle deslizante obsidian → thumb lime com ícone Sun/Moon.
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Alternar tema"
      className="relative inline-flex h-7 w-14 items-center rounded-full bg-white/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#D2FF00]/50"
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#D2FF00] shadow transition-transform duration-300 ${
          isDark ? 'translate-x-8' : 'translate-x-1'
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-obsidian" />
        ) : (
          <Sun className="h-3 w-3 text-obsidian" />
        )}
      </span>
    </button>
  );
};
