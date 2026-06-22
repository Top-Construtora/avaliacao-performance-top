import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  prefix: '',
  safelist: [
    // Cores Top - Teal
    'bg-top-teal',
    'bg-top-teal-light',
    'bg-top-teal-dark',
    'from-top-teal',
    'to-top-teal',
    'from-top-teal-dark',
    'to-top-teal-dark',
    'border-top-teal',
    'text-top-teal',
    'bg-top-teal/10',
    'bg-top-teal/20',
    'border-top-teal/20',
    'border-top-teal/30',
    'border-top-teal/40',
    'dark:from-top-teal',
    'dark:to-top-teal',
    'dark:from-top-teal-dark',
    'dark:to-top-teal-dark',
    'dark:bg-top-teal/10',
    'dark:border-top-teal/30',
    'dark:border-top-teal/40',
    'dark:text-top-teal',
    'focus:ring-top-teal',
    'dark:focus:ring-top-teal',
    // Cores Top - Blue
    'bg-top-blue',
    'bg-top-blue-light',
    'bg-top-blue-dark',
    'from-top-blue',
    'to-top-blue',
    'from-top-blue-dark',
    'to-top-blue-dark',
    'border-top-blue',
    'text-top-blue',
    'bg-top-blue/10',
    'bg-top-blue/20',
    'border-top-blue/30',
    'border-top-blue/40',
    'dark:from-top-blue',
    'dark:to-top-blue',
    'dark:from-top-blue-dark',
    'dark:to-top-blue-dark',
    'dark:bg-top-blue/10',
    'dark:border-top-blue/40',
    'dark:text-top-blue',
    'focus:ring-top-blue',
    'dark:focus:ring-top-blue',
    // Cores Top - Gold
    'bg-top-gold',
    'bg-top-gold-light',
    'bg-top-gold-dark',
    'from-top-gold',
    'to-top-gold',
    'from-top-gold-dark',
    'to-top-gold-dark',
    'border-top-gold',
    'text-top-gold',
    'bg-top-gold/10',
    'bg-top-gold/20',
    'border-top-gold/30',
    'border-top-gold/40',
    'dark:from-top-gold',
    'dark:to-top-gold',
    'dark:from-top-gold-dark',
    'dark:to-top-gold-dark',
    'dark:bg-top-gold/10',
    'dark:border-top-gold/40',
    'dark:text-top-gold',
    // YouTube-style dark mode (legado — páginas ainda não migradas)
    { pattern: /bg-yt-(bg|surface|elevated)/, variants: ['dark'] },
    { pattern: /border-yt-border/, variants: ['dark'] },
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        // Body padrão GIO: Space Grotesk continua como fallback de marca local
        sans: [
          'Space Grotesk',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        space: ['Space Grotesk', 'sans-serif'],
        'lemon-milk': ['"Lemon Milk"', 'sans-serif'],
        // Marca GIO (assinatura) — usado em títulos
        brand: ['"Lemon Milk"', 'sans-serif'],
      },
      colors: {
        /* ============================================================
           Tokens shadcn / GIO (via CSS variables em index.css)
           ============================================================ */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* GIO — marca e escala de status */
        obsidian: '#0A0E1A',
        lime: {
          DEFAULT: 'hsl(var(--gio-lime))',
          deep: 'hsl(var(--gio-lime-deep))',
        },
        success: 'hsl(var(--status-success))',
        warning: 'hsl(var(--status-warning))',
        critical: 'hsl(var(--status-critical))',

        /* ============================================================
           Tokens shadcn FUNDIDOS com as escalas legadas (NAUE/Top).
           `DEFAULT`/`foreground` => token GIO (usado por components/ui).
           `50..900`/`hover`/`light` => escala legada (usada em ~530 lugares).
           ============================================================ */
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
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
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
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
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
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

        // Cores Neutras (NAUE legado)
        naue: {
          black: '#282C2A',
          'dark-gray': '#2C2C2C',
          'text-gray': '#6b7280',
          'border-gray': '#e5e7eb',
          'light-gray': '#f8f9fa',
          white: '#FFFFFF',
        },
        // Cores de Status (NAUE legado — distinto de success/warning/critical do GIO)
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#0A8060',
        },
        'dark-navy': '#1e2938',
        // YouTube-style dark mode backgrounds (legado)
        yt: {
          bg: '#0f0f0f',
          surface: '#212121',
          elevated: '#272727',
          border: '#3f3f3f',
        },
        'naue-green': '#1e2938',
        // Cores Top (legado)
        top: {
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
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'primary-500/20':
          '0 10px 15px -3px rgba(18, 176, 160, 0.2), 0 4px 6px -2px rgba(18, 176, 160, 0.1)',
        'secondary-500/20':
          '0 10px 15px -3px rgba(30, 96, 118, 0.2), 0 4px 6px -2px rgba(30, 96, 118, 0.1)',
        'accent-500/20':
          '0 10px 15px -3px rgba(186, 166, 115, 0.2), 0 4px 6px -2px rgba(186, 166, 115, 0.1)',
      },
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fadeIn: 'fadeIn 0.5s ease-out',
        slideInRight: 'slideInRight 0.5s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
