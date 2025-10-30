/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Space Grotesk', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        // NAUE Consultoria - Cores Primárias (Azul Escuro)
        'primary': {
          DEFAULT: '#1e6076',
          hover: '#185567',
          light: 'rgba(30, 96, 118, 0.15)',
          50: '#e6f2f5',
          100: '#cce5eb',
          200: '#99cbd7',
          300: '#66b1c3',
          400: '#3397af',
          500: '#1e6076',
          600: '#1e6076',
          700: '#185567',
          800: '#134a58',
          900: '#0d3f49',
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
        'dark-navy': '#1e6076',
        'naue-green': '#1e6076',
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