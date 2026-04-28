import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  ArrowRight,
  Settings,
  RotateCcw,
  Briefcase,
  SmilePlus,
  AlertCircle,
  Handshake,
  Grid3X3,
  PieChart,
  ClipboardList,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { evaluationService } from '../../services/evaluation.service';
import { recruitmentService } from '../../services/recruitment.service';
import { satisfactionService } from '../../services/satisfaction.service';
import { interviewService } from '../../services/interview.service';
import { userService } from '../../services/user.service';

interface DashboardData {
  cycle: { title: string | null; completionPct: number | null } | null;
  activeUsers: number | null;
  openJobs: number | null;
  activeSurveys: number | null;
  pendencias: {
    consensos: number;
    vagasParadas: number;
    entrevistasAtrasadas: number;
    pesquisasExpirando: number;
  };
}

const initialData: DashboardData = {
  cycle: null,
  activeUsers: null,
  openJobs: null,
  activeSurveys: null,
  pendencias: { consensos: 0, vagasParadas: 0, entrevistasAtrasadas: 0, pesquisasExpirando: 0 },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const firstName = profile?.name?.split(' ')[0];
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const now = Date.now();
      const DAYS_14 = 14 * 24 * 60 * 60 * 1000;
      const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

      const [cycleRes, usersRes, jobsRes, surveysRes, ninetyRes, exitRes] = await Promise.allSettled([
        evaluationService.getCurrentCycle(),
        userService.getUsers({ active: true }),
        recruitmentService.getJobOpenings({ status: 'open' }),
        satisfactionService.getSurveys('active'),
        interviewService.getInterviews({ type: 'ninety_days', status: 'scheduled' }),
        interviewService.getInterviews({ type: 'exit', status: 'scheduled' }),
      ]);

      const cycle = cycleRes.status === 'fulfilled' ? cycleRes.value : null;
      let cycleData: DashboardData['cycle'] = null;
      let consensosPendentes = 0;

      if (cycle?.id) {
        try {
          const dashboard = await evaluationService.getCycleDashboard(cycle.id);
          const total = dashboard.length;
          const finalizados = dashboard.filter(d => d.consensus_status === 'completed').length;
          const pct = total > 0 ? Math.round((finalizados / total) * 100) : 0;
          consensosPendentes = total - finalizados;
          cycleData = { title: cycle.title, completionPct: pct };
        } catch {
          cycleData = { title: cycle.title, completionPct: null };
        }
      }

      const openJobs = jobsRes.status === 'fulfilled' ? jobsRes.value : [];
      const vagasParadas = openJobs.filter(j => {
        const opened = j.opened_at ? new Date(j.opened_at).getTime() : null;
        return opened && now - opened > DAYS_14;
      }).length;

      const surveys = surveysRes.status === 'fulfilled' ? surveysRes.value : [];
      const pesquisasExpirando = surveys.filter(s => {
        if (!s.end_date) return false;
        const end = new Date(s.end_date).getTime();
        return end - now > 0 && end - now < DAYS_7;
      }).length;

      const ninetyInterviews = ninetyRes.status === 'fulfilled' ? ninetyRes.value : [];
      const exitInterviews = exitRes.status === 'fulfilled' ? exitRes.value : [];
      const entrevistasAtrasadas = [...ninetyInterviews, ...exitInterviews].filter(i => {
        if (!i.scheduled_date) return false;
        return new Date(i.scheduled_date).getTime() < now;
      }).length;

      if (cancelled) return;
      setData({
        cycle: cycleData,
        activeUsers: usersRes.status === 'fulfilled' ? usersRes.value.length : null,
        openJobs: openJobs.length,
        activeSurveys: surveys.length,
        pendencias: {
          consensos: consensosPendentes,
          vagasParadas,
          entrevistasAtrasadas,
          pesquisasExpirando,
        },
      });
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const totalPendencias =
    data.pendencias.consensos +
    data.pendencias.vagasParadas +
    data.pendencias.entrevistasAtrasadas +
    data.pendencias.pesquisasExpirando;

  const kpis = [
    {
      icon: RotateCcw,
      label: 'Ciclo Ativo',
      value: data.cycle?.completionPct != null ? `${data.cycle.completionPct}%` : (data.cycle ? '—' : 'Nenhum'),
      sub: data.cycle?.title ?? 'Crie um ciclo',
      onClick: () => navigate('/cycle'),
    },
    {
      icon: Users,
      label: 'Colaboradores',
      value: data.activeUsers ?? '—',
      sub: 'ativos',
      onClick: () => navigate('/users'),
    },
    {
      icon: Briefcase,
      label: 'Vagas',
      value: data.openJobs ?? '—',
      sub: 'em aberto',
      onClick: () => navigate('/recruitment'),
    },
    {
      icon: SmilePlus,
      label: 'Pesquisas',
      value: data.activeSurveys ?? '—',
      sub: 'em andamento',
      onClick: () => navigate('/satisfaction'),
    },
    {
      icon: AlertCircle,
      label: 'Pendências',
      value: totalPendencias,
      sub: totalPendencias === 0 ? 'tudo em dia' : 'requerem atenção',
      onClick: () => {
        const el = document.getElementById('pendencias-section');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      highlight: totalPendencias > 0,
    },
  ];

  const pendenciasItems = [
    {
      visible: data.pendencias.consensos > 0,
      icon: Handshake,
      count: data.pendencias.consensos,
      label: data.pendencias.consensos === 1 ? 'consenso aguardando' : 'consensos aguardando',
      cta: 'Definir',
      onClick: () => navigate('/consensus'),
    },
    {
      visible: data.pendencias.vagasParadas > 0,
      icon: Briefcase,
      count: data.pendencias.vagasParadas,
      label: data.pendencias.vagasParadas === 1 ? 'vaga parada >14d' : 'vagas paradas >14d',
      cta: 'Ver',
      onClick: () => navigate('/recruitment'),
    },
    {
      visible: data.pendencias.entrevistasAtrasadas > 0,
      icon: ClipboardList,
      count: data.pendencias.entrevistasAtrasadas,
      label: data.pendencias.entrevistasAtrasadas === 1 ? 'entrevista atrasada' : 'entrevistas atrasadas',
      cta: 'Reagendar',
      onClick: () => navigate('/interviews'),
    },
    {
      visible: data.pendencias.pesquisasExpirando > 0,
      icon: Clock,
      count: data.pendencias.pesquisasExpirando,
      label: data.pendencias.pesquisasExpirando === 1 ? 'pesquisa encerrando' : 'pesquisas encerrando',
      cta: 'Ver',
      onClick: () => navigate('/satisfaction'),
    },
  ].filter(p => p.visible);

  const sections: Array<{
    title: string;
    cards: Array<{ icon: any; title: string; action: string; path: string }>;
  }> = [
    {
      title: 'Avaliação de Desempenho',
      cards: [
        { icon: Users, title: 'Avaliação do Líder', action: 'Ver', path: '/leader-evaluation' },
        { icon: Handshake, title: 'Consenso', action: 'Definir', path: '/consensus' },
        { icon: Grid3X3, title: 'Comitê de Gente', action: 'Ver matriz', path: '/nine-box' },
        { icon: BookOpen, title: 'PDI', action: 'Gerenciar', path: '/pdi' },
        { icon: PieChart, title: 'Relatórios', action: 'Ver', path: '/reports' },
        { icon: Award, title: 'Código Cultural', action: 'Configurar', path: '/codigo-cultural' },
      ],
    },
    {
      title: 'Recrutamento e Engajamento',
      cards: [
        { icon: Briefcase, title: 'Vagas', action: 'Ver vagas', path: '/recruitment' },
        { icon: ClipboardList, title: 'Onboard e Offboard', action: 'Ver entrevistas', path: '/interviews' },
        { icon: SmilePlus, title: 'Pesquisas', action: 'Ver pesquisas', path: '/satisfaction' },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120 } },
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Welcome banner — compact */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white shadow-md transition-shadow duration-300"
        style={{ background: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold font-lemon-milk tracking-wide truncate">
              Bem-vindo(a), {firstName}!
            </h1>
            <p className="text-white/85 text-xs sm:text-sm mt-0.5">
              Visão geral do Sistema de Gente & Gestão
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white/15 rounded-lg px-3 py-1.5 flex-shrink-0">
            <Settings className="h-4 w-4" />
            <span className="font-medium text-sm">Administrador</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Strip — horizontal layout, compact */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.button
              key={kpi.label}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              onClick={kpi.onClick}
              className={`relative text-left bg-white dark:bg-yt-surface rounded-xl p-3 sm:p-3.5 border transition-all duration-300 shadow-sm hover:shadow-md group overflow-hidden
                ${kpi.highlight
                  ? 'border-status-warning-300 dark:border-status-warning-700'
                  : 'border-gray-300 dark:border-yt-border'}`}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)' }}
              />
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className="flex-shrink-0 inline-flex p-2 rounded-lg shadow-sm"
                  style={{
                    background: kpi.highlight
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)',
                  }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xl sm:text-2xl font-bold font-lemon-milk tracking-wide leading-none
                    ${kpi.highlight && totalPendencias > 0
                      ? 'text-status-warning-600 dark:text-status-warning-400'
                      : 'text-gray-900 dark:text-gray-100'}`}>
                    {loading ? '…' : kpi.value}
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1 truncate">
                    {kpi.label}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {kpi.sub}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Pendências — só renderiza se houver, em formato denso */}
      {pendenciasItems.length > 0 && (
        <motion.section
          id="pendencias-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-yt-surface rounded-xl border border-status-warning-200 dark:border-status-warning-800/50 shadow-sm overflow-hidden"
        >
          <div className="px-4 sm:px-5 py-2.5 border-b border-status-warning-100 dark:border-status-warning-900/30 bg-gradient-to-r from-status-warning-50/70 to-amber-50/50 dark:from-status-warning-900/10 dark:to-amber-900/5 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-status-warning-600 dark:text-status-warning-400 flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">
              Ações Necessárias
            </h2>
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              · {totalPendencias} {totalPendencias === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-yt-border">
            {pendenciasItems.map((p, idx) => {
              const Icon = p.icon;
              return (
                <li key={idx}>
                  <button
                    onClick={p.onClick}
                    className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-yt-elevated transition-colors duration-200 text-left group"
                  >
                    <Icon className="h-4 w-4 text-status-warning-600 dark:text-status-warning-400 flex-shrink-0" />
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100 font-lemon-milk leading-none">
                      {p.count}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                      {p.label}
                    </span>
                    <span className="hidden sm:inline-flex items-center text-xs font-semibold whitespace-nowrap" style={{ color: '#12b0a0' }}>
                      <span className="dark:text-[#12b0a0]">{p.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1 dark:text-[#12b0a0]" />
                    </span>
                    <ArrowRight className="sm:hidden h-3.5 w-3.5 text-gray-400 transition-transform group-hover:translate-x-1" />
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      {/* Tudo em dia — inline, compacto */}
      {!loading && pendenciasItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-yt-surface rounded-xl border border-status-success-200 dark:border-status-success-800/50 shadow-sm px-4 sm:px-5 py-2.5 flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4 text-status-success-600 dark:text-status-success-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Tudo em dia
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            · sem pendências críticas
          </span>
        </motion.div>
      )}

      {/* Atalhos — densos */}
      {sections.map((section, sectionIdx) => (
        <motion.section
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + sectionIdx * 0.05 }}
          className="space-y-2.5"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {section.title}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-yt-border to-transparent" />
          </div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {section.cards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.title}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  className="relative bg-white dark:bg-yt-surface rounded-xl p-3 sm:p-3.5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-300 dark:border-yt-border text-left"
                  onClick={() => navigate(card.path)}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)' }}
                  />
                  <div className="relative z-10 flex flex-col gap-2">
                    <div
                      className="inline-flex p-1.5 rounded-lg shadow-sm w-fit"
                      style={{ background: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)' }}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 font-lemon-milk tracking-wide leading-tight">
                      {card.title}
                    </h3>
                    <div className="inline-flex items-center text-[11px] font-semibold transition-all duration-300" style={{ color: '#12b0a0' }}>
                      <span className="dark:text-[#12b0a0]">{card.action}</span>
                      <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5 dark:text-[#12b0a0]" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.section>
      ))}
    </div>
  );
};

export default AdminDashboard;
