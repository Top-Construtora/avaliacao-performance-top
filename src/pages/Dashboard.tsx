import { useNavigate } from 'react-router-dom';
import { useEvaluation } from '../context/EvaluationContext';
import DashboardCard from '../components/DashboardCard';
import Button from '../components/Button';
import { ClipboardCheck, Clock, CheckCircle, Plus, FileText, History } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { stats, evaluations } = useEvaluation();
  const navigate = useNavigate();
  
  const startNewEvaluation = () => {
    navigate('/evaluation');
  };
  
  const viewReports = () => {
    navigate('/reports');
  };
  
  const viewHistory = () => {
    navigate('/history');
  };
  
  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Button 
          variant="primary" 
          onClick={startNewEvaluation}
          icon={<Plus size={16} />}
        >
          Iniciar Avaliação
        </Button>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Avaliações Pendentes"
            value={stats.pending}
            icon={<ClipboardCheck size={24} />}
            color="bg-red-500"
            onClick={() => navigate('/history?status=pending')}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Avaliações em Andamento"
            value={stats.inProgress}
            icon={<Clock size={24} />}
            color="bg-yellow-500"
            onClick={() => navigate('/history?status=in-progress')}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Avaliações Concluídas"
            value={stats.completed}
            icon={<CheckCircle size={24} />}
            color="bg-green-500"
            onClick={() => navigate('/history?status=completed')}
          />
        </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <motion.div
          className="col-span-1 md:col-span-2 lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="primary" 
                onClick={startNewEvaluation}
                icon={<Plus size={16} />}
                className="flex-1 md:flex-none"
              >
                Iniciar Avaliação
              </Button>
              <Button 
                variant="outline" 
                onClick={viewReports}
                icon={<FileText size={16} />}
                className="flex-1 md:flex-none"
              >
                Relatórios
              </Button>
              <Button 
                variant="outline" 
                onClick={viewHistory}
                icon={<History size={16} />}
                className="flex-1 md:flex-none"
              >
                Histórico
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Avaliações Recentes</h2>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Final</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluations.slice(0, 5).map((evaluation) => {
                const employee = evaluation.employeeId ? { 
                  name: 'João Silva', 
                  position: 'Tech Lead' 
                } : { name: 'Unknown', position: 'Unknown' };
                
                return (
                  <tr key={evaluation.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/evaluation/${evaluation.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{evaluation.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evaluation.status === 'completed' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Concluída
                        </span>
                      )}
                      {evaluation.status === 'in-progress' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Em Andamento
                        </span>
                      )}
                      {evaluation.status === 'pending' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {evaluation.finalScore ? evaluation.finalScore.toFixed(1) : '-'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {evaluations.length > 5 && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={viewHistory}>
                Ver Todas
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;