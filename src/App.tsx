import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { EvaluationProvider } from './context/EvaluationContext';
import { UserProvider } from './context/UserContext'; 
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SelfEvaluation from './pages/SelfEvaluation';
import LeaderEvaluation from './pages/LeaderEvaluation';
import PotentialEvaluation from './pages/PotentialEvaluation';
import Consensus from './pages/Consensus';
import ActionPlan from './pages/ActionPlan';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import NineBoxMatrix from './pages/NineBox';
import UserManagement from './pages/UserManagement'; 

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <EvaluationProvider>
          <Router>
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'dark:bg-dark-800 dark:text-white',
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  fontSize: '14px',
                  maxWidth: '90vw',
                  wordBreak: 'break-word',
                },
                duration: window.innerWidth < 640 ? 3000 : 4000,
              }}
              containerStyle={{
                top: 'env(safe-area-inset-top, 20px)',
                left: 'env(safe-area-inset-left, 20px)',
                right: 'env(safe-area-inset-right, 20px)',
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
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Router>
        </EvaluationProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;