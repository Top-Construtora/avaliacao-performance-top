import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUserRole } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuthNavigation } from '../hooks/useAuthNavigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'director' | 'leader' | 'collaborator'>;
  requireActive?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireActive = true
}: ProtectedRouteProps) {
  const { user, loading, profile } = useAuth();
  const { role, isActive, isAdmin } = useUserRole();
  const location = useLocation();
  const { signOut } = useAuthNavigation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Aguardar carregamento do perfil
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando perfil...</p>
        </motion.div>
      </div>
    );
  }

  // Verificar se o usuário está ativo
  if (requireActive && !isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Conta Inativa
          </h2>
          <p className="text-gray-600 mb-6">
            Sua conta está temporariamente inativa. Entre em contato com o RH para mais informações.
          </p>
          <button
            onClick={() => {
              const { signOut } = useAuth();
              signOut();
            }}
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Fazer Logout
          </button>
        </motion.div>
      </div>
    );
  }

  // Verificar permissões de papel (admin bypassa essa verificação)
  if (allowedRoles && !isAdmin && !allowedRoles.includes(role as 'admin' | 'director' | 'leader' | 'collaborator')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            Voltar
          </button>
        </motion.div>
      </div>
    );
  }

  // Usuário autenticado e autorizado
  return <>{children}</>;
}

// Componente auxiliar para rotas específicas de cada papel
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function DirectorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'director']}>
      {children}
    </ProtectedRoute>
  );
}

export function LeaderRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'director', 'leader']}>
      {children}
    </ProtectedRoute>
  );
}

export function CollaboratorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'director', 'leader', 'collaborator']}>
      {children}
    </ProtectedRoute>
  );
}