import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Users,
  Handshake,
  TrendingUp,
  Calendar,
  PieChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ClipboardCheck,
  Grid3X3,
  Bell,
  UserPlus,
  X,
  Crown,
  Briefcase,
  BookOpen,
} from 'lucide-react';
import { useAuth, useUserRole } from '../context/AuthContext';
import logo from '../../assets/images/logo.png';
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
      label: 'Página Inicial',
      icon: Home,
      path: '/',
    },
    {
      label: 'Cadastro de Usuários',
      icon: UserPlus,
      path: '/users/new',
      allowedRoles: ['director'],
    },
    {
      label: 'Gerenciar Usuários',
      icon: Users,
      path: 'users',
      allowedRoles: ['director'],
    },
    {
      label: 'Autoavaliação',
      icon: FileText,
      path: '/self-evaluation',
      hideForRoles: ['director'],
    },
    {
      label: 'Avaliação do Líder',
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
      icon: Handshake,
      path: '/consensus',
      allowedRoles: ['director'],
    },
    {
      label: 'Matriz 9 Box',
      icon: Grid3X3,
      path: '/nine-box',
      allowedRoles: ['director'],
    },
    {
      label: 'PDI',
      icon: FileText,
      path: '/action-plan',
      allowedRoles: ['director'],
    },
    {
      label: 'Relatórios',
      icon: PieChart,
      path: '/reports',
      allowedRoles: ['director'],
    },
    {
      label: 'Guia NineBox',
      icon: BookOpen,
      path: '/nine-box-guide',
      allowedRoles: ['director', 'leader'],
    },

  ];

  // Filtrar itens baseado no papel do usuário
  const filteredNavItems = navItems.filter(item => {
    if (item.hideForRoles && item.hideForRoles.includes(role as 'director' | 'leader' | 'collaborator')) {
      return false;
    }
    
    if (item.allowedRoles && !item.allowedRoles.includes(role as 'director' | 'leader' | 'collaborator')) {
      return false;
    }
    
    return true;
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between pl-2 pr-4 border-b border-gray-700/50">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <img 
            src={logo} 
            alt="Logo da empresa" 
            className="h-14 w-auto object-contain"
          />
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-white border border-teal-500/40 shadow-lg shadow-teal-500/10' 
                  : 'text-white/70 hover:bg-gray-800/50 hover:text-white'
                }
              `}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Separador e opções inferiores */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-white border border-teal-500/40 shadow-lg shadow-teal-500/10' 
                : 'text-white/70 hover:bg-gray-800/50 hover:text-white'
              }
            `}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Configurações</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-[15px] font-medium rounded-lg text-white/70 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col bg-dark-navy w-64 fixed h-full z-30">
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="md:hidden flex flex-col bg-dark-navy fixed h-full w-64 z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}