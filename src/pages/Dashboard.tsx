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
      title: 'PDI',
      description: 'Plano de Desenvolvimento Individual',
      action: 'Criar plano',
      icon: FileText,
      color: 'bg-orange-500',
      bgColor: 'bg-white-50',
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
    </div>
  );
};

export default Dashboard;