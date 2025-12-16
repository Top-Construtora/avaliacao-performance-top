import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Users,
  FileText,
  BarChart3,
  Target,
  Award,
  ArrowRight,
  Building2
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

  const functionalityCards = [
    {
      id: 'autoavaliacao',
      title: 'Autoavaliação',
      description: 'Avalie suas competências e performance de forma reflexiva',
      action: 'Iniciar avaliação',
      icon: User,
      onClick: () => navigate('/self-evaluation'),
    },
    {
      id: 'avaliacao-lider',
      title: 'Avaliação do Líder',
      description: 'Avalie a performance dos seus avaliados',
      action: 'Avaliar equipe',
      icon: Users,
      onClick: () => navigate('/leader-evaluation'),
    },
    {
      id: 'consenso',
      title: 'Consenso',
      description: 'Defina as notas finais em reunião de consenso',
      action: 'Definir consenso',
      icon: Target,
      onClick: () => navigate('/consensus'),
    },
    {
      id: 'comite-gente',
      title: 'Comitê de Gente',
      description: 'Visualize o posicionamento na matriz de potencial',
      action: 'Ver matriz',
      icon: BarChart3,
      onClick: () => navigate('/nine-box'),
    },
    {
      id: 'plano-acao',
      title: 'PDI',
      description: 'Crie planos de desenvolvimento individual',
      action: 'Criar plano',
      icon: FileText,
      onClick: () => navigate('/pdi'),
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Acompanhe o progresso e resultados gerais',
      action: 'Ver relatórios',
      icon: Award,
      onClick: () => navigate('/reports'),
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
              Bem-vindo(a), {firstName}!
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
              className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-300 dark:border-gray-700"
              onClick={card.onClick}
            >
              {/* Background Gradient Decoration */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: 'linear-gradient(to bottom right, #1e2938, #161f2a)' }}
              />

              <div className="relative z-10">
                <div
                  className="inline-flex p-2 sm:p-3 rounded-xl shadow-md dark:shadow-lg mb-3 sm:mb-4"
                  style={{ background: 'linear-gradient(to bottom right, #1e2938, #161f2a)' }}
                >
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {card.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base min-h-[40px] sm:min-h-[48px]">
                  {card.description}
                </p>

                <div className="inline-flex items-center text-sm font-semibold group-hover:gap-2 sm:group-hover:gap-3 transition-all duration-300" style={{ color: '#1e2938' }}>
                  <span className="dark:text-gray-300">{card.action}</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1 dark:text-gray-300" />
                </div>
              </div>

              {/* Hover Effect Border */}
              <div
                className="absolute inset-0 rounded-lg border border-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  padding: '2px',
                  background: 'linear-gradient(to bottom right, #1e2938, #161f2a)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'exclude',
                  maskComposite: 'exclude'
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default DirectorDashboard;
