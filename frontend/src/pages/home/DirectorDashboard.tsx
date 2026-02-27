import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useUsers } from '../../context/UserContext';
import {
  Users,
  UserCheck,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Building2,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { evaluationService } from '../../services/evaluation.service';

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { currentCycle } = useEvaluation();
  const { users } = useUsers();
  const firstName = profile?.name?.split(' ')[0];

  const [teamStatus, setTeamStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id && currentCycle) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [profile?.id, currentCycle, users]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (currentCycle && profile?.id) {
        const dashboard = await evaluationService.getCycleDashboard(currentCycle.id);

        const normalizeStatus = (status: string | null | undefined): string => {
          if (!status) return 'pending';
          if (status === 'completed' || status === 'Completed' || status === 'COMPLETED') return 'completed';
          if (status === 'in-progress' || status === 'in_progress' || status === 'InProgress') return 'in-progress';
          return 'pending';
        };

        // Status dos liderados
        const subordinates = users.filter(u => u.reports_to === profile.id && u.active);
        const teamData = subordinates.map(subordinate => {
          const evalData = dashboard.find((d: any) => String(d.employee_id) === String(subordinate.id));

          return {
            id: subordinate.id,
            name: subordinate.name,
            position: subordinate.position,
            leaderEvaluation: normalizeStatus(evalData?.leader_evaluation_status),
          };
        });

        setTeamStatus(teamData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Avaliado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" />
            Pendente
          </span>
        );
    }
  };

  // Calcular estatísticas
  const totalSubordinates = teamStatus.length;
  const completedLeaderEvaluations = teamStatus.filter(t => t.leaderEvaluation === 'completed').length;
  const pendingLeaderEvaluations = totalSubordinates - completedLeaderEvaluations;

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
      id: 'avaliar-equipe',
      title: 'Avaliar Equipe',
      description: 'Realize a avaliação dos seus liderados',
      action: 'Avaliar',
      icon: UserCheck,
      onClick: () => navigate('/leader-evaluation'),
    },
    {
      id: 'gerenciar-pdi',
      title: 'Gerenciar PDI',
      description: 'Acompanhe os PDIs da sua equipe',
      action: 'Gerenciar',
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
        style={{ background: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-lemon-milk tracking-wide">
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

      {/* Team Status Card - Meus Liderados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Users className="mr-2 text-primary-500" size={20} />
            Meus Liderados
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className="text-xl font-bold text-emerald-600">{completedLeaderEvaluations}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Avaliados</span>
            </div>
            <div className="text-center">
              <span className="text-xl font-bold text-amber-500">{pendingLeaderEvaluations}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Pendentes</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : teamStatus.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum liderado encontrado</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {teamStatus.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.position}</p>
                </div>
                {getStatusBadge(member.leaderEvaluation)}
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {totalSubordinates > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avaliações concluídas</span>
              <span className="text-sm font-bold text-emerald-600">
                {completedLeaderEvaluations}/{totalSubordinates}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedLeaderEvaluations / totalSubordinates) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-2 rounded-full bg-emerald-500"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
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
              className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-300 dark:border-gray-700"
              onClick={card.onClick}
            >
              {/* Background Gradient Decoration */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)' }}
              />

              <div className="relative z-10">
                <div
                  className="inline-flex p-2 sm:p-3 rounded-xl shadow-md dark:shadow-lg mb-3 sm:mb-4"
                  style={{ background: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)' }}
                >
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 font-lemon-milk tracking-wide">
                  {card.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base min-h-[40px] sm:min-h-[48px]">
                  {card.description}
                </p>

                <div className="inline-flex items-center text-sm font-semibold group-hover:gap-2 sm:group-hover:gap-3 transition-all duration-300" style={{ color: '#12b0a0' }}>
                  <span className="dark:text-[#12b0a0]">{card.action}</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1 dark:text-[#12b0a0]" />
                </div>
              </div>

              {/* Hover Effect Border */}
              <div
                className="absolute inset-0 rounded-lg border border-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  padding: '2px',
                  background: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)',
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
