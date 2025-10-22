import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Log para debug - ver se as variáveis estão sendo carregadas
  const env = loadEnv(mode, process.cwd(), '');
  console.log('🔧 Vite Build Mode:', mode);
  console.log('🌍 VITE_API_URL:', env.VITE_API_URL || 'NOT SET');
  console.log('🔑 VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
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
    }
  };
});