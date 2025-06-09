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
import UserRegistration from './pages/UserRegistration';
import Consensus from './pages/Consensus';
import ActionPlan from './pages/ActionPlan';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import NineBoxMatrix from './pages/NineBox';
import NotificationHistory from './pages/NotificationHistory';
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

export default App;