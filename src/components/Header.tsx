import { useState } from 'react';
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

  // Mock de notificações com mais detalhes
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'evaluation',
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
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
      color: 'text-amber-600 bg-amber-100',
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
      color: 'text-teal-600 bg-teal-100',
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
                day: 'numeric',
                month: 'long',
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Lado direito - Notificações e usuário */}
        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative group"
            >
              <Bell className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full" />
              )}
            </button>

            {/* Dropdown de notificações */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                >
                  {/* Header das notificações */}
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-white" />
                        <h3 className="font-semibold text-white">Notificações</h3>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-white/20 backdrop-blur text-white text-xs font-medium px-2 py-1 rounded-full">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center space-x-1 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        <span>Marcar todas como lidas</span>
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-gray-500 hover:text-red-600 font-medium flex items-center space-x-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Limpar tudo</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Lista de notificações */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Nenhuma notificação no momento</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon = notif.icon;
                        const isExpanded = expandedNotifications[notif.id];
                        
                        return (
                          <div
                            key={notif.id}
                            className={`relative border-b border-gray-100 transition-all ${
                              !notif.read ? 'bg-teal-50/30' : 'bg-white'
                            }`}
                          >
                            <div className="p-4">
                              <div className="flex items-start space-x-3">
                                {/* Ícone da notificação */}
                                <div className={`p-2 rounded-lg ${notif.color}`}>
                                  <Icon className="h-4 w-4" />
                                </div>

                                {/* Conteúdo da notificação */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {notif.title}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-0.5">
                                        {isExpanded ? notif.fullText : notif.description}
                                      </p>
                                      
                                      {/* Ações da notificação */}
                                      {isExpanded && notif.actions && (
                                        <div className="flex items-center space-x-2 mt-3">
                                          {notif.actions.map((action, index) => (
                                            <button
                                              key={index}
                                              onClick={() => handleNotificationAction(action)}
                                              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                                index === 0 
                                                  ? 'bg-teal-500 text-white hover:bg-teal-600' 
                                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                              }`}
                                            >
                                              {action}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      <div className="flex items-center space-x-3 mt-2">
                                        <span className="text-xs text-gray-500">{notif.time}</span>
                                        
                                        {/* Botão Ver mais/menos */}
                                        {notif.description !== notif.fullText && (
                                          <button
                                            onClick={() => toggleNotificationExpanded(notif.id)}
                                            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center space-x-1"
                                          >
                                            <span>{isExpanded ? 'Ver menos' : 'Ver mais'}</span>
                                            <ChevronRight className={`h-3 w-3 transition-transform ${
                                              isExpanded ? 'rotate-90' : ''
                                            }`} />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Botão marcar como lido */}
                                    {!notif.read && (
                                      <button
                                        onClick={() => markAsRead(notif.id)}
                                        className="ml-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
                                        title="Marcar como lida"
                                      >
                                        <Check className="h-4 w-4 text-gray-400 group-hover:text-teal-600" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Indicador de não lida */}
                            {!notif.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          setShowNotifications(false);
                        }}
                        className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium py-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Ver histórico completo
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divisão */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Usuário */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {profile?.name || 'Admin User'}
              </span>
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AU'}
              </div>
            </button>

            {/* Dropdown do menu do usuário */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                >
                  {/* Informações do usuário */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AU'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{profile?.name || 'Admin User'}</p>
                        <p className="text-xs text-gray-500">{profile?.email || user?.email}</p>
                        <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 border ${getRoleBadgeColor()}`}>
                          {getRoleIcon()}
                          <span>{getRoleLabel()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opções do menu */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Meu Perfil</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <Settings className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Configurações</span>
                    </button>

                    <button
                      onClick={() => {
                        toast('Central de ajuda em desenvolvimento');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <HelpCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Ajuda</span>
                    </button>

                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Sair</span>
                      </button>
                    </div>
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