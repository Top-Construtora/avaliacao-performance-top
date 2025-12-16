import { useUserRole } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import DirectorDashboard from './DirectorDashboard';
import LeaderDashboard from './LeaderDashboard';
import CollaboratorDashboard from './CollaboratorDashboard';

const Dashboard = () => {
  const { role } = useUserRole();

  // Renderiza o dashboard apropriado baseado no role do usuário
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'director':
      return <DirectorDashboard />;
    case 'leader':
      return <LeaderDashboard />;
    case 'collaborator':
    default:
      return <CollaboratorDashboard />;
  }
};

export default Dashboard;
