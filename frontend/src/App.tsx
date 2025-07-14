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
import NineBoxGuide from './pages/NineBoxGuide';
import RegisterUser from './pages/RegisterUser';
import RegisterTeam from './pages/RegisterTeam';
import RegisterDepartment from './pages/RegisterDepartment';
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
import SalaryAdminPage from './pages/SalaryAdminPage';
import TrackPositionsPage from './pages/TrackPositionsPage';
import CareerTrackDetail from './pages/CareerTrackDetail';

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
        borderRadius: '0.5rem',
      },
      success: {
        style: {
          background: '#10b981',
          color: '#ffffff',
        },
        iconTheme: {
          primary: '#ffffff',
          secondary: '#10b981',
        },
      },
      error: {
        style: {
          background: '#ef4444',
          color: '#ffffff',
        },
        iconTheme: {
          primary: '#ffffff',
          secondary: '#ef4444',
        },
      },
    },
  };

  if (USE_SUPABASE_AUTH) {
    // Versão com Supabase Auth
    return (
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <EvaluationProvider>
                <Toaster {...toasterConfig} />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
                      path="leader-evaluations" 
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <EvaluationDashboard />
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
                      path="/salary/tracks/:trackId"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <TrackPositionsPage />
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
                          <SalaryAdminPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Rotas de cadastro separadas */}
                    <Route 
                      path="register/user" 
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <RegisterUser />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="register/team" 
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <RegisterTeam />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="register/department" 
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <RegisterDepartment />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="users/:id/edit" 
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <UserEdit />
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
                      path="nine-box-guide" 
                      element={
                        <ProtectedRoute allowedRoles={['director', 'leader']}>
                          <NineBoxGuide />
                        </ProtectedRoute>
                      } 
                    />

                    <Route 
                      path="pdi-list" 
                      element={
                        <ProtectedRoute allowedRoles={['director', 'leader', 'collaborator']}>
                          <PDIList />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Career Track Detail */}
                    <Route 
                      path="career-track/:trackId" 
                      element={
                        <ProtectedRoute allowedRoles={['director', 'leader', 'collaborator']}>
                          <CareerTrackDetail />
                        </ProtectedRoute>
                      } 
                    />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </EvaluationProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    );
  } else {
    // Versão sem Supabase Auth
    return (
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <EvaluationProvider>
                <Toaster {...toasterConfig} />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="self-evaluation" element={<SelfEvaluation />} />
                    <Route path="leader-evaluation" element={<LeaderEvaluation />} />
                    <Route path="consensus" element={<Consensus />} />
                    <Route path="nine-box" element={<NineBoxMatrix />} />
                    <Route path="action-plan" element={<ActionPlan />} />
                    <Route path="pdi-list" element={<PDIList />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="notifications" element={<NotificationHistory />} />
                    <Route path="users" element={<UserManagement />} />
                    
                    {/* Rotas de cadastro separadas */}
                    <Route path="register/user" element={<RegisterUser />} />
                    <Route path="register/team" element={<RegisterTeam />} />
                    <Route path="register/department" element={<RegisterDepartment />} />
                    
                    <Route path="users/:id/edit" element={<UserEdit />} />
                    <Route path="cycle" element={<CycleManagement />} />
                    <Route path="leader-evaluations" element={<EvaluationDashboard />} />
                    <Route path="nine-box-guide" element={<NineBoxGuide />} />
                    <Route path="salary" element={<SalaryAdminPage />} />
                    <Route path="salary/tracks/:trackId" element={<TrackPositionsPage />} />
                    <Route path="career-track/:trackId" element={<CareerTrackDetail />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </EvaluationProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    );
  }
}

export default App;