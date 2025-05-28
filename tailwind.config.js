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
          500: '#12b0a0',
          600: '#0f9d8e',
          700: '#0c8576',
        },
        'secondary': {
          500: '#1e6076',
          600: '#1a5468',
          700: '#164859',
        },
        'accent': {
          500: '#baa673',
          600: '#a89460',
          700: '#96824d',
        }
      }
    },
  },
  plugins: [],
};