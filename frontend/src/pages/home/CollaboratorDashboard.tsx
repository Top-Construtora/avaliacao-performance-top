import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvaluation } from '../../hooks/useEvaluation';
import {
  User,
  FileText,
  ArrowRight,
  HelpCircle,
  CheckCircle,
  Clock,
  Users,
  Crown,
  Lightbulb,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { evaluationService } from '../../services/evaluation.service';

const CollaboratorDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { currentCycle } = useEvaluation();
  const firstName = profile?.name?.split(' ')[0];

  const [myStatus, setMyStatus] = useState({
    selfEvaluation: 'pending',
    leaderEvaluation: 'pending',
    consensus: 'pending',
    ppiDefined: false
  });
  const [loading, setLoading] = useState(true);

  // Frases motivacionais
  const motivationalQuotes = [
    { quote: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
    { quote: "Feedback é o café da manhã dos campeões.", author: "Ken Blanchard" },
    { quote: "Conhecer a si mesmo é o começo de toda sabedoria.", author: "Aristóteles" },
    { quote: "O único modo de fazer um excelente trabalho é amar o que você faz.", author: "Steve Jobs" },
    { quote: "Crescimento e conforto não coexistem.", author: "Ginni Rometty" },
    { quote: "O talento vence jogos, mas só o trabalho em equipe ganha campeonatos.", author: "Michael Jordan" },
    { quote: "A excelência não é um ato, mas um hábito.", author: "Aristóteles" },
    { quote: "O progresso é impossível sem mudança.", author: "George Bernard Shaw" },
    { quote: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
    { quote: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
    { quote: "O único lugar onde o sucesso vem antes do trabalho é no dicionário.", author: "Vidal Sassoon" },
    { quote: "O insucesso é apenas uma oportunidade para recomeçar com mais inteligência.", author: "Henry Ford" },
    { quote: "A única maneira de fazer um ótimo trabalho é amar o que você faz.", author: "Steve Jobs" },
    { quote: "O segredo de progredir é começar.", author: "Mark Twain" },
  ];

  const [quote] = useState(() =>
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  useEffect(() => {
    if (profile?.id && currentCycle) {
      loadMyStatus();
    } else {
      setLoading(false);
    }
  }, [profile?.id, currentCycle]);

  const loadMyStatus = async () => {
    try {
      setLoading(true);
      if (currentCycle) {
        const dashboard = await evaluationService.getCycleDashboard(currentCycle.id);
        const myData = dashboard.find((d: any) => String(d.employee_id) === String(profile!.id));

        if (myData) {
          // Normalizar status para o formato esperado
          const normalizeStatus = (status: string | null | undefined): string => {
            if (!status) return 'pending';
            // Aceitar variações de "completed"
            if (status === 'completed' || status === 'Completed' || status === 'COMPLETED') return 'completed';
            if (status === 'in-progress' || status === 'in_progress' || status === 'InProgress') return 'in-progress';
            if (status === 'n/a' || status === 'N/A') return 'n/a';
            return status;
          };

          setMyStatus({
            selfEvaluation: normalizeStatus(myData.self_evaluation_status),
            leaderEvaluation: normalizeStatus(myData.leader_evaluation_status),
            consensus: normalizeStatus(myData.consensus_status),
            ppiDefined: !!myData.ninebox_position || myData.consensus_status === 'completed'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoading(false);
    }
  };

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
      title: 'Minha Autoavaliação',
      description: 'Complete sua autoavaliação de desempenho',
      action: 'Iniciar avaliação',
      icon: User,
      onClick: () => navigate('/self-evaluation'),
    },
    {
      title: 'Meu PDI',
      description: 'Visualize seu plano de desenvolvimento individual',
      action: 'Ver plano',
      icon: FileText,
      onClick: () => navigate('/my-pdi'),
    },
    {
      title: 'Ajuda',
      description: 'Tire suas dúvidas sobre o processo de avaliação',
      action: 'Acessar ajuda',
      icon: HelpCircle,
      onClick: () => navigate('/help'),
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
              Acompanhe seu ciclo de avaliação e desenvolvimento
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white/10 rounded-lg px-4 py-2">
            <User className="h-5 w-5" />
            <span className="font-medium">Colaborador</span>
          </div>
        </div>
      </motion.div>

      {/* Progress Card + Motivational Quote */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Circular Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <Calendar className="mr-2 text-primary-500" size={20} />
            Meu Progresso
            {currentCycle && (
              <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
                {currentCycle.title}
              </span>
            )}
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {/* Autoavaliação */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={myStatus.selfEvaluation === 'completed' ? undefined : `${myStatus.selfEvaluation === 'in-progress' ? 50 : 0} 100`}
                    strokeLinecap="round"
                    className={
                      myStatus.selfEvaluation === 'completed'
                        ? 'text-emerald-600'
                        : myStatus.selfEvaluation === 'in-progress'
                        ? 'text-blue-500'
                        : 'text-gray-300'
                    }
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {myStatus.selfEvaluation === 'completed' ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                  ) : myStatus.selfEvaluation === 'in-progress' ? (
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
                  ) : (
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                Autoavaliação
              </span>
              <span className={`text-xs ${
                myStatus.selfEvaluation === 'completed'
                  ? 'text-emerald-600'
                  : myStatus.selfEvaluation === 'in-progress'
                  ? 'text-blue-500'
                  : 'text-gray-400'
              }`}>
                {myStatus.selfEvaluation === 'completed' ? 'Feito' : myStatus.selfEvaluation === 'in-progress' ? 'Fazendo' : 'Pendente'}
              </span>
            </div>

            {/* Avaliação do Líder */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={myStatus.leaderEvaluation === 'completed' ? undefined : `${myStatus.leaderEvaluation === 'in-progress' ? 50 : 0} 100`}
                    strokeLinecap="round"
                    className={
                      myStatus.leaderEvaluation === 'completed'
                        ? 'text-emerald-600'
                        : myStatus.leaderEvaluation === 'in-progress'
                        ? 'text-blue-500'
                        : 'text-gray-300'
                    }
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {myStatus.leaderEvaluation === 'completed' ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                  ) : myStatus.leaderEvaluation === 'in-progress' ? (
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
                  ) : (
                    <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                Líder
              </span>
              <span className={`text-xs ${
                myStatus.leaderEvaluation === 'completed'
                  ? 'text-emerald-600'
                  : myStatus.leaderEvaluation === 'in-progress'
                  ? 'text-blue-500'
                  : 'text-gray-400'
              }`}>
                {myStatus.leaderEvaluation === 'completed' ? 'Feito' : myStatus.leaderEvaluation === 'in-progress' ? 'Fazendo' : 'Pendente'}
              </span>
            </div>

            {/* Consenso */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={myStatus.consensus === 'completed' ? undefined : `${myStatus.consensus === 'in-progress' ? 50 : 0} 100`}
                    strokeLinecap="round"
                    className={
                      myStatus.consensus === 'completed'
                        ? 'text-emerald-600'
                        : myStatus.consensus === 'in-progress'
                        ? 'text-blue-500'
                        : 'text-gray-300'
                    }
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {myStatus.consensus === 'completed' ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                  ) : myStatus.consensus === 'in-progress' ? (
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
                  ) : (
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                Consenso
              </span>
              <span className={`text-xs ${
                myStatus.consensus === 'completed'
                  ? 'text-emerald-600'
                  : myStatus.consensus === 'in-progress'
                  ? 'text-blue-500'
                  : 'text-gray-400'
              }`}>
                {myStatus.consensus === 'completed' ? 'Feito' : myStatus.consensus === 'in-progress' ? 'Fazendo' : 'Pendente'}
              </span>
            </div>

            {/* PDI */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={myStatus.ppiDefined ? undefined : "0 100"}
                    strokeLinecap="round"
                    className={myStatus.ppiDefined ? 'text-emerald-600' : 'text-gray-300'}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {myStatus.ppiDefined ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                  ) : (
                    <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                PDI
              </span>
              <span className={`text-xs ${myStatus.ppiDefined ? 'text-emerald-600' : 'text-gray-400'}`}>
                {myStatus.ppiDefined ? 'Definido' : 'Pendente'}
              </span>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Progresso geral</span>
              <span className="text-lg font-bold text-primary-500">
                {Math.round(
                  ([
                    myStatus.selfEvaluation === 'completed',
                    myStatus.leaderEvaluation === 'completed',
                    myStatus.consensus === 'completed',
                    myStatus.ppiDefined
                  ].filter(Boolean).length / 4) * 100
                )}%
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.round(
                    ([
                      myStatus.selfEvaluation === 'completed',
                      myStatus.leaderEvaluation === 'completed',
                      myStatus.consensus === 'completed',
                      myStatus.ppiDefined
                    ].filter(Boolean).length / 4) * 100
                  )}%`
                }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Motivational Quote Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl p-6 shadow-sm border border-primary-200 dark:border-primary-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary-500 rounded-lg">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <h2 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Inspiração do Dia
              </h2>
            </div>
            <blockquote className="text-lg sm:text-xl text-gray-700 dark:text-gray-200 italic leading-relaxed">
              "{quote.quote}"
            </blockquote>
          </div>
          <p className="text-right text-sm text-gray-600 dark:text-gray-400 mt-4 font-medium">
            — {quote.author}
          </p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
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
              className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-300 dark:border-gray-700"
              onClick={action.onClick}
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
                  {action.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base min-h-[40px] sm:min-h-[48px]">
                  {action.description}
                </p>

                <div className="inline-flex items-center text-sm font-semibold group-hover:gap-2 sm:group-hover:gap-3 transition-all duration-300" style={{ color: '#1e2938' }}>
                  <span className="dark:text-gray-300">{action.action}</span>
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

export default CollaboratorDashboard;
