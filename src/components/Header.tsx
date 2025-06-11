import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  User,
  Inbox,
  Settings,
  LogOut,
  HelpCircle,
  Crown,
  Calendar,
  Briefcase,
  Users,
  Check,
  ChevronRight,
  X,
  AlertCircle,
  FileText,
  TrendingUp,
  Clock,
  Trash2,
} from 'lucide-react';
import { useAuth, useUserRole } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isDirector, isLeader, role } = useUserRole();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Record<number, boolean>>({});
  
  // Refs para detectar clique fora
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Mock de notificações com mais detalhes
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'evaluation',
      icon: FileText,
      color: 'text-secondary-600 bg-secondary-100',
      title: 'Nova avaliação pendente', 
      description: 'Você tem uma nova avaliação de desempenho para completar referente ao Q4 2024.',
      fullText: 'Você tem uma nova avaliação de desempenho para completar referente ao Q4 2024. O prazo para conclusão é até 15/12/2024. Acesse a seção de avaliações para iniciar.',
      time: '5 min atrás', 
      read: false,
      actions: ['Ver Avaliação']
    },
    { 
      id: 2, 
      type: 'deadline',
      icon: Clock,
      color: 'text-primary-600 bg-primary-100',
      title: 'Prazo de avaliação se aproximando', 
      description: 'Faltam apenas 3 dias para finalizar a avaliação de Maria Silva.',
      fullText: 'Faltam apenas 3 dias para finalizar a avaliação de Maria Silva. Certifique-se de completar todas as competências e adicionar comentários construtivos antes do prazo final.',
      time: '1 hora atrás', 
      read: false,
      actions: ['Continuar Avaliação', 'Adiar']
    },
    { 
      id: 3, 
      type: 'feedback',
      icon: TrendingUp,
      color: 'text-accent-600 bg-accent-100',
      title: 'Feedback recebido', 
      description: 'João Santos adicionou um feedback sobre seu desempenho.',
      fullText: 'João Santos adicionou um feedback sobre seu desempenho no projeto Alpha. O feedback foi positivo e destaca suas habilidades de liderança e comunicação.',
      time: '2 horas atrás', 
      read: true,
      actions: ['Ver Feedback']
    },
    { 
      id: 4, 
      type: 'alert',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100',
      title: 'Ação necessária', 
      description: 'Existem 2 avaliações aguardando sua aprovação.',
      fullText: 'Existem 2 avaliações aguardando sua aprovação como líder. Os colaboradores Pedro Oliveira e Ana Costa já finalizaram suas autoavaliações.',
      time: '3 horas atrás', 
      read: true,
      actions: ['Revisar Avaliações']
    },
  ]);

  // Effect para detectar clique fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fechar notificações ao clicar fora
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      
      // Fechar menu do usuário ao clicar fora
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    // Adicionar event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const getRoleIcon = () => {
    if (isDirector) return <Crown className="h-4 w-4" />;
    if (isLeader) return <Briefcase className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const getRoleLabel = () => {
    if (isDirector) return 'Diretor';
    if (isLeader) return 'Líder';
    return 'Colaborador';
  };

  const getRoleBadgeColor = () => {
    if (isDirector) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (isLeader) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleNotificationExpanded = (id: number) => {
    setExpandedNotifications(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const handleNotificationAction = (action: string) => {
    // Aqui você pode adicionar a lógica para cada ação
    setShowNotifications(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Lado esquerdo - Título e data */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Sistema de Avaliação de Desempenho
            </h1>
            <p className="text-sm text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Lado direito - Notificações e usuário */}
        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de notificações */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                >
                  {/* Header do dropdown */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Notificações
                      </h3>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                        <button
                          onClick={clearAllNotifications}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de notificações */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                          Nenhuma notificação no momento
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                            !notification.read ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${notification.color} flex-shrink-0`}>
                              <notification.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {expandedNotifications[notification.id] 
                                      ? notification.fullText 
                                      : notification.description}
                                  </p>
                                  {notification.fullText !== notification.description && (
                                    <button
                                      onClick={() => toggleNotificationExpanded(notification.id)}
                                      className="text-xs text-primary-600 hover:text-primary-700 mt-1 font-medium"
                                    >
                                      {expandedNotifications[notification.id] ? 'Ver menos' : 'Ver mais'}
                                    </button>
                                  )}
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500">
                                      {notification.time}
                                    </span>
                                    {!notification.read && (
                                      <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="text-xs text-primary-600 hover:text-primary-700"
                                      >
                                        Marcar como lida
                                      </button>
                                    )}
                                  </div>
                                  {notification.actions && notification.actions.length > 0 && (
                                    <div className="flex items-center space-x-2 mt-3">
                                      {notification.actions.map((action, index) => (
                                        <button
                                          key={index}
                                          onClick={() => handleNotificationAction(action)}
                                          className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                                        >
                                          {action}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer do dropdown */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        Ver todas as notificações
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Menu do usuário */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.name || user?.email}
                </p>
                <div className="flex items-center justify-end space-x-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor()} flex items-center`}>
                    {getRoleIcon()}
                    <span className="ml-1">{getRoleLabel()}</span>
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown do usuário */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
                >
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.email}
                    </p>
                  </div>

                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                    <User className="h-4 w-4" />
                    <span>Meu Perfil</span>
                  </button>

                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </button>

                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                    <HelpCircle className="h-4 w-4" />
                    <span>Ajuda</span>
                  </button>

                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
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