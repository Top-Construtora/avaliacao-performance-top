/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Cores Top - Teal
    'bg-top-teal', 'bg-top-teal-light', 'bg-top-teal-dark',
    'from-top-teal', 'to-top-teal', 'from-top-teal-dark', 'to-top-teal-dark',
    'border-top-teal', 'text-top-teal',
    'bg-top-teal/10', 'bg-top-teal/20', 'border-top-teal/20', 'border-top-teal/30', 'border-top-teal/40',
    'dark:from-top-teal', 'dark:to-top-teal', 'dark:from-top-teal-dark', 'dark:to-top-teal-dark',
    'dark:bg-top-teal/10', 'dark:border-top-teal/30', 'dark:border-top-teal/40', 'dark:text-top-teal',
    'focus:ring-top-teal', 'dark:focus:ring-top-teal',
    // Cores Top - Blue
    'bg-top-blue', 'bg-top-blue-light', 'bg-top-blue-dark',
    'from-top-blue', 'to-top-blue', 'from-top-blue-dark', 'to-top-blue-dark',
    'border-top-blue', 'text-top-blue',
    'bg-top-blue/10', 'bg-top-blue/20', 'border-top-blue/30', 'border-top-blue/40',
    'dark:from-top-blue', 'dark:to-top-blue', 'dark:from-top-blue-dark', 'dark:to-top-blue-dark',
    'dark:bg-top-blue/10', 'dark:border-top-blue/40', 'dark:text-top-blue',
    'focus:ring-top-blue', 'dark:focus:ring-top-blue',
    // Cores Top - Gold
    'bg-top-gold', 'bg-top-gold-light', 'bg-top-gold-dark',
    'from-top-gold', 'to-top-gold', 'from-top-gold-dark', 'to-top-gold-dark',
    'border-top-gold', 'text-top-gold',
    'bg-top-gold/10', 'bg-top-gold/20', 'border-top-gold/30', 'border-top-gold/40',
    'dark:from-top-gold', 'dark:to-top-gold', 'dark:from-top-gold-dark', 'dark:to-top-gold-dark',
    'dark:bg-top-gold/10', 'dark:border-top-gold/40', 'dark:text-top-gold',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Space Grotesk', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
        'lemon-milk': ['"Lemon Milk"', 'sans-serif'],
      },
      colors: {
        // NAUE Consultoria - Cores Primárias (Azul Escuro)
        'primary': {
          DEFAULT: '#1e2938',
          hover: '#161f2a',
          light: 'rgba(30, 41, 56, 0.15)',
          50: '#e8eaed',
          100: '#d1d5db',
          200: '#a3abb7',
          300: '#758193',
          400: '#47576f',
          500: '#1e2938',
          600: '#1e2938',
          700: '#161f2a',
          800: '#0f151c',
          900: '#070a0e',
        },
        // Cores Neutras
        'naue': {
          black: '#282C2A',
          'dark-gray': '#2C2C2C',
          'text-gray': '#6b7280',
          'border-gray': '#e5e7eb',
          'light-gray': '#f8f9fa',
          white: '#FFFFFF',
        },
        // Cores de Status
        'status': {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#0A8060',
        },
        // Mantendo secondary para compatibilidade
        'secondary': {
          DEFAULT: '#6b7280',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Para manter compatibilidade com código existente
        'accent': {
          DEFAULT: '#0A8060',
          50: '#e6f9f4',
          100: '#ccf3e9',
          200: '#99e7d3',
          300: '#66dbbd',
          400: '#33cfa7',
          500: '#0A8060',
          600: '#097356',
          700: '#08664d',
          800: '#075943',
          900: '#064c3a',
        },
        'dark-navy': '#1e2938',
        'naue-green': '#1e2938',
        // Cores Top
        'top': {
          teal: '#12b0a0',
          'teal-light': '#e6f7f5',
          'teal-dark': '#0e8c80',
          blue: '#1e6076',
          'blue-light': '#e8f0f3',
          'blue-dark': '#184d5e',
          gold: '#baa673',
          'gold-light': '#f5f1e6',
          'gold-dark': '#9a8a5f',
        },
      },
      boxShadow: {
        'primary-500/20': '0 10px 15px -3px rgba(18, 176, 160, 0.2), 0 4px 6px -2px rgba(18, 176, 160, 0.1)',
        'secondary-500/20': '0 10px 15px -3px rgba(30, 96, 118, 0.2), 0 4px 6px -2px rgba(30, 96, 118, 0.1)',
        'accent-500/20': '0 10px 15px -3px rgba(186, 166, 115, 0.2), 0 4px 6px -2px rgba(186, 166, 115, 0.1)',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    },
  },
  plugins: [],
};