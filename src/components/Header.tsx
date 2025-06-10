import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Crown,
  Briefcase,
  Users,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth, useUserRole } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

export default function Header({ onMenuClick, isSidebarCollapsed }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const { isDirector, isLeader, role } = useUserRole();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Obter título da página atual
  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/': 'Dashboard',
      '/self-evaluation': 'Autoavaliação',
      '/leader-evaluation': 'Avaliação da Equipe',
      '/potential-evaluation': 'Avaliação de Potencial',
      '/consensus': 'Reunião de Consenso',
      '/nine-box': 'Matriz 9-Box',
      '/action-plan': 'Plano de Desenvolvimento Individual',
      '/reports': 'Relatórios',
      '/settings': 'Configurações',
      '/users': 'Gestão de Usuários',
      '/users/new': 'Cadastro de Usuário',
      '/notifications': 'Notificações',
    };
    return titles[path] || 'Sistema de Avaliação';
  };

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

  // Mock de notificações - substituir por dados reais
  const notifications = [
    { id: 1, title: 'Nova avaliação pendente', time: '5 min atrás', read: false },
    { id: 2, title: 'Prazo de avaliação se aproximando', time: '1 hora atrás', read: false },
    { id: 3, title: 'Feedback recebido', time: '2 horas atrás', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Lado esquerdo */}
        <div className="flex items-center space-x-4">
          {/* Botão de menu mobile */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          {/* Título da página */}
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-gray-500 hidden md:block">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Lado direito */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Barra de pesquisa (desktop) */}
          <div className="hidden lg:flex items-center bg-gray-100 rounded-xl px-3 py-2 w-64">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
            />
          </div>

          {/* Botão de tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-gray-600" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Dropdown de notificações */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notificações</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                          !notif.read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        navigate('/notifications');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Ver todas as notificações
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Menu do usuário */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500">{profile?.email || user?.email}</p>
              </div>
              
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                  isDirector ? 'bg-purple-500' : isLeader ? 'bg-blue-500' : 'bg-green-500'
                } text-white border-2 border-white`}>
                  {getRoleIcon()}
                </div>
              </div>
              
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>

            {/* Dropdown do menu do usuário */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                >
                  {/* Informações do usuário */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{profile?.name || 'Usuário'}</p>
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