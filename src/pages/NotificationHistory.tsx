import React, { useState, useEffect } from 'react';
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
  Grid3X3,
  MessageSquare,
  ChevronDown,
  X,
  Check,
  Trash2,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  department: string;
  actionUrl: string;
}

type NotificationType = 
  | 'promotion'
  | 'position_change'
  | 'self_assessment_complete'
  | 'leader_assessment_complete'
  | 'consensus_complete'
  | 'pdi_created'
  | 'self_assessment_pending'
  | 'consensus_pending'
  | 'nine_box_updated'
  | 'feedback_received';

interface NotificationConfigItem {
  icon: any;
  bgColor: string;
  iconColor: string;
  borderColor: string;
  hoverBg: string;
  dotColor: string;
  label: string;
}

const NotificationHistory: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());

  // Configuração de tipos de notificação
  const notificationConfig: Record<NotificationType, NotificationConfigItem> = {
    promotion: {
      icon: TrendingUp,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      borderColor: 'border-primary-200',
      hoverBg: 'hover:bg-primary-50',
      dotColor: 'bg-primary-500',
      label: 'Promoção'
    },
    position_change: {
      icon: Briefcase,
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
      borderColor: 'border-secondary-200',
      hoverBg: 'hover:bg-secondary-50',
      dotColor: 'bg-secondary-500',
      label: 'Mudança de Cargo'
    },
    self_assessment_complete: {
      icon: UserCheck,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      borderColor: 'border-primary-200',
      hoverBg: 'hover:bg-primary-50',
      dotColor: 'bg-primary-500',
      label: 'Autoavaliação Completa'
    },
    leader_assessment_complete: {
      icon: CheckCircle,
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
      borderColor: 'border-secondary-200',
      hoverBg: 'hover:bg-secondary-50',
      dotColor: 'bg-secondary-500',
      label: 'Avaliação do Líder'
    },
    consensus_complete: {
      icon: Target,
      bgColor: 'bg-accent-50',
      iconColor: 'text-accent-600',
      borderColor: 'border-accent-200',
      hoverBg: 'hover:bg-accent-50',
      dotColor: 'bg-accent-500',
      label: 'Consenso Finalizado'
    },
    pdi_created: {
      icon: FileCheck,
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-700',
      borderColor: 'border-primary-300',
      hoverBg: 'hover:bg-primary-100',
      dotColor: 'bg-primary-600',
      label: 'PDI Criado'
    },
    self_assessment_pending: {
      icon: Clock,
      bgColor: 'bg-accent-50',
      iconColor: 'text-accent-700',
      borderColor: 'border-accent-300',
      hoverBg: 'hover:bg-accent-100',
      dotColor: 'bg-accent-500',
      label: 'Autoavaliação Pendente'
    },
    consensus_pending: {
      icon: Calendar,
      bgColor: 'bg-secondary-100',
      iconColor: 'text-secondary-700',
      borderColor: 'border-secondary-300',
      hoverBg: 'hover:bg-secondary-100',
      dotColor: 'bg-secondary-600',
      label: 'Consenso Pendente'
    },
    nine_box_updated: {
      icon: Grid3X3,
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-700',
      borderColor: 'border-primary-300',
      hoverBg: 'hover:bg-primary-100',
      dotColor: 'bg-primary-600',
      label: 'Matriz 9-Box Atualizada'
    },
    feedback_received: {
      icon: MessageSquare,
      bgColor: 'bg-accent-100',
      iconColor: 'text-accent-700',
      borderColor: 'border-accent-300',
      hoverBg: 'hover:bg-accent-100',
      dotColor: 'bg-accent-600',
      label: 'Feedback Recebido'
    }
  };

  // Dados expandidos de notificações
  const allNotifications: Notification[] = [
    // Notificações recentes (não lidas)
    {
      id: 1,
      type: 'promotion',
      title: 'Nova Promoção',
      message: 'João Silva foi promovido para Analista Sênior após excelente desempenho no último ciclo de avaliação',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      department: 'Tecnologia',
      actionUrl: '/nine-box'
    },
    {
      id: 3,
      type: 'leader_assessment_complete',
      title: 'Avaliação Concluída',
      message: 'Ana Costa teve sua avaliação do líder concluída - Nota final: 3.5/4.0. Desempenho excepcional reconhecido',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: false,
      department: 'Vendas',
      actionUrl: '/leader-evaluation'
    },
    // Notificações antigas (lidas)
    {
      id: 4,
      type: 'consensus_complete',
      title: 'Consenso Finalizado',
      message: 'Carlos Mendes teve seu consenso finalizado - Aprovado para promoção no próximo ciclo',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
      department: 'Financeiro',
      actionUrl: '/consensus'
    },
    {
      id: 5,
      type: 'pdi_created',
      title: 'PDI Criado',
      message: 'Fernanda Lima teve seu PDI criado com foco em desenvolvimento de liderança',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      department: 'RH',
      actionUrl: '/action-plan'
    },
    {
      id: 6,
      type: 'nine_box_updated',
      title: 'Reposicionamento 9-Box',
      message: 'Lucas Pereira foi reposicionado na matriz 9-box: Alto Potencial / Alto Desempenho',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
      department: 'Marketing',
      actionUrl: '/nine-box'
    },
    {
      id: 8,
      type: 'position_change',
      title: 'Mudança de Cargo',
      message: 'Maria Santos assumiu nova posição como Gerente de Projetos Estratégicos',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      read: true,
      department: 'Projetos',
      actionUrl: '/organization'
    },
    {
      id: 9,
      type: 'self_assessment_complete',
      title: 'Autoavaliação Completa',
      message: 'Pedro Oliveira completou sua autoavaliação dentro do prazo estabelecido',
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      read: true,
      department: 'Tecnologia',
      actionUrl: '/self-evaluation'
    },
    {
      id: 10,
      type: 'consensus_pending',
      title: 'Aguardando Consenso',
      message: 'Juliana Alves aguarda reunião de consenso agendada para próxima semana',
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      read: true,
      department: 'Operações',
      actionUrl: '/consensus'
    }
  ];

  useEffect(() => {
    setNotifications(allNotifications);
    setFilteredNotifications(allNotifications);
  }, []);

  // Filtrar notificações
  useEffect(() => {
    let filtered = [...notifications];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(notif => notif.type === selectedType);
    }

    // Filtro por período
    if (selectedPeriod !== 'all') {
      const now = new Date();
      filtered = filtered.filter(notif => {
        const diffInDays = Math.floor((now.getTime() - notif.timestamp.getTime()) / (1000 * 60 * 60 * 24));
        
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
  }, [searchTerm, selectedType, selectedPeriod, notifications]);

  // Formatar data completa
  const formatFullDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Marcar notificações selecionadas como lidas
  const markSelectedAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => 
        selectedNotifications.has(notif.id) ? { ...notif, read: true } : notif
      )
    );
    setSelectedNotifications(new Set());
  };

  // Deletar notificações selecionadas
  const deleteSelected = () => {
    setNotifications(prev => 
      prev.filter(notif => !selectedNotifications.has(notif.id))
    );
    setSelectedNotifications(new Set());
  };

  // Toggle seleção
  const toggleSelection = (id: number) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Selecionar todas
  const selectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                  <Bell size={24} className="text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Histórico de Notificações</h1>
                  <p className="text-sm text-gray-600">
                    {notifications.length} notificações • {unreadCount} não lidas
                  </p>
                </div>
              </div>
            </div>

            {/* Ações em massa */}
            {selectedNotifications.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">
                  {selectedNotifications.size} selecionada{selectedNotifications.size > 1 ? 's' : ''}
                </span>
                <button
                  onClick={markSelectedAsRead}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <Check size={16} />
                  Marcar como lidas
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Pesquisa */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Botão de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium text-gray-700"
          >
            <Filter size={18} />
            Filtros
            <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Painel de filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Filtro por tipo */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Notificação</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">Todas</option>
                      {Object.entries(notificationConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por período */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Período</label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value as 'all' | 'today' | 'week' | 'month')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">Todo período</option>
                      <option value="today">Hoje</option>
                      <option value="week">Última semana</option>
                      <option value="month">Último mês</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de notificações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header da tabela */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={selectAll}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Selecionar todas
              </span>
            </div>
          </div>

          {/* Lista */}
          <div className="divide-y divide-gray-200">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex p-3 rounded-full bg-gray-100 mb-3">
                  <Bell size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Nenhuma notificação encontrada</p>
                <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const config = notificationConfig[notification.type];
                const IconComponent = config.icon;
                const isSelected = selectedNotifications.has(notification.id);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-primary-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(notification.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                      />

                      {/* Ícone */}
                      <div className={`flex-shrink-0 p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                        <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                                  Nova
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                {notification.department}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatFullDate(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationHistory;