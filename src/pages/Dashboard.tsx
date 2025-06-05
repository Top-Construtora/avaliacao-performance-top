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
  Award,
  ArrowRight,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const navigate = useNavigate();
  const { stats } = useEvaluation();
  
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
      description: 'Avalie suas competências e desempenho de forma reflexiva',
      action: 'Iniciar avaliação',
      icon: User,
      gradient: 'from-primary-500 to-primary-600',
      shadowColor: 'shadow-primary-500/20',
      onClick: () => navigate('/self-evaluation'),
    },
    {
      id: 'avaliacao-lider',
      title: 'Avaliação do Líder',
      description: 'Avalie o desempenho dos seus colaboradores',
      action: 'Avaliar equipe',
      icon: Users,
      gradient: 'from-secondary-500 to-secondary-600',
      shadowColor: 'shadow-secondary-500/20',
      onClick: () => navigate('/leader-evaluation'),
    },
    {
      id: 'consenso',
      title: 'Consenso',
      description: 'Defina as notas finais em reunião de consenso',
      action: 'Definir consenso',
      icon: Target,
      gradient: 'from-accent-500 to-accent-600',
      shadowColor: 'shadow-accent-500/20',
      onClick: () => navigate('/consensus'),
    },
    {
      id: 'matriz-9box',
      title: 'Matriz 9-Box',
      description: 'Visualize o posicionamento na matriz de potencial',
      action: 'Ver matriz',
      icon: BarChart3,
      gradient: 'from-primary-600 to-secondary-600',
      shadowColor: 'shadow-primary-500/20',
      onClick: () => navigate('/nine-box'),
    },
    {
      id: 'plano-acao',
      title: 'PDI',
      description: 'Crie planos de desenvolvimento individual',
      action: 'Criar plano',
      icon: FileText,
      gradient: 'from-secondary-600 to-accent-600',
      shadowColor: 'shadow-secondary-500/20',
      onClick: () => navigate('/action-plan'),
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Acompanhe o progresso e resultados gerais',
      action: 'Ver relatórios',
      icon: Award,
      gradient: 'from-accent-600 to-primary-600',
      shadowColor: 'shadow-accent-500/20',
      onClick: () => navigate('/reports'),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-xl"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bem-vinda, Lais!</h1>
        <p className="text-primary-100 text-base sm:text-lg">
          Gerencie e acompanhe todas as avaliações de desempenho em um só lugar
        </p>
      </motion.div>

      {/* Functionality Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
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
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`relative bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl ${card.shadowColor} transition-all duration-300 cursor-pointer group overflow-hidden`}
              onClick={card.onClick}
            >
              {/* Background Gradient Decoration */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`inline-flex p-2 sm:p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-md mb-3 sm:mb-4`}>
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                  {card.title}
                </h3>
                
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base min-h-[40px] sm:min-h-[48px]">
                  {card.description}
                </p>
                
                <div className={`inline-flex items-center text-sm font-semibold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent group-hover:gap-2 sm:group-hover:gap-3 transition-all duration-300`}>
                  <span>{card.action}</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary-500 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
              
              {/* Hover Effect Border */}
              <div className={`absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} style={{ padding: '2px', background: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))`, WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'exclude', maskComposite: 'exclude' }} />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Dashboard;