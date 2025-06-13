import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { EvaluationProvider } from './context/EvaluationContext';
import { UserProvider } from './context/UserContext'; 
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import SelfEvaluation from './pages/SelfEvaluation';
import LeaderEvaluation from './pages/LeaderEvaluation';
import PotentialEvaluation from './pages/PotentialEvaluation';
import NineBoxGuide from './pages/NineBoxGuide';
import UserRegistration from './pages/UserRegistration';
import Consensus from './pages/Consensus';
import ActionPlan from './pages/ActionPlan';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import NineBoxMatrix from './pages/NineBox';
import NotificationHistory from './pages/NotificationHistory';
import UserManagement from './pages/UserManagement';

const USE_SUPABASE_AUTH = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

function App() {
  if (!USE_SUPABASE_AUTH) {
    return (
      <ThemeProvider>
        <UserProvider>
          <EvaluationProvider>
            <Router>
              <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#ffffff',
                    color: '#363636',
                    fontSize: '14px',
                    maxWidth: '400px',
                    padding: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Space Grotesk, sans-serif',
                    zIndex: 9999,
                  },
                  success: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#12b0a0',
                      secondary: '#ffffff',
                    },
                    style: {
                      background: '#ffffff',
                      color: '#065f46',
                      border: '1px solid #12b0a0',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#dc2626',
                      secondary: '#ffffff',
                    },
                    style: {
                      background: '#ffffff',
                      color: '#991b1b',
                      border: '1px solid #dc2626',
                    },
                  },
                }}
                containerStyle={{
                  top: 20,
                  right: 20,
                  zIndex: 9999,
                }}
              />
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="self-evaluation" element={<SelfEvaluation />} />
                  <Route path="leader-evaluation" element={<LeaderEvaluation />} />
                  <Route path="potential-evaluation" element={<PotentialEvaluation />} />
                  <Route path="consensus" element={<Consensus />} />
                  <Route path="nine-box" element={<NineBoxMatrix />} />
                  <Route path="action-plan" element={<ActionPlan />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="users" element={<UserManagement />} /> 
                  <Route path="/notifications" element={<NotificationHistory />} />
                  <Route path="users/new" element={<UserRegistration />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Router>
          </EvaluationProvider>
        </UserProvider>
      </ThemeProvider>
    );
  }

  // App com autenticação Supabase ativada
  return (
    <AuthProvider>
      <ThemeProvider>
        <UserProvider>
          <EvaluationProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#ffffff',
                    color: '#363636',
                    fontSize: '14px',
                    maxWidth: '400px',
                    padding: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Space Grotesk, sans-serif',
                    zIndex: 9999,
                  },
                  success: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#12b0a0',
                      secondary: '#ffffff',
                    },
                    style: {
                      background: '#ffffff',
                      color: '#065f46',
                      border: '1px solid #12b0a0',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#dc2626',
                      secondary: '#ffffff',
                    },
                    style: {
                      background: '#ffffff',
                      color: '#991b1b',
                      border: '1px solid #dc2626',
                    },
                  },
                }}
                containerStyle={{
                  top: 20,
                  right: 20,
                  zIndex: 9999,
                }}
              />
              
              <Routes>
                {/* Rotas públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Rotas protegidas */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  {/* Dashboard - Todos os usuários autenticados */}
                  <Route index element={<Dashboard />} />
                  
                  {/* Autoavaliação - Colaboradores e Líderes (Diretores não fazem autoavaliação) */}
                  <Route 
                    path="self-evaluation" 
                    element={
                      <ProtectedRoute allowedRoles={['collaborator', 'leader']}>
                        <SelfEvaluation />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Avaliação de Equipe - Líderes e Diretores */}
                  <Route 
                    path="leader-evaluation" 
                    element={
                      <ProtectedRoute allowedRoles={['leader', 'director']}>
                        <LeaderEvaluation />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Avaliação de Potencial - Líderes e Diretores */}
                  <Route 
                    path="potential-evaluation" 
                    element={
                      <ProtectedRoute allowedRoles={['leader', 'director']}>
                        <PotentialEvaluation />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Consenso - Apenas Diretores */}
                  <Route 
                    path="consensus" 
                    element={
                      <ProtectedRoute allowedRoles={['director']}>
                        <Consensus />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Matriz 9-Box - Apenas Diretores */}
                  <Route 
                    path="nine-box" 
                    element={
                      <ProtectedRoute allowedRoles={['director']}>
                        <NineBoxMatrix />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Plano de Ação/PDI - Apenas Diretores */}
                  <Route 
                    path="action-plan" 
                    element={
                      <ProtectedRoute allowedRoles={['director']}>
                        <ActionPlan />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Relatórios - Apenas Diretores */}
                  <Route 
                    path="reports" 
                    element={
                      <ProtectedRoute allowedRoles={['director']}>
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Configurações - Todos os usuários autenticados */}
                  <Route path="settings" element={<Settings />} />
                  
                  {/* Notificações - Todos os usuários autenticados */}
                  <Route path="notifications" element={<NotificationHistory />} />
                  
                  {/* Gestão de Usuários - Apenas Diretores */}
                  <Route 
                    path="users" 
                    element={
                      <ProtectedRoute allowedRoles={['director']}>
                        <UserManagement />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Cadastro de Usuários - Apenas Diretores */}
                  <Route 
                    path="users/new" 
                    element={
                      <ProtectedRoute allowedRoles={['director']}>
                        <UserRegistration />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Guia NineBox - Todos os Usuários */}
                  <Route
                    path="nine-box-guide"
                    element={
                      <ProtectedRoute allowedRoles={['director', 'leader']}>
                        <NineBoxGuide />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* 404 - Página não encontrada */}
                  <Route path="*" element={<NotFound />} />
                </Route>
                
                {/* Redirecionar qualquer rota não encontrada para login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </EvaluationProvider>
        </UserProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;