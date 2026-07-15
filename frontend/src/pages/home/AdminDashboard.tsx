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

      const [cycleRes, usersRes, jobsRes, surveysRes, ninetyRes, exitRes] =
        await Promise.allSettled([
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
          const finalizados = dashboard.filter((d) => d.consensus_status === 'completed').length;
          const pct = total > 0 ? Math.round((finalizados / total) * 100) : 0;
          // Um consenso só está "aguardando" quando auto e líder já concluíram
          // e o consenso ainda não foi feito. Contar total - finalizados incluía
          // todo o headcount (inclusive quem nem começou e diretores 'n/a').
          consensosPendentes = dashboard.filter(
            (d) =>
              d.self_evaluation_status === 'completed' &&
              d.leader_evaluation_status === 'completed' &&
              d.consensus_status !== 'completed' &&
              d.consensus_status !== 'n/a',
          ).length;
          cycleData = { title: cycle.title, completionPct: pct };
        } catch {
          cycleData = { title: cycle.title, completionPct: null };
        }
      }

      const openJobs = jobsRes.status === 'fulfilled' ? jobsRes.value : [];
      const vagasParadas = openJobs.filter((j) => {
        const opened = j.opened_at ? new Date(j.opened_at).getTime() : null;
        return opened && now - opened > DAYS_14;
      }).length;

      const surveys = surveysRes.status === 'fulfilled' ? surveysRes.value : [];
      const pesquisasExpirando = surveys.filter((s) => {
        if (!s.end_date) return false;
        const end = new Date(s.end_date).getTime();
        return end - now > 0 && end - now < DAYS_7;
      }).length;

      const ninetyInterviews = ninetyRes.status === 'fulfilled' ? ninetyRes.value : [];
      const exitInterviews = exitRes.status === 'fulfilled' ? exitRes.value : [];
      const entrevistasAtrasadas = [...ninetyInterviews, ...exitInterviews].filter((i) => {
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
    return () => {
      cancelled = true;
    };
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
      value:
        data.cycle?.completionPct != null
          ? `${data.cycle.completionPct}%`
          : data.cycle
            ? '—'
            : 'Nenhum',
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
      label:
        data.pendencias.entrevistasAtrasadas === 1
          ? 'entrevista atrasada'
          : 'entrevistas atrasadas',
      cta: 'Reagendar',
      onClick: () => navigate('/interviews'),
    },
    {
      visible: data.pendencias.pesquisasExpirando > 0,
      icon: Clock,
      count: data.pendencias.pesquisasExpirando,
      label:
        data.pendencias.pesquisasExpirando === 1 ? 'pesquisa encerrando' : 'pesquisas encerrando',
      cta: 'Ver',
      onClick: () => navigate('/satisfaction'),
    },
  ].filter((p) => p.visible);

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
        {
          icon: ClipboardList,
          title: 'Onboard e Offboard',
          action: 'Ver entrevistas',
          path: '/interviews',
        },
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
      {/* Welcome banner — obsidian + assinatura lime (gio) */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-[#1A1A1A] px-5 sm:px-6 py-4 sm:py-5 text-white shadow-md transition-shadow duration-300"
      >
        {/* Barra de destaque lime na borda esquerda */}
        <div className="absolute inset-y-0 left-0 w-1 bg-[#D2FF00]" />
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 pl-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold font-lemon-milk tracking-wide truncate">
              Bem-vindo(a), {firstName}!
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-0.5">
              Visão geral do Sistema de Gente & Gestão
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 flex-shrink-0">
            <Settings className="h-4 w-4 text-[#D2FF00]" />
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
              className={`relative text-left bg-card rounded-xl p-3 sm:p-3.5 border transition-all duration-300 shadow-sm hover:shadow-md hover:border-lime/40 group overflow-hidden
                ${kpi.highlight ? 'border-warning/50' : 'border-border'}`}
            >
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className={`flex-shrink-0 inline-flex p-2 rounded-lg transition-colors
                    ${
                      kpi.highlight
                        ? 'bg-warning/15 text-warning'
                        : 'bg-secondary text-foreground group-hover:bg-lime group-hover:text-obsidian'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xl sm:text-2xl font-bold font-lemon-milk tracking-wide leading-none
                    ${kpi.highlight && totalPendencias > 0 ? 'text-warning' : 'text-foreground'}`}
                  >
                    {loading ? '…' : kpi.value}
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold text-foreground/80 mt-1 truncate">
                    {kpi.label}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                    {kpi.sub}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Pendências — card acolhedor, só renderiza se houver */}
      {pendenciasItems.length > 0 && (
        <motion.section
          id="pendencias-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-warning/25 shadow-sm overflow-hidden"
        >
          <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-warning/10 to-transparent flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-warning/15 text-warning flex-shrink-0">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground leading-tight">
                Precisa da sua atenção
              </h2>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                {totalPendencias}{' '}
                {totalPendencias === 1 ? 'item aguardando você' : 'itens aguardando você'}
              </p>
            </div>
          </div>
          <ul className="p-2 space-y-1">
            {pendenciasItems.map((p, idx) => {
              const Icon = p.icon;
              return (
                <li key={idx}>
                  <button
                    onClick={p.onClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-warning/5 transition-colors duration-200 text-left group"
                  >
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-warning/10 text-warning flex-shrink-0 transition-colors group-hover:bg-warning/20">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm leading-snug truncate">
                      <span className="font-bold text-warning">{p.count}</span>{' '}
                      <span className="font-medium text-foreground">{p.label}</span>
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-lime-deep dark:text-lime rounded-full px-3 py-1.5 bg-lime/10 group-hover:bg-lime/20 transition-colors">
                      {p.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <ArrowRight className="sm:hidden h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-1" />
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      {/* Tudo em dia — acolhedor */}
      {!loading && pendenciasItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-success/25 shadow-sm px-4 sm:px-5 py-3.5 flex items-center gap-3"
        >
          <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-success/15 text-success flex-shrink-0">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <span className="block text-sm font-bold text-foreground leading-tight">
              Tudo em dia 🎉
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Nenhuma pendência crítica por aqui
            </span>
          </div>
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
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
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
                  className="relative bg-card rounded-xl p-3 sm:p-3.5 shadow-sm hover:shadow-md hover:border-lime/40 transition-all duration-300 cursor-pointer group overflow-hidden border border-border text-left"
                  onClick={() => navigate(card.path)}
                >
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="inline-flex p-1.5 rounded-lg w-fit bg-secondary text-foreground transition-colors group-hover:bg-lime group-hover:text-obsidian">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground font-lemon-milk tracking-wide leading-tight">
                      {card.title}
                    </h3>
                    <div className="inline-flex items-center text-[11px] font-semibold transition-all duration-300 text-lime-deep dark:text-lime">
                      {card.action}
                      <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
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
