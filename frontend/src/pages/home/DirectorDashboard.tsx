import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  BarChart3,
  FileText,
  Award,
  ArrowRight,
  Target,
  Briefcase,
  Building2,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const firstName = profile?.name?.split(' ')[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const quickActions = [
    {
      title: 'Avaliação do Líder',
      description: 'Avalie os líderes da sua organização',
      icon: Users,
      onClick: () => navigate('/leader-evaluation'),
    },
    {
      title: 'Consenso',
      description: 'Participe das reuniões de consenso',
      icon: Target,
      onClick: () => navigate('/consensus'),
    },
    {
      title: 'Comitê de Gente',
      description: 'Visualize a matriz 9-Box',
      icon: Award,
      onClick: () => navigate('/nine-box'),
    },
    {
      title: 'Relatórios',
      description: 'Acompanhe métricas e resultados',
      icon: BarChart3,
      onClick: () => navigate('/reports'),
    },
    {
      title: 'Gerenciar PDI',
      description: 'Acompanhe planos de desenvolvimento',
      icon: FileText,
      onClick: () => navigate('/pdi'),
    },
    {
      title: 'Meu PDI',
      description: 'Visualize seu plano de desenvolvimento',
      icon: Briefcase,
      onClick: () => navigate('/my-pdi'),
    },
    {
      title: 'Guia Nine Box',
      description: 'Entenda a metodologia 9-Box',
      icon: BookOpen,
      onClick: () => navigate('/nine-box-guide'),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 text-white shadow-md hover:shadow-lg transition-shadow duration-300"
        style={{ background: 'linear-gradient(to bottom right, #1e2938, #161f2a)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Olá, {firstName}!
            </h1>
            <p className="text-white/90 text-base sm:text-lg">
              Visão estratégica - Acompanhe o desempenho de toda a organização
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white/10 rounded-lg px-4 py-2">
            <Building2 className="h-5 w-5" />
            <span className="font-medium">Diretor</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer group transition-all duration-300"
              onClick={action.onClick}
            >
              <div className="flex items-start space-x-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'linear-gradient(to bottom right, #1e2938, #161f2a)' }}
                >
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-500 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default DirectorDashboard;
