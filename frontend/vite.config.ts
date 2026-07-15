import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // SW ativo em dev para testar instalação/offline localmente
        devOptions: { enabled: true, type: 'module' },
        includeAssets: ['icons/favicon-48.png', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'GIO — Gente & Gestão',
          short_name: 'GIO',
          description: 'Avaliações de desempenho, PDI e desenvolvimento — Top Construtora',
          lang: 'pt-BR',
          dir: 'ltr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#1A1A1A',
          theme_color: '#1A1A1A',
          categories: ['business', 'productivity'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: '/icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Precache do app shell (JS/CSS/HTML/fontes/ícones do build)
          globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2,otf}', 'icons/*.png'],
          // Não pré-cachear os originais pesados (logo 2MB / favicon 1MB)
          globIgnores: ['**/assets/images/logo*.png', '**/assets/images/favicon.png'],
          navigateFallback: '/index.html',
          // Nunca servir /api ou o SW pelo fallback de navegação
          navigateFallbackDenylist: [/^\/api/, /^\/manifest/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              // Fontes Google (stylesheet) — SWR
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              // Arquivos de fonte — cache longo
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // Garantir que as variáveis de ambiente sejam expostas
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_USE_SUPABASE_AUTH': JSON.stringify(env.VITE_USE_SUPABASE_AUTH),
    },
  };
});
