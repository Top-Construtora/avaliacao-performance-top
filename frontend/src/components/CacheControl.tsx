import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Clock
} from 'lucide-react';
import { authCacheManager } from '../utils/authCacheManager';
import { toast } from 'react-hot-toast';

export default function CacheControl() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    const confirmed = window.confirm(
      'Isso irá limpar o cache de autenticação e recarregar a página.\n\n' +
      'Você precisará fazer login novamente. Continuar?'
    );

    if (!confirmed) return;

    setIsClearing(true);
    
    try {
      // Limpar cache
      authCacheManager.clearAuthCache();
      
      toast.success('Cache limpo com sucesso! Recarregando...');
      
      // Aguardar um momento para o toast aparecer
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (error) {
      toast.error('Erro ao limpar cache');
      setIsClearing(false);
    }
  };

  const getCacheInfo = () => {
    const cacheVersion = localStorage.getItem('auth_cache_version') || 'N/A';
    const sessionTimeout = localStorage.getItem('auth_session_timeout');
    const timeRemaining = sessionTimeout 
      ? Math.max(0, parseInt(sessionTimeout) - Date.now()) 
      : 0;
    
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth') || key.includes('sb-')
    );

    return {
      version: cacheVersion,
      timeRemaining: timeRemaining > 0 
        ? `${Math.floor(timeRemaining / 1000 / 60 / 60)}h ${Math.floor((timeRemaining / 1000 / 60) % 60)}m`
        : 'Expirado',
      itemCount: supabaseKeys.length,
      size: new Blob(Object.values(localStorage)).size
    };
  };

  const cacheInfo = getCacheInfo();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Database className="h-5 w-5 mr-2 text-primary-500" />
        Controle de Cache
      </h3>

      <div className="space-y-4">
        {/* Informações do Cache */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Versão do Cache</p>
            <p className="font-semibold text-gray-900">{cacheInfo.version}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Sessão Expira em</p>
            <p className="font-semibold text-gray-900 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {cacheInfo.timeRemaining}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Itens em Cache</p>
            <p className="font-semibold text-gray-900">{cacheInfo.itemCount}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Tamanho</p>
            <p className="font-semibold text-gray-900">
              {(cacheInfo.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>

        {/* Aviso */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-xs text-yellow-700">
              <p className="font-semibold mb-1">Limpar cache quando:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Tiver problemas de login</li>
                <li>A página ficar carregando infinitamente</li>
                <li>Dados não atualizarem corretamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botão de Limpar */}
        <button
          onClick={handleClearCache}
          disabled={isClearing}
          className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isClearing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Limpando cache...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Cache de Autenticação
            </>
          )}
        </button>

        {/* Dica */}
        <div className="flex items-start text-xs text-gray-500">
          <CheckCircle className="h-3 w-3 mr-1 mt-0.5 text-green-500" />
          <p>
            O cache é verificado automaticamente ao iniciar o sistema e limpo quando necessário.
          </p>
        </div>
      </div>
    </div>
  );
}