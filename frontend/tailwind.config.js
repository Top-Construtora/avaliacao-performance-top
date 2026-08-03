/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  prefix: '',
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
        // Body padrão: DM Sans (identidade GIO v4.0); Space Grotesk como fallback
        sans: [
          '"DM Sans"',
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
        // Fonte do shell (Sidebar/Header) — espelha a identidade GIO v4.0 (DM Sans)
        gio: [
          '"DM Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
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

        // Cores de Status (NAUE legado — distinto de success/warning/critical
        // da GIO; ainda usado em ~13 lugares)
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#0A8060',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
