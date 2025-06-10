// Gerenciador de cache para evitar problemas de sessão obsoleta

const CACHE_VERSION_KEY = 'auth_cache_version';
const CURRENT_VERSION = '1.0.1';
const LAST_CLEANUP_KEY = 'auth_last_cleanup';
const CLEANUP_INTERVAL = 5000; // 5 segundos entre limpezas

export const authCacheManager = {
  // Limpar cache em cada carregamento de página
  cleanOnPageLoad: () => {
    try {
      // Verificar se já limpou recentemente para evitar loops
      const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
      const now = Date.now();
      
      if (lastCleanup) {
        const timeSinceCleanup = now - parseInt(lastCleanup);
        if (timeSinceCleanup < CLEANUP_INTERVAL) {
          console.log('Cache já foi limpo recentemente, pulando...');
          return false;
        }
      }

      console.log('Limpando cache no carregamento da página...');
      
      // Limpar todos os dados do Supabase
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('auth') ||
          key.includes('sb-') ||
          key === 'auth_session_timeout'
        )) {
          keysToRemove.push(key);
        }
      }

      // Remover as chaves encontradas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Limpar sessionStorage
      sessionStorage.clear();

      // Marcar quando foi limpo
      localStorage.setItem(LAST_CLEANUP_KEY, now.toString());
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);

      console.log(`Cache limpo: ${keysToRemove.length} itens removidos`);
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  },

  // Verificar e limpar cache se necessário
  checkAndCleanCache: () => {
    // Sempre limpar no carregamento
    return authCacheManager.cleanOnPageLoad();
  },

  // Limpar apenas dados de autenticação do Supabase
  clearAuthCache: () => {
    try {
      // Preservar algumas configurações importantes
      const preserveKeys = [
        'theme',
        'language',
        'user_preferences',
        CACHE_VERSION_KEY,
        LAST_CLEANUP_KEY
      ];
      
      const preserved: Record<string, string> = {};
      preserveKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) preserved[key] = value;
      });

      // Limpar localStorage
      localStorage.clear();

      // Limpar sessionStorage
      sessionStorage.clear();

      // Restaurar valores preservados
      Object.entries(preserved).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log('Auth cache completamente limpo');
    } catch (error) {
      console.error('Error clearing auth cache:', error);
    }
  },

  // Atualizar timeout da sessão
  updateSessionTimeout: () => {
    // Não usar mais timeout, já que limpamos sempre
  },

  // Limpar cache ao fazer logout
  clearOnLogout: () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Cache limpo no logout');
  },

  // Verificar se precisa recarregar a página
  shouldReload: () => {
    return false; // Não recarregar automaticamente para evitar loops
  }
};

// Limpar cache imediatamente ao carregar o módulo
if (typeof window !== 'undefined') {
  // Executar limpeza assim que o script carregar
  authCacheManager.cleanOnPageLoad();
}