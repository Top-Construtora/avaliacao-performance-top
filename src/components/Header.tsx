import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Calendar, 
  Menu,
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
  Activity,
  Briefcase,
  UserPlus,
  MessageSquare,
  FileCheck,
  GitBranch,
  UserCheck,
  PenTool,
  Grid3X3,
  X,
  Check,
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onMenuClick?: () => void;
}

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
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  borderColor: string;
  hoverBg: string;
  dotColor: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Configuração de tipos de notificação
  const notificationConfig: Record<NotificationType, NotificationConfigItem> = {
    promotion: {
      icon: TrendingUp,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      borderColor: 'border-primary-200',
      hoverBg: 'hover:bg-primary-50',
      dotColor: 'bg-primary-500'
    },
    position_change: {
      icon: Briefcase,
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
      borderColor: 'border-secondary-200',
      hoverBg: 'hover:bg-secondary-50',
      dotColor: 'bg-secondary-500'
    },
    self_assessment_complete: {
      icon: UserCheck,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      borderColor: 'border-primary-200',
      hoverBg: 'hover:bg-primary-50',
      dotColor: 'bg-primary-500'
    },
    leader_assessment_complete: {
      icon: CheckCircle,
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
      borderColor: 'border-secondary-200',
      hoverBg: 'hover:bg-secondary-50',
      dotColor: 'bg-secondary-500'
    },
    consensus_complete: {
      icon: Target,
      bgColor: 'bg-accent-50',
      iconColor: 'text-accent-600',
      borderColor: 'border-accent-200',
      hoverBg: 'hover:bg-accent-50',
      dotColor: 'bg-accent-500'
    },
    pdi_created: {
      icon: FileCheck,
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-700',
      borderColor: 'border-primary-300',
      hoverBg: 'hover:bg-primary-100',
      dotColor: 'bg-primary-600'
    },
    self_assessment_pending: {
      icon: Clock,
      bgColor: 'bg-accent-50',
      iconColor: 'text-accent-700',
      borderColor: 'border-accent-300',
      hoverBg: 'hover:bg-accent-100',
      dotColor: 'bg-accent-500'
    },
    consensus_pending: {
      icon: Calendar,
      bgColor: 'bg-secondary-100',
      iconColor: 'text-secondary-700',
      borderColor: 'border-secondary-300',
      hoverBg: 'hover:bg-secondary-100',
      dotColor: 'bg-secondary-600'
    },
    nine_box_updated: {
      icon: Grid3X3,
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-700',
      borderColor: 'border-primary-300',
      hoverBg: 'hover:bg-primary-100',
      dotColor: 'bg-primary-600'
    },
    feedback_received: {
      icon: MessageSquare,
      bgColor: 'bg-accent-100',
      iconColor: 'text-accent-700',
      borderColor: 'border-accent-300',
      hoverBg: 'hover:bg-accent-100',
      dotColor: 'bg-accent-600'
    }
  };

  // Dados de notificações de exemplo
  const sampleNotifications: Notification[] = [
    {
      id: 1,
      type: 'promotion',
      title: 'Nova Promoção',
      message: 'João Silva foi promovido para Analista Sênior',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      department: 'Tecnologia',
      actionUrl: '/nine-box'
    },
    {
      id: 3,
      type: 'consensus_complete',
      title: 'Consenso Finalizado',
      message: 'Carlos Mendes teve seu consenso finalizado - Aprovado para promoção',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      read: true,
      department: 'Financeiro',
      actionUrl: '/consensus'
    },
    {
      id: 4,
      type: 'pdi_created',
      title: 'PDI Criado',
      message: 'Fernanda Lima teve seu PDI criado',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      department: 'RH',
      actionUrl: '/action-plan'
    },
    {
      id: 5,
      type: 'leader_assessment_complete',
      title: 'Avaliação Concluída',
      message: 'Ana Costa teve sua avaliação do líder concluída - Nota: 3.5/4.0',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: false,
      department: 'Vendas',
      actionUrl: '/leader-evaluation'
    }
  ];

  useEffect(() => {
    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => !n.read).length);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função para formatar timestamp
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffInMillis = now.getTime() - timestamp.getTime();
    const diffInHours = Math.floor(diffInMillis / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMillis / (1000 * 60));
      return `há ${diffInMinutes} minutos`;
    } else if (diffInHours < 24) {
      return `há ${diffInHours} horas`;
    } else if (diffInHours < 48) {
      return 'ontem';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `há ${diffInDays} dias`;
    }
  };

  // Marcar notificação como lida
  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // Toggle expansão da notificação
  const toggleExpanded = (notificationId: number) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
    
    // Marcar como lida ao expandir
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      markAsRead(notificationId);
    }
  };

  // Limpar todas as notificações
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setExpandedNotifications(new Set());
    setIsNotificationOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={onMenuClick}
                className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 lg:hidden"
              >
                <Menu size={20} />
              </button>
              
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                  Sistema de Avaliação de Desempenho
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-500 capitalize truncate">
                    {currentDate}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Sistema de Notificações */}
              <div className="relative" ref={dropdownRef}>
                {/* Botão de Notificações */}
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 group"
                >
                  <Bell size={18} className="sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
                  
                  {/* Badge de contagem */}
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-accent-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                  
                  {/* Pulsação para novas notificações */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent-500 rounded-full animate-ping opacity-75" />
                  )}
                </button>

                {/* Dropdown de Notificações */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 mx-2 sm:mx-0 w-auto sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                    >
                      {/* Header */}
                      <div className="bg-gradient-to-r from-primary-50/70 to-secondary-50/70 px-3.5 py-2.5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-white rounded-lg shadow-sm">
                              <Bell size={14} className="text-primary-600" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-800">Notificações</h3>
                            {unreadCount > 0 && (
                              <span className="bg-accent-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium leading-none">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setIsNotificationOpen(false)}
                            className="p-1 hover:bg-white/80 rounded-lg transition-all duration-200 hover:shadow-sm"
                          >
                            <X size={14} className="text-gray-500" />
                          </button>
                        </div>
                        
                        {/* Ações rápidas compactas */}
                        {notifications.length > 0 && (
                          <div className="flex items-center justify-between mt-1.5">
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-1"
                              >
                                <Check size={10} />
                                Marcar tudo como lido
                              </button>
                            )}
                            <button
                              onClick={clearAllNotifications}
                              className="text-xs text-gray-500 hover:text-gray-600 font-medium transition-colors flex items-center gap-1"
                            >
                              <X size={10} />
                              Limpar tudo
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Lista de Notificações */}
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center">
                            <div className="inline-flex p-2.5 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 mb-3">
                              <Bell size={20} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Tudo em dia!</p>
                            <p className="text-gray-400 text-xs mt-1">Sem notificações no momento</p>
                          </div>
                        ) : (
                          <div className="py-1">
                            {notifications.map((notification, index) => {
                              const config = notificationConfig[notification.type];
                              const IconComponent = config.icon;
                              const isExpanded = expandedNotifications.has(notification.id);
                              const needsToExpand = notification.message.length > 60;
                              
                              return (
                                <motion.div
                                  key={notification.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                                                      className={`group relative mx-1 sm:mx-2 my-1 p-2.5 sm:p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                                    !notification.read 
                                      ? 'bg-gradient-to-r from-primary-50/40 to-transparent hover:from-primary-50/60' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => {
                                    if (needsToExpand) {
                                      toggleExpanded(notification.id);
                                    } else if (!notification.read) {
                                      markAsRead(notification.id);
                                    }
                                    // Aqui você pode adicionar navegação para notification.actionUrl
                                  }}
                                >
                                  <div className="flex gap-2.5 items-start">
                                    {/* Ícone compacto */}
                                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${config.bgColor} ${config.borderColor} border transition-transform group-hover:scale-110`}>
                                      <IconComponent className={`h-3.5 w-3.5 ${config.iconColor}`} />
                                    </div>
                                    
                                    {/* Conteúdo compacto */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          {/* Título e timestamp na mesma linha */}
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-semibold text-sm text-gray-900 truncate">
                                              {notification.title}
                                            </p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                              {formatTimestamp(notification.timestamp)}
                                            </span>
                                          </div>
                                          
                                          {/* Mensagem - expansível se necessário */}
                                          <p className={`text-xs text-gray-600 pr-2 transition-all duration-200 ${
                                            !isExpanded && needsToExpand ? 'line-clamp-1' : ''
                                          }`}>
                                            {notification.message}
                                          </p>
                                          
                                          {/* Departamento como badge pequeno */}
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                              !notification.read 
                                                ? 'bg-primary-100 text-primary-700' 
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                              {notification.department}
                                            </span>
                                            
                                            {/* Indicador de expansão */}
                                            {needsToExpand && (
                                              <span className="text-xs text-primary-600 font-medium">
                                                {isExpanded ? 'Ver menos' : 'Ver mais'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Indicador de não lida mais sutil */}
                                        {!notification.read && (
                                          <div className={`absolute right-3 top-3 h-1.5 w-1.5 rounded-full ${config.dotColor} animate-pulse`} />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                          <button 
                            onClick={() => {
                              setIsNotificationOpen(false);
                              navigate('/notifications');
                            }}
                            className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors flex items-center gap-1.5 group w-full justify-center py-1"
                          >
                            Ver histórico completo
                            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">Admin User</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-semibold shadow-md text-sm sm:text-base">
                  AU
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
};

export default Header;