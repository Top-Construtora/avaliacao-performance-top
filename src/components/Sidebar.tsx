import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Users,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserCheck,
  ClipboardCheck,
  Grid3X3,
  Bell,
  UserPlus,
  X,
  Crown,
  Briefcase,
} from 'lucide-react';
import { useAuth, useUserRole } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

interface NavItem {
  label: string;
  icon: any;
  path: string;
  allowedRoles?: Array<'director' | 'leader' | 'collaborator'>;
  hideForRoles?: Array<'director' | 'leader' | 'collaborator'>;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isDirector, isLeader, role } = useUserRole();

  // Definir itens de navegação com permissões
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/',
    },
    {
      label: 'Autoavaliação',
      icon: FileText,
      path: '/self-evaluation',
      hideForRoles: ['director'], // Diretores não fazem autoavaliação
    },
    {
      label: 'Avaliação da Equipe',
      icon: Users,
      path: '/leader-evaluation',
      allowedRoles: ['leader', 'director'],
    },
    {
      label: 'Avaliação de Potencial',
      icon: TrendingUp,
      path: '/potential-evaluation',
      allowedRoles: ['leader', 'director'],
    },
    {
      label: 'Consenso',
      icon: UserCheck,
      path: '/consensus',
      allowedRoles: ['director'],
    },
    {
      label: 'Matriz 9-Box',
      icon: Grid3X3,
      path: '/nine-box',
      allowedRoles: ['director'],
    },
    {
      label: 'PDI',
      icon: Target,
      path: '/action-plan',
      allowedRoles: ['director'],
    },
    {
      label: 'Relatórios',
      icon: BarChart3,
      path: '/reports',
      allowedRoles: ['director'],
    },
    {
      label: 'Gestão de Usuários',
      icon: UserPlus,
      path: '/users',
      allowedRoles: ['director'],
    },
    {
      label: 'Notificações',
      icon: Bell,
      path: '/notifications',
    },
    {
      label: 'Configurações',
      icon: Settings,
      path: '/settings',
    },
  ];

  // Filtrar itens baseado no papel do usuário
  const filteredNavItems = navItems.filter(item => {
    // Se tem hideForRoles, verificar se o papel atual está na lista
    if (item.hideForRoles && item.hideForRoles.includes(role)) {
      return false;
    }
    
    // Se tem allowedRoles, verificar se o papel atual está permitido
    if (item.allowedRoles && !item.allowedRoles.includes(role)) {
      return false;
    }
    
    return true;
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  // Componente do ícone de papel do usuário
  const RoleIcon = () => {
    if (isDirector) return <Crown className="h-4 w-4" />;
    if (isLeader) return <Briefcase className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const getRoleLabel = () => {
    if (isDirector) return 'Diretor';
    if (isLeader) return 'Líder';
    return 'Colaborador';
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <motion.div
            initial={false}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className={`flex items-center space-x-3 ${isCollapsed ? 'hidden' : 'block'}`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Avaliação</h1>
              <p className="text-xs text-gray-500">Sistema de Desempenho</p>
            </div>
          </motion.div>
          
          {/* Botão de colapsar (desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>

          {/* Botão de fechar (mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Informações do usuário */}
      <div className="p-4 border-b border-gray-200">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
              {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
              isDirector ? 'bg-purple-500' : isLeader ? 'bg-blue-500' : 'bg-green-500'
            } text-white border-2 border-white`}>
              <RoleIcon />
            </div>
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getRoleLabel()} • {profile?.position || 'Cargo'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-xl transition-all
              ${isActive 
                ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Botão de logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : ''
          } px-3 py-2.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all`}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
          {!isCollapsed && (
            <span className="text-sm font-medium">Sair</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col bg-white border-r border-gray-200 fixed h-full z-30"
      >
        {sidebarContent}
      </motion.aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="md:hidden flex flex-col bg-white border-r border-gray-200 fixed h-full w-64 z-50"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}