/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Space Grotesk', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        'primary': {
          50: '#e6f9f7',
          100: '#ccf3ef',
          200: '#99e7df',
          300: '#66dbcf',
          400: '#33cfbf',
          500: '#12b0a0',
          600: '#0f9d8e',
          700: '#0c8576',
          800: '#096d5e',
          900: '#065546',
        },
        'secondary': {
          50: '#e8f2f5',
          100: '#d1e5eb',
          200: '#a3cbd7',
          300: '#75b1c3',
          400: '#4797af',
          500: '#1e6076',
          600: '#1a5468',
          700: '#164859',
          800: '#123c4b',
          900: '#0e303c',
        },
        'accent': {
          50: '#faf8f4',
          100: '#f5f1e9',
          200: '#ebe3d3',
          300: '#e1d5bd',
          400: '#d7c7a7',
          500: '#baa673',
          600: '#a89460',
          700: '#96824d',
          800: '#84703a',
          900: '#725e27',
        }
      },
      boxShadow: {
        'primary-500/20': '0 10px 15px -3px rgba(18, 176, 160, 0.2), 0 4px 6px -2px rgba(18, 176, 160, 0.1)',
        'secondary-500/20': '0 10px 15px -3px rgba(30, 96, 118, 0.2), 0 4px 6px -2px rgba(30, 96, 118, 0.1)',
        'accent-500/20': '0 10px 15px -3px rgba(186, 166, 115, 0.2), 0 4px 6px -2px rgba(186, 166, 115, 0.1)',
      }
    },
  },
  plugins: [],
};