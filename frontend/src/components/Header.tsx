import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Crown,
  Briefcase,
  Menu,
  UserCheck,
  FileText,
  Target
} from 'lucide-react';
import { useAuth, useUserRole } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import type { Notification as NotificationType } from '../types/notification.types';

interface HeaderProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (value: boolean) => void;
}

export default function Header({ isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isDirector, isLeader, isAdmin } = useUserRole();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<{ [key: string]: boolean }>({});
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Configuração dos tipos de notificação com a paleta de cores NAUE
  const notificationTypeConfig = {
    success: {
      bgColor: 'bg-status-success-50 dark:bg-status-success-900/20',
      iconBg: 'bg-status-success-100 dark:bg-status-success-800/30',
      iconColor: 'text-status-success-600 dark:text-status-success-400',
      borderColor: 'border-status-success-200 dark:border-status-success-700',
      dotColor: 'bg-status-success-500'
    },
    info: {
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
      iconBg: 'bg-secondary-100 dark:bg-secondary-800/30',
      iconColor: 'text-secondary-600 dark:text-secondary-400',
      borderColor: 'border-secondary-200 dark:border-secondary-700',
      dotColor: 'bg-secondary-500'
    },
    warning: {
      bgColor: 'bg-status-warning-50 dark:bg-status-warning-900/20',
      iconBg: 'bg-status-warning-100 dark:bg-status-warning-800/30',
      iconColor: 'text-status-warning-600 dark:text-status-warning-400',
      borderColor: 'border-status-warning-200 dark:border-status-warning-700',
      dotColor: 'bg-status-warning-500'
    },
    alert: {
      bgColor: 'bg-status-danger-50 dark:bg-status-danger-900/20',
      iconBg: 'bg-status-danger-100 dark:bg-status-danger-800/30',
      iconColor: 'text-status-danger-600 dark:text-status-danger-400',
      borderColor: 'border-status-danger-200 dark:border-status-danger-700',
      dotColor: 'bg-status-danger-500'
    },
    achievement: {
      bgColor: 'bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20',
      iconBg: 'bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-800/30 dark:to-secondary-800/30',
      iconColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-200 dark:border-primary-700',
      dotColor: 'bg-gradient-to-r from-primary-500 to-secondary-500'
    }
  };

  // Ícone baseado na displayCategory
  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'alert': return AlertCircle;
      case 'achievement': return Target;
      default: return Bell;
    }
  };

  // Formatar tempo relativo
  const formatRelativeTime = (isoDate: string) => {
    const now = Date.now();
    const date = new Date(isoDate).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d atrás`;
    return new Date(isoDate).toLocaleDateString('pt-BR');
  };

  // Últimas 5 notificações para o dropdown
  const recentNotifications = notifications.slice(0, 5);

  // Effect para detectar clique fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
    }
  };

  const getRoleIcon = () => {
    if (isAdmin) return <Crown className="h-3 w-3 sm:h-4 sm:w-4" />;
    if (isDirector) return <Crown className="h-3 w-3 sm:h-4 sm:w-4" />;
    if (isLeader) return <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />;
    return <Users className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isDirector) return 'Diretor';
    if (isLeader) return 'Líder';
    return 'Colaborador';
  };

  const getRoleBadgeColor = () => {
    if (isAdmin) return 'bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600 shadow-sm';
    if (isDirector) return 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-yt-border';
    if (isLeader) return 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700';
    return 'bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 text-secondary-700 dark:text-secondary-300 border-secondary-200 dark:border-secondary-700';
  };

  const toggleNotificationExpanded = (id: string) => {
    setExpandedNotifications(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    if (notification.action_url) {
      setShowNotifications(false);
      navigate(notification.action_url);
    }
  };

  const getNotificationConfig = (category: string) => {
    return notificationTypeConfig[category as keyof typeof notificationTypeConfig] || notificationTypeConfig.info;
  };

  return (
    <header className="border-b border-white/10 sticky top-0 z-20" style={{background: 'linear-gradient(90deg, #1e6076 0%, #12b0a0 100%)'}}>
      <div className="flex items-center justify-between h-[77px] px-3 sm:px-4 md:px-6">
        {/* Lado esquerdo - Menu mobile */}
        <div className="flex items-center flex-shrink-0">
          {/* Botão menu mobile */}
          <button
            onClick={() => setIsMobileMenuOpen?.(!isMobileMenuOpen)}
            className="md:hidden p-1.5 sm:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex-shrink-0"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Centro - Título */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-base sm:text-lg md:text-xl font-semibold text-white truncate font-lemon-milk tracking-wider">
            <span className="hidden sm:inline">Sistema de Gente e Gestão</span>
            <span className="sm:hidden">Gente e Gestão</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/70 flex items-center">
            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="hidden md:inline">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="md:hidden">
              {new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </p>
        </div>

        {/* Lado direito - Notificações e usuário */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
          {/* Container de Notificações com posicionamento estático em mobile */}
          <div className="static sm:relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de notificações */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  {/* Overlay apenas em mobile */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="sm:hidden fixed inset-0 bg-black/20 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  
                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[72px] sm:top-auto sm:mt-2 w-auto sm:w-80 md:w-96 bg-white dark:bg-yt-surface rounded-2xl shadow-md border border-gray-300 dark:border-yt-border overflow-hidden z-50"
                    style={{ 
                      maxHeight: 'calc(100vh - 88px)',
                    }}
                  >
                  {/* Header do dropdown */}
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-700 dark:to-gray-700 border-b border-gray-100 dark:border-yt-border flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notificações</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-accent-100 dark:bg-accent-800/30 text-accent-700 dark:text-accent-300 rounded-full font-medium">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[11px] sm:text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5 transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de notificações */}
                  <div className="max-h-[calc(100vh-200px)] sm:max-h-96 overflow-y-auto custom-scrollbar">
                    {recentNotifications.length === 0 ? (
                      <div className="px-4 py-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-gray-50 dark:bg-yt-elevated mb-3">
                          <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Nenhuma notificação</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Você está em dia com tudo!</p>
                      </div>
                    ) : (
                      recentNotifications.map((notification) => {
                        const config = getNotificationConfig(notification.displayCategory);
                        const IconComponent = getNotificationIcon(notification.displayCategory);
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`relative transition-all duration-200 cursor-pointer ${
                              !notification.read ? config.bgColor : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            {!notification.read && (
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.dotColor}`} />
                            )}

                            <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-50 dark:border-yt-border last:border-0">
                              <div className="flex items-start space-x-2 sm:space-x-3">
                                <div className={`p-2 rounded-lg ${config.iconBg} flex-shrink-0 shadow-sm`}>
                                  <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center">
                                        <Clock className="h-3 w-3 mr-0.5" />
                                        {formatRelativeTime(notification.created_at)}
                                      </p>
                                    </div>

                                    {!notification.read && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead([notification.id]);
                                        }}
                                        className="text-[11px] text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium whitespace-nowrap hover:underline"
                                      >
                                        Marcar lida
                                      </button>
                                    )}
                                  </div>

                                  {notification.action_url && (
                                    <div className="mt-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleNotificationClick(notification);
                                        }}
                                        className="text-xs px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 transition-all duration-200 shadow-sm hover:shadow font-medium"
                                      >
                                        Ver detalhes
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer do dropdown */}
                  {recentNotifications.length > 0 && (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-yt-elevated border-t border-gray-100 dark:border-yt-border sticky bottom-0">
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/notifications');
                        }}
                        className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center justify-center w-full py-1.5 hover:underline"
                      >
                        Ver histórico completo
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      </button>
                    </div>
                  )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle - ADICIONADO AQUI */}
          <ThemeToggle />

          <div className="h-5 sm:h-6 w-px bg-white/10 hidden xs:block"></div>
    
          {/* Menu do usuário */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 p-1 sm:p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
              aria-label="Menu do usuário"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-white truncate max-w-[150px]">
                  {profile?.name || user?.email}
                </p>
                <div className="flex items-center justify-end space-x-1">
                  <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor()} flex items-center font-medium`}>
                    {getRoleIcon()}
                    <span className="ml-1">{getRoleLabel()}</span>
                  </span>
                </div>
              </div>
              <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0 shadow-md" style={{backgroundColor: '#1e6076'}}>
                {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </div>
              <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-white/70 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown do menu do usuário */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-yt-surface rounded-2xl shadow-md border border-gray-300 dark:border-yt-border overflow-hidden"
                >
                  {/* Mobile/Tablet: Mostrar informações do usuário */}
                  <div className="lg:hidden px-4 py-3 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-700 dark:to-gray-700 border-b border-gray-100 dark:border-yt-border">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {profile?.name || user?.email}
                    </p>
                    <div className="flex items-center mt-1.5 space-x-1">
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor()} flex items-center font-medium`}>
                        {getRoleIcon()}
                        <span className="ml-0.5 sm:ml-1">{getRoleLabel()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-900 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-all duration-200"
                    >
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Meu Perfil</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-900 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-all duration-200"
                    >
                      <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Configurações</span>
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-100 dark:border-yt-border py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Sair</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}