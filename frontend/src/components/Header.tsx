import { useRef, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import {
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Menu as MenuIcon,
} from 'lucide-react';
import { useAuth, useUserRole } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import type { Notification as NotificationType } from '../types/notification.types';

interface HeaderProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (value: boolean) => void;
}

// Mapa de rota → título da página (espelha o pageTitle do shell GIO).
const PAGE_TITLES: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: (p) => p === '/', title: 'Página Inicial' },
  { match: (p) => p.startsWith('/register/user'), title: 'Cadastrar Usuário' },
  { match: (p) => p.startsWith('/register/team'), title: 'Cadastrar Time' },
  { match: (p) => p.startsWith('/register/department'), title: 'Cadastrar Departamento' },
  { match: (p) => p.startsWith('/users'), title: 'Gerenciar Usuários' },
  { match: (p) => p.startsWith('/teams'), title: 'Gerenciar Times' },
  { match: (p) => p.startsWith('/departments'), title: 'Gerenciar Departamentos' },
  { match: (p) => p.startsWith('/salary'), title: 'Cargos e Salários' },
  { match: (p) => p.startsWith('/cycle'), title: 'Gerenciar Ciclos' },
  { match: (p) => p.startsWith('/codigo-cultural'), title: 'Código Cultural' },
  { match: (p) => p.startsWith('/self-evaluation'), title: 'Autoavaliação' },
  { match: (p) => p.startsWith('/leader-evaluation'), title: 'Avaliação do Líder' },
  { match: (p) => p.startsWith('/consensus'), title: 'Consenso' },
  { match: (p) => p.startsWith('/nine-box-guide'), title: 'Guia NineBox' },
  { match: (p) => p.startsWith('/nine-box'), title: 'Comitê de Gente' },
  { match: (p) => p.startsWith('/my-pdi'), title: 'Meu PDI' },
  { match: (p) => p.startsWith('/pdi-calendar'), title: 'Calendário PDI' },
  { match: (p) => p.startsWith('/pdi'), title: 'Gerenciar PDI' },
  { match: (p) => p.startsWith('/reports'), title: 'Relatórios' },
  { match: (p) => p.startsWith('/recruitment'), title: 'Recrutamento' },
  { match: (p) => p.startsWith('/interviews'), title: 'Onboard e Offboard' },
  { match: (p) => p.startsWith('/satisfaction'), title: 'Pesquisas' },
  { match: (p) => p.startsWith('/notifications'), title: 'Notificações' },
  { match: (p) => p.startsWith('/settings'), title: 'Configurações' },
  { match: (p) => p.startsWith('/help'), title: 'Ajuda' },
];

export default function Header({ isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const { isDirector, isLeader, isAdmin } = useUserRole();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pageTitle = PAGE_TITLES.find((t) => t.match(pathname))?.title || 'GIO';

  // Configuração dos tipos de notificação com a paleta de cores NAUE
  const notificationTypeConfig = {
    success: {
      bgColor: 'bg-status-success-50 dark:bg-status-success-900/20',
      iconBg: 'bg-status-success-100 dark:bg-status-success-800/30',
      iconColor: 'text-status-success-600 dark:text-status-success-400',
      borderColor: 'border-status-success-200 dark:border-status-success-700',
      dotColor: 'bg-status-success-500',
    },
    info: {
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
      iconBg: 'bg-secondary-100 dark:bg-secondary-800/30',
      iconColor: 'text-secondary-600 dark:text-secondary-400',
      borderColor: 'border-secondary-200 dark:border-secondary-700',
      dotColor: 'bg-secondary-500',
    },
    warning: {
      bgColor: 'bg-status-warning-50 dark:bg-status-warning-900/20',
      iconBg: 'bg-status-warning-100 dark:bg-status-warning-800/30',
      iconColor: 'text-status-warning-600 dark:text-status-warning-400',
      borderColor: 'border-status-warning-200 dark:border-status-warning-700',
      dotColor: 'bg-status-warning-500',
    },
    alert: {
      bgColor: 'bg-status-danger-50 dark:bg-status-danger-900/20',
      iconBg: 'bg-status-danger-100 dark:bg-status-danger-800/30',
      iconColor: 'text-status-danger-600 dark:text-status-danger-400',
      borderColor: 'border-status-danger-200 dark:border-status-danger-700',
      dotColor: 'bg-status-danger-500',
    },
    achievement: {
      bgColor:
        'bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20',
      iconBg:
        'bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-800/30 dark:to-secondary-800/30',
      iconColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-200 dark:border-primary-700',
      dotColor: 'bg-gradient-to-r from-primary-500 to-secondary-500',
    },
  };

  // Ícone baseado na displayCategory
  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertCircle;
      case 'alert':
        return AlertCircle;
      case 'achievement':
        return Target;
      default:
        return Bell;
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

  // Relógio — atualiza a cada minuto
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

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
    } catch {
      // falha no logout é ignorada — o usuário é redirecionado de qualquer forma
    }
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isDirector) return 'Diretor';
    if (isLeader) return 'Líder';
    return 'Colaborador';
  };

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
    return (
      notificationTypeConfig[category as keyof typeof notificationTypeConfig] ||
      notificationTypeConfig.info
    );
  };

  const inicial = (profile?.name || user?.email || 'U').charAt(0).toUpperCase();
  const dataFmt = format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR }).toUpperCase();
  const horaFmt = format(currentTime, 'HH:mm');

  // Botão-ícone padrão do header GIO: 36×36, rounded-6, bone → white no hover.
  const iconBtn =
    'w-9 h-9 rounded-[6px] grid place-items-center text-[#ECECEE] hover:bg-[#32323A] hover:text-white transition-colors relative';

  return (
    <header className="h-[60px] flex-shrink-0 flex items-center gap-2 px-4 md:px-[28px] relative z-20 bg-[#1A1A1A] border-b border-white/[0.08] font-gio">
      {/* Esquerda: hambúrguer (mobile) + título/subtítulo */}
      <button
        aria-label="abrir menu"
        onClick={() => setIsMobileMenuOpen?.(!isMobileMenuOpen)}
        className={`${iconBtn} md:hidden`}
      >
        <MenuIcon size={18} />
      </button>
      <div className="min-w-0 flex-none">
        <h1 className="text-[15.5px] font-semibold tracking-[-0.015em] leading-[1.2] text-white truncate">
          {pageTitle}
        </h1>
        <p className="text-[10.5px] font-medium tracking-[0.1em] uppercase text-[#8B8B95] truncate">
          GIO · Sistema de Gente &amp; Gestão
        </p>
      </div>

      {/* Centro: relógio (escondido abaixo de lg) */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-[10px] pointer-events-none whitespace-nowrap">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-[#8B8B95]">
          {dataFmt}
        </span>
        <span className="text-[13px] font-semibold text-white/[0.14]">·</span>
        <span
          className="text-[13px] font-semibold tracking-[0.04em] text-white"
          style={{ fontFeatureSettings: '"tnum","zero"' }}
        >
          {horaFmt}
        </span>
      </div>

      {/* Direita: ações */}
      <div className="ml-auto flex items-center gap-[6px]">
        {/* Notificações */}
        <div className="static sm:relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={iconBtn}
            aria-label="Notificações"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-[16px] bg-[#D2FF00] text-obsidian text-[10px] rounded-full flex items-center justify-center font-bold px-1">
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
                  className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[60px] sm:top-auto sm:mt-2 w-auto sm:w-80 md:w-96 bg-popover text-popover-foreground rounded-2xl shadow-md border border-border overflow-hidden z-50"
                  style={{ maxHeight: 'calc(100vh - 76px)' }}
                >
                  {/* Header do dropdown */}
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-secondary border-b border-border flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-lime-deep dark:text-lime" />
                      <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-lime/20 text-lime-deep dark:text-lime rounded-full font-medium">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] sm:text-xs text-lime-deep dark:text-lime hover:underline font-medium"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent rounded p-0.5 transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de notificações */}
                  <div className="max-h-[calc(100vh-200px)] sm:max-h-96 overflow-y-auto custom-scrollbar">
                    {recentNotifications.length === 0 ? (
                      <div className="px-4 py-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-secondary mb-3">
                          <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          Nenhuma notificação
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Você está em dia com tudo!
                        </p>
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
                              !notification.read ? config.bgColor : 'hover:bg-accent'
                            }`}
                          >
                            {!notification.read && (
                              <div
                                className={`absolute left-0 top-0 bottom-0 w-1 ${config.dotColor}`}
                              />
                            )}

                            <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-border last:border-0">
                              <div className="flex items-start space-x-2 sm:space-x-3">
                                <div
                                  className={`p-2 rounded-lg ${config.iconBg} flex-shrink-0 shadow-sm`}
                                >
                                  <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-foreground mb-0.5">
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-center">
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
                                        className="text-[11px] text-lime-deep dark:text-lime hover:underline font-medium whitespace-nowrap"
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
                                        className="text-xs px-3 py-1.5 bg-[#D2FF00] text-obsidian rounded-lg hover:bg-[#C2EE00] transition-all duration-200 shadow-sm hover:shadow font-semibold"
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
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-secondary border-t border-border sticky bottom-0">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/notifications');
                        }}
                        className="text-xs sm:text-sm text-lime-deep dark:text-lime hover:underline font-medium flex items-center justify-center w-full py-1.5"
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

        {/* Toggle claro/escuro */}
        <ThemeToggle />

        {/* Avatar / menu do usuário */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Perfil do Usuário"
            title="Perfil do Usuário"
            className="w-[34px] h-[34px] rounded-full grid place-items-center bg-gradient-to-br from-[#A9BE2E] to-[#D2FF00] text-obsidian font-bold text-[13px] transition-all ml-0.5 hover:scale-105 hover:shadow-[0_0_0_3px_rgba(210,255,0,.22)]"
          >
            {inicial}
          </button>

          {/* Dropdown do menu do usuário */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-[10px] min-w-[240px] bg-[#232327] text-white rounded-[10px] border border-white/[0.14] overflow-hidden font-gio"
                style={{ boxShadow: '0 32px 64px rgba(0,0,0,.6)' }}
              >
                {/* Cabeçalho do usuário */}
                <div className="px-3 py-[10px] flex items-center gap-[10px]">
                  <div className="w-[38px] h-[38px] rounded-full grid place-items-center bg-gradient-to-br from-[#A9BE2E] to-[#D2FF00] text-obsidian font-bold text-[14px]">
                    {inicial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-white truncate">
                      {profile?.name || user?.email}
                    </p>
                    <p className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#8B8B95] truncate">
                      {getRoleLabel()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/[0.08] my-[6px]" />

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full mx-0 px-3 py-2 text-left flex items-center gap-2 text-white hover:bg-[#2A2A2E] transition-colors"
                >
                  <User size={16} className="text-[#ECECEE]" />
                  <span className="text-[13px]">Meu Perfil</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-white hover:bg-[#2A2A2E] transition-colors"
                >
                  <Settings size={16} className="text-[#ECECEE]" />
                  <span className="text-[13px]">Configurações</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                >
                  <LogOut size={16} className="text-[#DC2626]" />
                  <span className="text-[13px]">Sair</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
