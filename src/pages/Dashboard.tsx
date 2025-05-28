import { useNavigate } from 'react-router-dom';
import { useEvaluation } from '../context/EvaluationContext';
import { 
  User, 
  Users, 
  TrendingUp, 
  FileText, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { stats, evaluations } = useEvaluation();
  const navigate = useNavigate();
  
  // Animation variants
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

  // Cards de funcionalidades
  const functionalityCards = [
    {
      id: 'autoavaliacao',
      title: 'Autoavaliação',
      description: 'Avalie suas competências e desempenho',
      action: 'Iniciar avaliação',
      icon: User,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      onClick: () => navigate('/self-evaluation'),
    },
     {
      id: 'avaliacao-lider',
      title: 'Avaliação do Líder',
      description: 'Avalie o desempenho dos colaboradores',
      action: 'Avaliar equipe',
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      onClick: () => navigate('/leader-evaluation'),
    },
    {
      id: 'consenso',
      title: 'Consenso',
      description: 'Definição das notas finais em consenso',
      action: 'Definir consenso',
      icon: Target,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      onClick: () => navigate('/evaluation'),
    },
    {
      id: 'matriz-9box',
      title: 'Matriz 9-Box',
      description: 'Visualização do posicionamento na matriz',
      action: 'Ver matriz',
      icon: BarChart3,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      onClick: () => navigate('/reports'),
    },
    {
      id: 'plano-acao',
      title: 'Plano de Ação',
      description: 'Planejamento de desenvolvimento',
      action: 'Criar plano',
      icon: FileText,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      onClick: () => navigate('/reports'),
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Acompanhamento geral do sistema',
      action: 'Ver relatórios',
      icon: Award,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      onClick: () => navigate('/reports'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900">GIO - TOP Construtora</h1>
        <p className="mt-2 text-lg text-gray-600">Gestão Inteligente de Obras - Análise de Desempenho</p>
      </div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/history?status=pending')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avaliações Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/history?status=in-progress')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/history?status=completed')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/history')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Functionality Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {functionalityCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <motion.div
              key={card.id}
              variants={itemVariants}
              className={`${card.bgColor} rounded-lg border ${card.borderColor} p-6 hover:shadow-md transition-all duration-200 cursor-pointer group`}
              onClick={card.onClick}
            >
              <div className="flex items-start space-x-4">
                <div className={`${card.color} rounded-lg p-3 group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {card.description}
                  </p>
                  <div className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    <span>{card.action}</span>
                    <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Evaluations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Avaliações Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nota Final
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluations.slice(0, 5).map((evaluation) => {
                const employee = evaluation.employeeId ? { 
                  name: 'João Silva', 
                  position: 'Engenheiro Civil' 
                } : { name: 'Colaborador', position: 'Cargo' };
                
                return (
                  <tr 
                    key={evaluation.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors" 
                    onClick={() => navigate(`/evaluation/${evaluation.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{evaluation.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evaluation.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Concluída
                        </span>
                      )}
                      {evaluation.status === 'in-progress' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Em Andamento
                        </span>
                      )}
                      {evaluation.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evaluation.finalScore ? evaluation.finalScore.toFixed(1) : '-'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {evaluations.length > 5 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/history')}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Ver todas as avaliações →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;