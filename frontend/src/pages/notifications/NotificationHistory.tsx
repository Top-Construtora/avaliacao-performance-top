import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Briefcase,
  UserCheck,
  CheckCircle,
  Target,
  FileCheck,
  Clock,
  MessageSquare,
  ChevronDown,
  Trash2,
  Archive,
  CheckSquare,
  Square,
  Eye,
  RefreshCw,
  AlertCircle,
  Award,
  Users,
  FileText,
  MoreVertical,
  ChevronRight,
  Sparkles,
  ClipboardList,
  UserPlus,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification, NotificationType } from '../../types/notification.types';

interface NotificationConfigItem {
  icon: any;
  bgColor: string;
  iconColor: string;
  borderColor: string;
  hoverBg: string;
  dotColor: string;
  label: string;
  gradient: string;
}

const NotificationHistory: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead,
    archiveNotifications: contextArchive,
    deleteNotifications: contextDelete,
  } = useNotifications();
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'all' | 'unread' | 'archived'>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // Animação variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  // Configuração de tipos de notificação
  const notificationConfig: Record<string, NotificationConfigItem> = {
    evaluation_cycle_opened: {
      icon: Bell,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Ciclo Aberto',
      gradient: 'from-lime to-lime',
    },
    evaluation_cycle_closed: {
      icon: CheckCircle,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Ciclo Encerrado',
      gradient: 'from-lime to-lime',
    },
    self_evaluation_pending: {
      icon: Clock,
      bgColor: 'bg-warning/10 border border-warning/20',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20',
      hoverBg: 'hover:bg-warning/20',
      dotColor: 'bg-warning',
      label: 'Autoavaliação Pendente',
      gradient: 'from-warning to-warning',
    },
    self_evaluation_completed: {
      icon: UserCheck,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Autoavaliação Concluída',
      gradient: 'from-lime to-lime',
    },
    leader_evaluation_completed: {
      icon: CheckCircle,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Avaliação do Líder',
      gradient: 'from-lime to-lime',
    },
    consensus_completed: {
      icon: Target,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Consenso Finalizado',
      gradient: 'from-lime to-lime',
    },
    pdi_created: {
      icon: FileCheck,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'PDI Criado',
      gradient: 'from-lime to-lime',
    },
    pdi_updated: {
      icon: FileText,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'PDI Atualizado',
      gradient: 'from-lime to-lime',
    },
    pdi_deadline_approaching: {
      icon: AlertCircle,
      bgColor: 'bg-warning/10 border border-warning/20',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20',
      hoverBg: 'hover:bg-warning/20',
      dotColor: 'bg-warning',
      label: 'Prazo PDI',
      gradient: 'from-warning to-warning',
    },
    career_progression_approved: {
      icon: TrendingUp,
      bgColor: 'bg-success/10 border border-success/20',
      iconColor: 'text-success',
      borderColor: 'border-success/20',
      hoverBg: 'hover:bg-success/20',
      dotColor: 'bg-success',
      label: 'Progressão Aprovada',
      gradient: 'from-success to-success',
    },
    career_track_assigned: {
      icon: Briefcase,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Trilha Atribuída',
      gradient: 'from-lime to-lime',
    },
    job_opening_created: {
      icon: Briefcase,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Nova Vaga',
      gradient: 'from-lime to-lime',
    },
    candidate_registered: {
      icon: UserPlus,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Novo Candidato',
      gradient: 'from-lime to-lime',
    },
    interview_scheduled: {
      icon: Calendar,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Entrevista Agendada',
      gradient: 'from-lime to-lime',
    },
    candidate_hired: {
      icon: Award,
      bgColor: 'bg-success/10 border border-success/20',
      iconColor: 'text-success',
      borderColor: 'border-success/20',
      hoverBg: 'hover:bg-success/20',
      dotColor: 'bg-success',
      label: 'Candidato Contratado',
      gradient: 'from-success to-success',
    },
    interview_90day_scheduled: {
      icon: ClipboardList,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Entrevista 90 dias',
      gradient: 'from-lime to-lime',
    },
    interview_exit_scheduled: {
      icon: LogOutIcon,
      bgColor: 'bg-warning/10 border border-warning/20',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20',
      hoverBg: 'hover:bg-warning/20',
      dotColor: 'bg-warning',
      label: 'Entrevista de Desligamento',
      gradient: 'from-warning to-warning',
    },
    interview_completed: {
      icon: CheckCircle,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Entrevista Concluída',
      gradient: 'from-lime to-lime',
    },
    survey_available: {
      icon: MessageSquare,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Nova Pesquisa',
      gradient: 'from-lime to-lime',
    },
    survey_deadline_approaching: {
      icon: AlertCircle,
      bgColor: 'bg-warning/10 border border-warning/20',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20',
      hoverBg: 'hover:bg-warning/20',
      dotColor: 'bg-warning',
      label: 'Prazo da Pesquisa',
      gradient: 'from-warning to-warning',
    },
    survey_closed: {
      icon: CheckCircle,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Pesquisa Encerrada',
      gradient: 'from-lime to-lime',
    },
    team_member_added: {
      icon: Users,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Novo Membro',
      gradient: 'from-lime to-lime',
    },
    team_member_moved: {
      icon: Users,
      bgColor: 'bg-lime/20',
      iconColor: 'text-lime-deep dark:text-lime',
      borderColor: 'border-lime/20',
      hoverBg: 'hover:bg-lime/10',
      dotColor: 'bg-lime',
      label: 'Mudança de Equipe',
      gradient: 'from-lime to-lime',
    },
  };

  // Fallback config para tipos desconhecidos
  const getConfig = (type: string): NotificationConfigItem => {
    return (
      notificationConfig[type] || {
        icon: Bell,
        bgColor: 'bg-secondary',
        iconColor: 'text-foreground',
        borderColor: 'border-border',
        hoverBg: 'hover:bg-accent',
        dotColor: 'bg-muted-foreground',
        label: type,
        gradient: 'from-secondary to-secondary',
      }
    );
  };

  // Buscar notificações ao mudar viewMode
  useEffect(() => {
    fetchNotifications({ filter: viewMode });
  }, [viewMode, fetchNotifications]);

  // Filtrar notificações localmente (busca, tipo, período)
  useEffect(() => {
    let filtered = [...notifications];

    if (viewMode === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    } else if (viewMode === 'archived') {
      filtered = filtered.filter((n) => n.archived);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (notif) =>
          notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notif.message.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((notif) => notif.type === selectedType);
    }

    if (selectedPeriod !== 'all') {
      const now = new Date();
      filtered = filtered.filter((notif) => {
        const diffInDays = Math.floor(
          (now.getTime() - new Date(notif.created_at).getTime()) / (1000 * 60 * 60 * 24),
        );
        switch (selectedPeriod) {
          case 'today':
            return diffInDays === 0;
          case 'week':
            return diffInDays <= 7;
          case 'month':
            return diffInDays <= 30;
          default:
            return true;
        }
      });
    }

    setFilteredNotifications(filtered);
  }, [searchTerm, selectedType, selectedPeriod, notifications, viewMode]);

  // Formatar data
  const formatDate = (isoDate: string): string => {
    const now = new Date();
    const date = new Date(isoDate);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Agora' : `${diffInMinutes} min atrás`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  };

  // Ações usando o contexto
  const markSelectedAsRead = async () => {
    const ids = Array.from(selectedNotifications);
    await contextMarkAsRead(ids);
    setSelectedNotifications(new Set());
    toast.success(`${ids.length} notificações marcadas como lidas`);
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedNotifications);
    await contextDelete(ids);
    setSelectedNotifications(new Set());
    toast.success(`${ids.length} notificações excluídas`);
  };

  const deleteNotification = async (notification: Notification) => {
    await contextDelete([notification.id]);
    setShowActionMenu(null);
    toast.success('Notificação excluída');
  };

  const archiveSelected = async () => {
    const ids = Array.from(selectedNotifications);
    await contextArchive(ids);
    setSelectedNotifications(new Set());
    toast.success(`${ids.length} notificações arquivadas`);
  };

  const toggleSelection = (id: string) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const markAsRead = async (id: string) => {
    await contextMarkAsRead([id]);
  };

  const markAllAsRead = async () => {
    await contextMarkAllAsRead();
    toast.success('Todas as notificações foram marcadas como lidas');
  };

  // Estatísticas
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    today: notifications.filter((n) => {
      const today = new Date();
      return new Date(n.created_at).toDateString() === today.toDateString();
    }).length,
    highPriority: notifications.filter((n) => n.priority === 'high' && !n.read).length,
  };

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="bg-card rounded-2xl shadow-sm border border-border p-4 sm:p-8"
      >
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-accent rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center font-lemon-milk tracking-wide">
                <div className="p-2 sm:p-3 rounded-xl bg-lime mr-3">
                  <Bell className="h-4 w-4 sm:h-6 sm:w-6 text-obsidian" />
                </div>
                Notificações
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Acompanhe todas as atualizações do sistema
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center bg-secondary rounded-lg px-4 py-2">
              <div className="p-2 bg-card rounded-lg mr-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">{stats.total}</p>
              </div>
            </div>

            {stats.unread > 0 && (
              <div className="flex items-center bg-lime/20 rounded-lg px-4 py-2 border border-lime/20">
                <div className="p-2 bg-card rounded-lg mr-3">
                  <Eye className="h-4 w-4 text-lime-deep dark:text-lime" />
                </div>
                <div>
                  <p className="text-xs text-lime-deep dark:text-lime">Não lidas</p>
                  <p className="text-lg font-bold text-lime-deep dark:text-lime">{stats.unread}</p>
                </div>
              </div>
            )}

            {stats.highPriority > 0 && (
              <div className="flex items-center bg-lime/20 rounded-lg px-4 py-2 border border-lime/20">
                <div className="p-2 bg-card rounded-lg mr-3">
                  <AlertCircle className="h-4 w-4 text-lime-deep dark:text-lime" />
                </div>
                <div>
                  <p className="text-xs text-lime-deep dark:text-lime">Urgentes</p>
                  <p className="text-lg font-bold text-lime-deep dark:text-lime">
                    {stats.highPriority}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters and Actions */}
      <motion.div
        variants={itemVariants}
        className="bg-card rounded-2xl shadow-sm border border-border p-4 sm:p-6"
      >
        {/* View Mode Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex p-1.5 bg-secondary backdrop-blur-sm rounded-xl">
            {[
              { id: 'all' as const, label: 'Todas', count: stats.total },
              { id: 'unread' as const, label: 'Não lidas', count: stats.unread },
              { id: 'archived' as const, label: 'Arquivadas', count: 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${
                  viewMode === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md ${
                    viewMode === tab.id
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
                icon={<CheckCircle size={16} />}
              >
                Marcar todas como lidas
              </Button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00] focus:bg-background transition-all"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all ${
              showFilters
                ? 'border-[#D2FF00] bg-lime/20 text-lime-deep dark:text-lime'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                {/* Filter by Type */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Tipo de Notificação
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
                    className="w-full px-3 py-2 border border-border bg-secondary text-foreground rounded-lg focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00] focus:bg-background"
                  >
                    <option value="all">Todos os tipos</option>
                    {Object.entries(notificationConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Period */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Período
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) =>
                      setSelectedPeriod(e.target.value as 'all' | 'today' | 'week' | 'month')
                    }
                    className="w-full px-3 py-2 border border-border bg-secondary text-foreground rounded-lg focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00] focus:bg-background"
                  >
                    <option value="all">Todo período</option>
                    <option value="today">Hoje</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mês</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 p-4 bg-lime/20 rounded-lg border border-lime/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 text-sm font-medium text-lime-deep dark:text-lime hover:opacity-80"
                >
                  {selectedNotifications.size === filteredNotifications.length ? (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Desmarcar todas
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      Selecionar todas
                    </>
                  )}
                </button>
                <span className="text-sm text-lime-deep dark:text-lime">
                  {selectedNotifications.size} selecionada
                  {selectedNotifications.size > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markSelectedAsRead}
                  icon={<Eye size={16} />}
                  className="border-lime/40 text-lime-deep dark:text-lime hover:bg-lime/10"
                >
                  Marcar como lidas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={archiveSelected}
                  icon={<Archive size={16} />}
                  className="border-lime/40 text-lime-deep dark:text-lime hover:bg-lime/10"
                >
                  Arquivar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelected}
                  icon={<Trash2 size={16} />}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Notifications List */}
      <motion.div variants={itemVariants} className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-secondary rounded-full">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma notificação encontrada
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedType !== 'all' || selectedPeriod !== 'all'
                ? 'Tente ajustar os filtros ou termos de busca'
                : 'Você está em dia com todas as atualizações'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => {
              const config = getConfig(notification.type);
              const IconComponent = config.icon;

              return (
                <motion.div
                  key={notification.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -100 }}
                  custom={index}
                  whileHover={{ scale: 1.01 }}
                  className={`bg-card rounded-xl shadow-sm border ${
                    notification.read ? 'border-border' : 'border-lime/40'
                  } p-4 sm:p-6 transition-all cursor-pointer relative overflow-hidden group`}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    if (notification.action_url) navigate(notification.action_url);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(notification.id);
                      }}
                      className="mt-1"
                    >
                      {selectedNotifications.has(notification.id) ? (
                        <CheckSquare className="h-5 w-5 text-lime-deep dark:text-lime" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`p-3 rounded-xl ${config.bgColor} flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3
                          className={`font-semibold ${
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {notification.title}
                          {!notification.read && (
                            <span
                              className={`inline-block w-2 h-2 ${config.dotColor} rounded-full ml-2`}
                            />
                          )}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(notification.created_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowActionMenu(
                                showActionMenu === notification.id ? null : notification.id,
                              );
                            }}
                            className="p-1 hover:bg-accent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>

                      <p
                        className={`text-sm mb-3 ${
                          notification.read ? 'text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-md ${config.bgColor} ${config.iconColor} font-medium`}
                        >
                          {config.label}
                        </span>
                        {notification.priority === 'high' && (
                          <span className="flex items-center px-3 py-1 rounded-md bg-warning/10 text-warning border border-warning/20 font-medium">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Urgente
                          </span>
                        )}
                        {notification.metadata?.score && (
                          <span className="text-muted-foreground flex items-center">
                            <Award className="h-3 w-3 mr-1" />
                            Nota: {notification.metadata.score}/4.0
                          </span>
                        )}
                        {notification.metadata?.aggregate_count &&
                          notification.metadata.aggregate_count > 1 && (
                            <span className="text-muted-foreground flex items-center">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {notification.metadata.aggregate_count}x
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>

                  {/* Action Menu */}
                  <AnimatePresence>
                    {showActionMenu === notification.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-12 right-4 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border py-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            markAsRead(notification.id);
                            setShowActionMenu(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                        >
                          <Eye className="h-4 w-4" />
                          Marcar como lida
                        </button>
                        <button
                          onClick={async () => {
                            await contextArchive([notification.id]);
                            setShowActionMenu(null);
                            toast.success('Notificação arquivada');
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                        >
                          <Archive className="h-4 w-4" />
                          Arquivar
                        </button>
                        <button
                          onClick={() => deleteNotification(notification)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime"></div>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationHistory;
