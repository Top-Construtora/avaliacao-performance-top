import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { EvaluationProvider } from './context/EvaluationContext';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy loaded pages
const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('./pages/home/Dashboard'));
const SelfEvaluation = lazy(() => import('./pages/evaluations/SelfEvaluation'));
const LeaderEvaluation = lazy(() => import('./pages/evaluations/LeaderEvaluation'));
const NineBoxGuide = lazy(() => import('./pages/evaluations/NineBoxGuide'));
const NineBoxMatrix = lazy(() => import('./pages/evaluations/NineBox'));
const Consensus = lazy(() => import('./pages/evaluations/Consensus'));
const UserManagement = lazy(() => import('./pages/users/UserManagement'));
const RegisterUser = lazy(() => import('./pages/users/RegisterUser'));
const UserEdit = lazy(() => import('./pages/users/EditUser'));
const TeamManagement = lazy(() => import('./pages/teams/TeamManagement'));
const RegisterTeam = lazy(() => import('./pages/teams/RegisterTeam'));
const EditTeam = lazy(() => import('./pages/teams/EditTeam'));
const DepartmentManagement = lazy(() => import('./pages/departments/DepartmentManagement'));
const RegisterDepartment = lazy(() => import('./pages/departments/RegisterDepartment'));
const EditDepartment = lazy(() => import('./pages/departments/EditDepartment'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const EvaluationDashboard = lazy(() => import('./pages/reports/EvaluationDashboard'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const HelpPage = lazy(() => import('./pages/help/HelpPage'));
const NotificationHistory = lazy(() => import('./pages/notifications/NotificationHistory'));
const CycleManagement = lazy(() => import('./pages/management/CycleManagement'));
const SalaryAdminPage = lazy(() => import('./pages/management/SalaryAdminPage'));
const CodigoCultural = lazy(() => import('./pages/management/CodigoCultural'));
const TrackPositionsPage = lazy(() => import('./pages/carrer/TrackPositionsPage'));
const CareerTrackDetail = lazy(() => import('./pages/carrer/CareerTrackDetail'));
const PdiManagement = lazy(() => import('./pages/pdi/PdiManagement'));
const MyPdi = lazy(() => import('./pages/pdi/MyPdi'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

const USE_SUPABASE_AUTH = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

function App() {
  // Configuração do Toaster (comum para ambos os casos)
  const toasterConfig = {
    position: "bottom-right" as const,
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
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />

                    <Route
                      path="self-evaluation"
                      element={
                        <ProtectedRoute allowedRoles={['collaborator', 'leader', 'director']}>
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
                      path="evaluation-dashboard/:cycleId"
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
                        <ProtectedRoute allowedRoles={['director', 'leader']}>
                          <NineBoxMatrix />
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
                    <Route path="help" element={<HelpPage />} />
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
                      path="/users"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/teams"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <TeamManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/departments"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <DepartmentManagement />
                        </ProtectedRoute>
                      }
                    />

                    {/* Rotas de edição - UserEdit já existe e atende */}
                    <Route
                      path="users/edit/:id"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <UserEdit />
                        </ProtectedRoute>
                      }
                    />
                    {/* Novas rotas de edição para Time e Departamento */}
                    <Route
                      path="teams/edit/:id"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <EditTeam />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="departments/edit/:id"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <EditDepartment />
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

                    {/* Career Track Detail */}
                    <Route
                      path="career-track/:trackId"
                      element={
                        <ProtectedRoute allowedRoles={['director', 'leader', 'collaborator']}>
                          <CareerTrackDetail />
                        </ProtectedRoute>
                      }
                    />
                    {/* My PDI - View Own PDI */}
                    <Route
                      path="my-pdi"
                      element={
                        <ProtectedRoute allowedRoles={['director', 'leader', 'collaborator']}>
                          <MyPdi />
                        </ProtectedRoute>
                      }
                    />
                    {/* PDI Management (New Route) */}
                    <Route path="pdi" element={<ProtectedRoute allowedRoles={['director', 'leader']}><PdiManagement /></ProtectedRoute>} />

                    {/* Código Cultural (Organizational Competencies) */}
                    <Route
                      path="codigo-cultural"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <CodigoCultural />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </EvaluationProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    );
  } else {
    // Versão sem Supabase Auth (mantida como estava, apenas com as novas rotas)
    return (
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <EvaluationProvider>
                <Toaster {...toasterConfig} />
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="self-evaluation" element={<SelfEvaluation />} />
                    <Route path="leader-evaluation" element={<LeaderEvaluation />} />
                    <Route path="consensus" element={<Consensus />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/teams" element={<TeamManagement />} />
                    <Route path="/departments" element={<DepartmentManagement />} />
                    <Route path="nine-box" element={<NineBoxMatrix />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="help" element={<HelpPage />} />
                    <Route path="notifications" element={<NotificationHistory />} />
                    <Route path="users" element={<UserManagement />} />

                    {/* Rotas de cadastro separadas */}
                    <Route path="register/user" element={<RegisterUser />} />
                    <Route path="register/team" element={<RegisterTeam />} />
                    <Route path="register/department" element={<RegisterDepartment />} />

                    <Route path="users/edit/:id" element={<UserEdit />} />
                    {/* Novas rotas de edição para Time e Departamento */}
                    <Route path="teams/edit/:id" element={<EditTeam />} />
                    <Route path="departments/edit/:id" element={<EditDepartment />} />

                    <Route path="cycle" element={<CycleManagement />} />
                    <Route path="leader-evaluations" element={<EvaluationDashboard />} />
                    <Route path="evaluation-dashboard/:cycleId" element={<EvaluationDashboard />} />
                    <Route path="nine-box-guide" element={<NineBoxGuide />} />
                    <Route path="salary" element={<SalaryAdminPage />} />
                    <Route path="salary/tracks/:trackId" element={<TrackPositionsPage />} />
                    <Route path="career-track/:trackId" element={<CareerTrackDetail />} />
                    {/* My PDI - View Own PDI */}
                    <Route path="my-pdi" element={<MyPdi />} />
                    {/* PDI Management (New Route) */}
                    <Route path="pdi-management" element={<PdiManagement />} />
                    {/* Código Cultural */}
                    <Route path="codigo-cultural" element={<CodigoCultural />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </EvaluationProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    );
  }
}

export default App;
