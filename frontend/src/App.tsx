import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { EvaluationProvider } from './context/EvaluationContext';
import { UserProvider } from './context/UserContext'; 
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import SalaryReports from './pages/SalaryReports';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import SelfEvaluation from './pages/SelfEvaluation';
import LeaderEvaluation from './pages/LeaderEvaluation';
import NineBoxGuide from './pages/NineBoxGuide';
import UserRegistration from './pages/UserRegistration';
import UserEdit from './pages/UserEdit';
import Consensus from './pages/Consensus';
import ActionPlan, { PDIList } from './pages/ActionPlan';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import NineBoxMatrix from './pages/NineBox';
import NotificationHistory from './pages/NotificationHistory';
import UserManagement from './pages/UserManagement';
import EvaluationDashboard from './pages/EvaluationDashboard';
import CycleManagement from './pages/CycleManagement';

const USE_SUPABASE_AUTH = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

function App() {
  // Configuração do Toaster (comum para ambos os casos)
  const toasterConfig = {
    position: "top-right" as const,
    toastOptions: {
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
    },
    containerStyle: {
      top: 20,
      right: 20,
      zIndex: 9999,
    },
  };

  return (
    <Router>
      <ThemeProvider>
        <UserProvider>
          <AuthProvider>
            <EvaluationProvider>
              <Toaster {...toasterConfig} />
              
              <Routes>
                {USE_SUPABASE_AUTH ? (
                  // Rotas com autenticação Supabase
                  <>
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
                      <Route index element={<Dashboard />} />
                      
                      <Route 
                        path="self-evaluation" 
                        element={
                          <ProtectedRoute allowedRoles={['collaborator', 'leader']}>
                            <SelfEvaluation />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route 
                        path="leader-evaluation" 
                        element={
                          <ProtectedRoute allowedRoles={['leader', 'director']}>
                            <LeaderEvaluation />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route 
                        path="consensus" 
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <Consensus />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route
                        path='pdis'
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <PDIList/>
                          </ProtectedRoute>
                        }
                      />

                      <Route 
                        path="users/edit/:id" 
                        element={
                          <ProtectedRoute>
                            <UserEdit />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route 
                        path="evaluation-dashboard/:cycleId"
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <EvaluationDashboard />
                          </ProtectedRoute>
                        }
                      />
                        
                      <Route 
                        path="cycle"
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <CycleManagement />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route 
                        path="nine-box" 
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <NineBoxMatrix />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route 
                        path="action-plan" 
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <ActionPlan />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route 
                        path="reports" 
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <Reports />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route path="settings" element={<Settings />} />
                      <Route path="notifications" element={<NotificationHistory />} />
                      
                      <Route 
                        path="users" 
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <UserManagement />
                          </ProtectedRoute>
                        } 
                      />

                      <Route 
                        path="salary" 
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <SalaryReports />
                          </ProtectedRoute>
                        } 
                      />

                      
                      <Route 
                        path="users/new" 
                        element={
                          <ProtectedRoute allowedRoles={['director']}>
                            <UserRegistration />
                          </ProtectedRoute>
                        } 
                      />

                      <Route
                        path="nine-box-guide"
                        element={
                          <ProtectedRoute allowedRoles={['director', 'leader']}>
                            <NineBoxGuide />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route path="*" element={<NotFound />} />
                    </Route>
                    
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  </>
                ) : (
                  // Rotas sem autenticação
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="self-evaluation" element={<SelfEvaluation />} />
                    <Route path="leader-evaluation" element={<LeaderEvaluation />} />
                    <Route path="consensus" element={<Consensus />} />
                    <Route path="nine-box" element={<NineBoxMatrix />} />
                    <Route path="action-plan" element={<ActionPlan />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="/salary/reports" element={<SalaryReports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="/notifications" element={<NotificationHistory />} />
                    <Route path="users/new" element={<UserRegistration />} />
                    <Route path="users/edit/:id" element={<UserEdit />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                )}
              </Routes>
            </EvaluationProvider>
          </AuthProvider>
        </UserProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;