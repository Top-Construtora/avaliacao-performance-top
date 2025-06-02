import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Verifica se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Verifica a preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Estados para detectar o tipo de dispositivo
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Função para detectar o tipo de dispositivo
  const detectDevice = () => {
    const width = window.innerWidth;
    setIsMobile(width < 640);
    setIsTablet(width >= 640 && width < 1024);
    setIsDesktop(width >= 1024);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove a classe anterior
    root.classList.remove('light', 'dark');
    
    // Adiciona a nova classe
    root.classList.add(theme);
    
    // Salva no localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Detecta o dispositivo na montagem
    detectDevice();

    // Adiciona listener para mudanças na janela
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Observa mudanças na preferência de cor do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Só muda o tema automaticamente se não houver preferência salva
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    isMobile,
    isTablet,
    isDesktop,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};