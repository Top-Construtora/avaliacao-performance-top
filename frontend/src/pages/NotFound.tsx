import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Home, FileSearch, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Ícone ilustrativo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-8 shadow-xl">
              <FileSearch className="w-20 h-20 text-primary-500" />
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-8xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent font-lemon-milk">
              404
            </h1>
            <h2 className="text-3xl font-semibold text-gray-800 mt-4 font-lemon-milk tracking-wide">
              Ops! Página não encontrada
            </h2>
          </div>

          <p className="text-lg text-gray-600 max-w-md mx-auto px-4">
            Parece que você tentou acessar uma página que não existe no sistema de avaliação de performance.
          </p>

          {/* Sugestões */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg max-w-md mx-auto">
            <div className="flex items-start space-x-3 text-left">
              <AlertCircle className="text-amber-500 mt-1 flex-shrink-0" size={20} />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Isso pode ter acontecido porque:</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>O link pode estar desatualizado</li>
                  <li>A página foi movida ou removida</li>
                  <li>Você não tem permissão para acessar este conteúdo</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/">
              <Button 
                variant="primary" 
                icon={<Home size={18} />}
                className="group relative overflow-hidden"
              >
                <span className="relative z-10">Voltar ao Início</span>
                <div className="absolute inset-0 bg-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Button>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar à página anterior
            </button>
          </div>
        </div>

        {/* Decoração de fundo */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;