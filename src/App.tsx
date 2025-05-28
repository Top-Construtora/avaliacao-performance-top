import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { EvaluationProvider } from './context/EvaluationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EvaluationForm from './pages/EvaluationForm';
import Reports from './pages/Reports';
import History from './pages/History';
import NotFound from './pages/NotFound';

function App() {
  return (
    <EvaluationProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="evaluation" element={<EvaluationForm />} />
            <Route path="evaluation/:id" element={<EvaluationForm />} />
            <Route path="reports" element={<Reports />} />
            <Route path="history" element={<History />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </EvaluationProvider>
  );
}

export default App;