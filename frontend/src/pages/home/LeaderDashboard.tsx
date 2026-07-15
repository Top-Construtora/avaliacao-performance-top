import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvaluation } from '../../hooks/useEvaluation';
import {
  Users,
  UserCheck,
  FileText,
  ArrowRight,
  ClipboardList,
  CheckCircle,
  Clock,
  User,
  Crown,
  Calendar,
  BarChart2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { evaluationService } from '../../services/evaluation.service';

const LeaderDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { displayCycle } = useEvaluation();
  const firstName = profile?.name?.split(' ')[0];

  const [myStatus, setMyStatus] = useState({
    selfEvaluation: 'pending' as string,
    leaderEvaluation: 'pending' as string,
    consensus: 'pending' as string,
    ppiDefined: false,
    selfScore: null as number | null,
    leaderScore: null as number | null,
    consensusScore: null as number | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id && displayCycle) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [profile?.id, displayCycle]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (displayCycle && profile?.id) {
        const dashboard = await evaluationService.getCycleDashboard(displayCycle.id);

        // Meu progresso pessoal
        const myData = dashboard.find((d: any) => String(d.employee_id) === String(profile.id));
        if (myData) {
          const normalizeStatus = (status: string | null | undefined): string => {
            if (!status) return 'pending';
            if (status === 'completed' || status === 'Completed' || status === 'COMPLETED')
              return 'completed';
            if (status === 'in-progress' || status === 'in_progress' || status === 'InProgress')
              return 'in-progress';
            return 'pending';
          };

          setMyStatus({
            selfEvaluation: normalizeStatus(myData.self_evaluation_status),
            leaderEvaluation: normalizeStatus(myData.leader_evaluation_status),
            consensus: normalizeStatus(myData.consensus_status),
            ppiDefined: !!myData.ninebox_position || myData.consensus_status === 'completed',
            selfScore: myData.self_evaluation_score ?? myData.self_score ?? null,
            leaderScore: myData.leader_evaluation_score ?? myData.leader_score ?? null,
            consensusScore: myData.consensus_score ?? myData.consensus_performance_score ?? null,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  const quickActions = [
    {
      id: 'avaliar-equipe',
      title: 'Avaliar Equipe',
      description: 'Realize a avaliação dos seus liderados',
      action: 'Avaliar',
      icon: UserCheck,
      onClick: () => navigate('/leader-evaluation'),
    },
    {
      id: 'autoavaliacao',
      title: 'Minha Autoavaliação',
      description: 'Complete sua própria autoavaliação',
      action: 'Iniciar',
      icon: ClipboardList,
      onClick: () => navigate('/self-evaluation'),
    },
    {
      id: 'gerenciar-pdi',
      title: 'Gerenciar PDI',
      description: 'Acompanhe os PDIs da sua equipe',
      action: 'Gerenciar',
      icon: FileText,
      onClick: () => navigate('/pdi'),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section — obsidian + assinatura lime (gio) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-[#1A1A1A] p-5 sm:p-8 text-white shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-[#D2FF00]" />
        <div className="flex items-center justify-between">
          <div className="pl-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-lemon-milk tracking-wide">
              Olá, {firstName}!
            </h1>
            <p className="text-white/60 text-base sm:text-lg">
              Acompanhe seu ciclo de avaliação e gerencie sua equipe
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
            <Users className="h-5 w-5 text-[#D2FF00]" />
            <span className="font-medium">Líder</span>
          </div>
        </div>
      </motion.div>

      {/* My Progress Card + Team Status Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Circular Progress Card - Meu Progresso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border"
        >
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center">
            <Calendar className="mr-2 text-lime-deep dark:text-lime" size={20} />
            Meu Progresso
            {displayCycle && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {displayCycle.title}
              </span>
            )}
          </h2>

          <div className="grid grid-cols-2 gap-3 xs:grid-cols-4">
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
                    className="text-secondary"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={
                      myStatus.selfEvaluation === 'completed'
                        ? undefined
                        : `${myStatus.selfEvaluation === 'in-progress' ? 50 : 0} 100`
                    }
                    strokeLinecap="round"
                    className={
                      myStatus.selfEvaluation === 'completed'
                        ? 'text-success'
                        : myStatus.selfEvaluation === 'in-progress'
                          ? 'text-lime-deep dark:text-lime'
                          : 'text-muted-foreground'
                    }
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {myStatus.selfEvaluation === 'completed' ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
                  ) : myStatus.selfEvaluation === 'in-progress' ? (
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-lime-deep dark:text-lime" />
                  ) : (
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-center font-medium text-foreground/80">
                Autoavaliação
              </span>
              <span
                className={`text-xs ${
                  myStatus.selfEvaluation === 'completed'
                    ? 'text-success'
                    : myStatus.selfEvaluation === 'in-progress'
                      ? 'text-lime-deep dark:text-lime'
                      : 'text-muted-foreground'
                }`}
              >
                {myStatus.selfEvaluation === 'completed'
                  ? myStatus.selfScore !== null
                    ? `Nota: ${myStatus.selfScore.toFixed(2)}`
                    : 'Feito'
                  : myStatus.selfEvaluation === 'in-progress'
                    ? 'Fazendo'
                    : 'Pendente'}
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
                    className="text-secondary"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={
                      myStatus.leaderEvaluation === 'completed'
                        ? undefined
                        : `${myStatus.leaderEvaluation === 'in-progress' ? 50 : 0} 100`
                    }
                    strokeLinecap="round"
                    className={
                      myStatus.leaderEvaluation === 'completed'
                        ? 'text-success'
                        : myStatus.leaderEvaluation === 'in-progress'
                          ? 'text-lime-deep dark:text-lime'
                          : 'text-muted-foreground'
                    }
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {myStatus.leaderEvaluation === 'completed' ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
                  ) : myStatus.leaderEvaluation === 'in-progress' ? (
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-lime-deep dark:text-lime" />
                  ) : (
                    <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-center font-medium text-foreground/80">
                Líder
              </span>
              <span
                className={`text-xs ${
                  myStatus.leaderEvaluation === 'completed'
                    ? 'text-success'
                    : myStatus.leaderEvaluation === 'in-progress'
                      ? 'text-lime-deep dark:text-lime'
                      : 'text-muted-foreground'
                }`}
              >
                {myStatus.leaderEvaluation === 'completed'
                  ? myStatus.leaderScore !== null
                    ? `Nota: ${myStatus.leaderScore.toFixed(2)}`
                    : 'Feito'
                  : myStatus.leaderEvaluation === 'in-progress'
                    ? 'Fazendo'
                    : 'Pendente'}
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
                    className="text-secondary"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={
                      myStatus.consensus === 'completed'
                        ? undefined
                        : `${myStatus.consensus === 'in-progress' ? 50 : 0} 100`
                    }
                    strokeLinecap="round"
                    className={
                      myStatus.consensus === 'completed'
                        ? 'text-success'
                        : myStatus.consensus === 'in-progress'
                          ? 'text-lime-deep dark:text-lime'
                          : 'text-muted-foreground'
                    }
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {myStatus.consensus === 'completed' ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
                  ) : myStatus.consensus === 'in-progress' ? (
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-lime-deep dark:text-lime" />
                  ) : (
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-center font-medium text-foreground/80">
                Consenso
              </span>
              <span
                className={`text-xs ${
                  myStatus.consensus === 'completed'
                    ? 'text-success'
                    : myStatus.consensus === 'in-progress'
                      ? 'text-lime-deep dark:text-lime'
                      : 'text-muted-foreground'
                }`}
              >
                {myStatus.consensus === 'completed'
                  ? myStatus.consensusScore !== null
                    ? `Nota: ${myStatus.consensusScore.toFixed(2)}`
                    : 'Feito'
                  : myStatus.consensus === 'in-progress'
                    ? 'Fazendo'
                    : 'Pendente'}
              </span>
            </div>

            {/* PDI */}
            <div
              className={`flex flex-col items-center ${myStatus.ppiDefined ? 'cursor-pointer' : ''}`}
              onClick={() => myStatus.ppiDefined && navigate('/my-pdi')}
            >
              <div className="relative">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-secondary"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={myStatus.ppiDefined ? undefined : '0 100'}
                    strokeLinecap="round"
                    className={myStatus.ppiDefined ? 'text-success' : 'text-muted-foreground'}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {myStatus.ppiDefined ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
                  ) : (
                    <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-center font-medium text-foreground/80">
                PDI
              </span>
              <span
                className={`text-xs ${myStatus.ppiDefined ? 'text-success hover:underline' : 'text-muted-foreground'}`}
              >
                {myStatus.ppiDefined ? 'Visualizar' : 'Pendente'}
              </span>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progresso geral</span>
              <span className="text-lg font-bold text-lime-deep dark:text-lime">
                {Math.round(
                  ([
                    myStatus.selfEvaluation === 'completed',
                    myStatus.leaderEvaluation === 'completed',
                    myStatus.consensus === 'completed',
                    myStatus.ppiDefined,
                  ].filter(Boolean).length /
                    4) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    ([
                      myStatus.selfEvaluation === 'completed',
                      myStatus.leaderEvaluation === 'completed',
                      myStatus.consensus === 'completed',
                      myStatus.ppiDefined,
                    ].filter(Boolean).length /
                      4) *
                    100
                  }%`,
                }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-2 rounded-full bg-lime"
              />
            </div>
          </div>
        </motion.div>

        {/* Minhas Notas Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border"
        >
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center">
            <BarChart2 className="mr-2 text-lime-deep dark:text-lime" size={20} />
            Minhas Notas
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Nota Autoavaliação */}
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 text-lime-deep dark:text-lime mr-2" />
                <span className="text-sm font-medium text-muted-foreground">Autoavaliação</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {myStatus.selfEvaluation === 'completed' && myStatus.selfScore !== null
                  ? myStatus.selfScore.toFixed(2)
                  : '-'}
              </div>
              <span
                className={`text-xs ${myStatus.selfEvaluation === 'completed' ? 'text-success' : 'text-muted-foreground'}`}
              >
                {myStatus.selfEvaluation === 'completed' ? 'Concluída' : 'Pendente'}
              </span>
            </div>

            {/* Nota Líder */}
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Crown className="h-4 w-4 text-lime-deep dark:text-lime mr-2" />
                <span className="text-sm font-medium text-muted-foreground">Líder</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {myStatus.leaderEvaluation === 'completed' && myStatus.leaderScore !== null
                  ? myStatus.leaderScore.toFixed(2)
                  : '-'}
              </div>
              <span
                className={`text-xs ${myStatus.leaderEvaluation === 'completed' ? 'text-success' : 'text-muted-foreground'}`}
              >
                {myStatus.leaderEvaluation === 'completed' ? 'Concluída' : 'Pendente'}
              </span>
            </div>

            {/* Nota Consenso */}
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-lime-deep dark:text-lime mr-2" />
                <span className="text-sm font-medium text-muted-foreground">Consenso</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {myStatus.consensus === 'completed' && myStatus.consensusScore !== null
                  ? myStatus.consensusScore.toFixed(2)
                  : '-'}
              </div>
              <span
                className={`text-xs ${myStatus.consensus === 'completed' ? 'text-success' : 'text-muted-foreground'}`}
              >
                {myStatus.consensus === 'completed' ? 'Concluído' : 'Pendente'}
              </span>
            </div>

            {/* PDI */}
            <div
              className={`bg-secondary rounded-xl p-4 ${myStatus.ppiDefined ? 'cursor-pointer hover:bg-accent transition-colors' : ''}`}
              onClick={() => myStatus.ppiDefined && navigate('/my-pdi')}
            >
              <div className="flex items-center mb-2">
                <FileText className="h-4 w-4 text-lime-deep dark:text-lime mr-2" />
                <span className="text-sm font-medium text-muted-foreground">PDI</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {myStatus.ppiDefined ? <CheckCircle className="h-7 w-7 text-success" /> : '-'}
              </div>
              <span
                className={`text-xs ${myStatus.ppiDefined ? 'text-success' : 'text-muted-foreground'}`}
              >
                {myStatus.ppiDefined ? 'Definido' : 'Pendente'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions - Same style as Admin */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {quickActions.map((card) => {
          const IconComponent = card.icon;
          return (
            <motion.div
              key={card.id}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="relative bg-card rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-lime/40 transition-all duration-300 cursor-pointer group overflow-hidden border border-border"
              onClick={card.onClick}
            >
              <div className="relative z-10">
                <div className="inline-flex p-2 sm:p-3 rounded-xl mb-3 sm:mb-4 bg-secondary text-foreground transition-colors group-hover:bg-lime group-hover:text-obsidian">
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 font-lemon-milk tracking-wide">
                  {card.title}
                </h3>

                <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base min-h-[40px] sm:min-h-[48px]">
                  {card.description}
                </p>

                <div className="inline-flex items-center text-sm font-semibold group-hover:gap-2 sm:group-hover:gap-3 transition-all duration-300 text-lime-deep dark:text-lime">
                  {card.action}
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default LeaderDashboard;
