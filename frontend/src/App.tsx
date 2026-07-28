import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { EvaluationProvider } from './context/EvaluationContext';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Import dinâmico resiliente: se um chunk falhar ao carregar (típico logo após
// um novo deploy, quando o index.html em cache aponta para arquivos antigos que
// não existem mais), recarrega a página UMA vez para pegar o build novo.
function lazyWithRetry(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(async () => {
    const alreadyReloaded = sessionStorage.getItem('chunk-reload') === '1';
    try {
      const mod = await factory();
      sessionStorage.removeItem('chunk-reload');
      return mod;
    } catch (err) {
      if (!alreadyReloaded) {
        sessionStorage.setItem('chunk-reload', '1');
        window.location.reload();
        // Promise que nunca resolve: evita renderizar erro enquanto recarrega.
        return new Promise<{ default: React.ComponentType<any> }>(() => {});
      }
      throw err;
    }
  });
}

// Lazy loaded pages
const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const ForgotPassword = lazyWithRetry(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/auth/ResetPassword'));
const Dashboard = lazyWithRetry(() => import('./pages/home/Dashboard'));
const SelfEvaluation = lazyWithRetry(() => import('./pages/evaluations/SelfEvaluation'));
const LeaderEvaluation = lazyWithRetry(() => import('./pages/evaluations/LeaderEvaluation'));
const NineBoxGuide = lazyWithRetry(() => import('./pages/evaluations/NineBoxGuide'));
const NineBoxMatrix = lazyWithRetry(() => import('./pages/evaluations/NineBox'));
const Consensus = lazyWithRetry(() => import('./pages/evaluations/Consensus'));
const AuditLog = lazyWithRetry(() => import('./pages/management/AuditLog'));
const UserManagement = lazyWithRetry(() => import('./pages/users/UserManagement'));
const RegisterUser = lazyWithRetry(() => import('./pages/users/RegisterUser'));
const UserEdit = lazyWithRetry(() => import('./pages/users/EditUser'));
const TeamManagement = lazyWithRetry(() => import('./pages/teams/TeamManagement'));
const RegisterTeam = lazyWithRetry(() => import('./pages/teams/RegisterTeam'));
const EditTeam = lazyWithRetry(() => import('./pages/teams/EditTeam'));
const DepartmentManagement = lazyWithRetry(
  () => import('./pages/departments/DepartmentManagement'),
);
const RegisterDepartment = lazyWithRetry(() => import('./pages/departments/RegisterDepartment'));
const EditDepartment = lazyWithRetry(() => import('./pages/departments/EditDepartment'));
const Reports = lazyWithRetry(() => import('./pages/reports/Reports'));
const EvaluationDashboard = lazyWithRetry(() => import('./pages/reports/EvaluationDashboard'));
const Settings = lazyWithRetry(() => import('./pages/settings/Settings'));
const HelpPage = lazyWithRetry(() => import('./pages/help/HelpPage'));
const NotificationHistory = lazyWithRetry(
  () => import('./pages/notifications/NotificationHistory'),
);
const CycleManagement = lazyWithRetry(() => import('./pages/management/CycleManagement'));
const SalaryAdminPage = lazyWithRetry(() => import('./pages/management/SalaryAdminPage'));
const CodigoCultural = lazyWithRetry(() => import('./pages/management/CodigoCultural'));
const CulturalCode = lazyWithRetry(() => import('./pages/management/CulturalCode'));
const TrackPositionsPage = lazyWithRetry(() => import('./pages/carrer/TrackPositionsPage'));
const CareerTrackDetail = lazyWithRetry(() => import('./pages/carrer/CareerTrackDetail'));
const PdiManagement = lazyWithRetry(() => import('./pages/pdi/PdiManagement'));
const MyPdi = lazyWithRetry(() => import('./pages/pdi/MyPdi'));
const PdiCalendar = lazyWithRetry(() => import('./pages/pdi/PdiCalendar'));
const SatisfactionSurveys = lazyWithRetry(() => import('./pages/satisfaction/SatisfactionSurveys'));
const SatisfactionForm = lazyWithRetry(() => import('./pages/satisfaction/SatisfactionForm'));
const SatisfactionRespond = lazyWithRetry(() => import('./pages/satisfaction/SatisfactionRespond'));
const SatisfactionResults = lazyWithRetry(() => import('./pages/satisfaction/SatisfactionResults'));
const PublicSurveyRespond = lazyWithRetry(() => import('./pages/satisfaction/PublicSurveyRespond'));
const PublicInterviewRespond = lazyWithRetry(
  () => import('./pages/interviews/PublicInterviewRespond'),
);
const RecruitmentList = lazyWithRetry(() => import('./pages/recruitment/RecruitmentList'));
const RecruitmentForm = lazyWithRetry(() => import('./pages/recruitment/RecruitmentForm'));
const RecruitmentView = lazyWithRetry(() => import('./pages/recruitment/RecruitmentView'));
const InterviewList = lazyWithRetry(() => import('./pages/interviews/InterviewList'));
const InterviewForm = lazyWithRetry(() => import('./pages/interviews/InterviewForm'));
const InterviewTemplates = lazyWithRetry(() => import('./pages/interviews/InterviewTemplates'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-deep dark:border-lime"></div>
    </div>
  );
}

const USE_SUPABASE_AUTH = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

function App() {
  // Configuração do Toaster (comum para ambos os casos)
  const toasterConfig = {
    position: 'bottom-right' as const,
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
            <NotificationProvider>
              <UserProvider>
                <EvaluationProvider>
                  <Toaster {...toasterConfig} />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      {/* Links públicos (sem login) */}
                      <Route path="/p/:id" element={<PublicSurveyRespond />} />
                      <Route path="/i/:token" element={<PublicInterviewRespond />} />

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

                        <Route
                          path="audit"
                          element={
                            <ProtectedRoute allowedRoles={['director']}>
                              <AuditLog />
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
                        <Route
                          path="pdi"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <PdiManagement />
                            </ProtectedRoute>
                          }
                        />
                        {/* PDI Calendar */}
                        <Route
                          path="pdi-calendar"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <PdiCalendar />
                            </ProtectedRoute>
                          }
                        />

                        {/* Competências Organizacionais */}
                        <Route
                          path="competencias-organizacionais"
                          element={
                            <ProtectedRoute allowedRoles={['director']}>
                              <CodigoCultural />
                            </ProtectedRoute>
                          }
                        />
                        {/* Código Cultural (valores e princípios — visível a todos) */}
                        <Route path="codigo-cultural" element={<CulturalCode />} />

                        {/* Recrutamento e Seleção */}
                        <Route
                          path="recruitment"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <RecruitmentList />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="recruitment/new"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <RecruitmentForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="recruitment/:id"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <RecruitmentView />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="recruitment/:id/edit"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <RecruitmentForm />
                            </ProtectedRoute>
                          }
                        />

                        {/* Satisfação */}
                        <Route path="satisfaction" element={<SatisfactionSurveys />} />
                        <Route
                          path="satisfaction/new"
                          element={
                            <ProtectedRoute allowedRoles={['director']}>
                              <SatisfactionForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="satisfaction/:id/edit"
                          element={
                            <ProtectedRoute allowedRoles={['director']}>
                              <SatisfactionForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="satisfaction/:id/respond" element={<SatisfactionRespond />} />
                        <Route
                          path="satisfaction/:id/results"
                          element={
                            <ProtectedRoute allowedRoles={['director']}>
                              <SatisfactionResults />
                            </ProtectedRoute>
                          }
                        />

                        {/* Entrevistas */}
                        <Route
                          path="interviews"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <InterviewList />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="interviews/new"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <InterviewForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="interviews/templates"
                          element={
                            <ProtectedRoute allowedRoles={['director']}>
                              <InterviewTemplates />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="interviews/:id"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <InterviewForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="interviews/:id/edit"
                          element={
                            <ProtectedRoute allowedRoles={['director', 'leader']}>
                              <InterviewForm />
                            </ProtectedRoute>
                          }
                        />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </EvaluationProvider>
              </UserProvider>
            </NotificationProvider>
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
            <NotificationProvider>
              <UserProvider>
                <EvaluationProvider>
                  <Toaster {...toasterConfig} />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Links públicos (sem login) */}
                      <Route path="/p/:id" element={<PublicSurveyRespond />} />
                      <Route path="/i/:token" element={<PublicInterviewRespond />} />
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
                        <Route
                          path="evaluation-dashboard/:cycleId"
                          element={<EvaluationDashboard />}
                        />
                        <Route path="nine-box-guide" element={<NineBoxGuide />} />
                        <Route path="salary" element={<SalaryAdminPage />} />
                        <Route path="salary/tracks/:trackId" element={<TrackPositionsPage />} />
                        <Route path="career-track/:trackId" element={<CareerTrackDetail />} />
                        {/* My PDI - View Own PDI */}
                        <Route path="my-pdi" element={<MyPdi />} />
                        {/* PDI Management (New Route) */}
                        <Route path="pdi-management" element={<PdiManagement />} />
                        {/* Competências Organizacionais */}
                        <Route path="competencias-organizacionais" element={<CodigoCultural />} />
                        {/* Código Cultural (valores e princípios — visível a todos) */}
                        <Route path="codigo-cultural" element={<CulturalCode />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </EvaluationProvider>
              </UserProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    );
  }
}

export default App;
