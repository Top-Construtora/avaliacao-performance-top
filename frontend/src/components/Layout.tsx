import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import FirstLoginPasswordModal from './FirstLoginPasswordModal';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Verificar se precisa mostrar modal de troca de senha
  useEffect(() => {
    if (profile?.must_change_password) {
      setShowPasswordModal(true);
    }
  }, [profile?.must_change_password]);

  // Persistir estado da sidebar no localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Fechar menu mobile quando mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Verificar se tem largura mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Redirecionar para login se não tiver usuário
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  // Se não tem usuário, retorna null (o useEffect acima vai redirecionar)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Overlay para mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'
      }`}>
        {/* Header */}
        <Header 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 py-4 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-2 sm:space-y-0">
            <p>&copy; {new Date().getFullYear()} GIO - Sistema de Avaliação de Performance</p>
            <p>Versão 1.2.0</p>
          </div>
        </footer>
      </div>

      {/* Modal de primeiro login - troca de senha obrigatória */}
      <FirstLoginPasswordModal
        isOpen={showPasswordModal}
        onSuccess={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
