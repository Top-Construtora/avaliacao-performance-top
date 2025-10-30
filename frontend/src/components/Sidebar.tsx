import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Users,
  Handshake,
  PieChart,
  Settings,
  LogOut,
  Layers,
  RotateCcw,
  Grid3X3,
  DollarSign,
  UserPlus,
  BookOpen,
  Plus,
  ChevronDown,
  Building,
  User,
  HelpCircle,
  Award,
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
  path?: string;
  allowedRoles?: Array<'admin' | 'director' | 'leader' | 'collaborator'>;
  hideForRoles?: Array<'admin' | 'director' | 'leader' | 'collaborator'>;
  hasDropdown?: boolean;
  subItems?: NavItem[];
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isDirector, isLeader, isAdmin, role } = useUserRole();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Definir itens de navegação com permissões
  const navItems: NavItem[] = [
    {
      label: 'Página Inicial',
      icon: Home,
      path: '/',
    },
    {
      label: 'Cadastrar',
      icon: Plus,
      hasDropdown: true,
      allowedRoles: ['admin', 'director'],
      subItems: [
        {
          label: 'Cadastrar Usuário',
          icon: UserPlus,
          path: '/register/user',
        },
        {
          label: 'Cadastrar Time',
          icon: Users,
          path: '/register/team',
        },
        {
          label: 'Cadastrar Departamento',
          icon: Building,
          path: '/register/department',
        },
      ],
    },
    {
      label: 'Gerenciar',
      icon: Layers,
      hasDropdown: true,
      allowedRoles: ['admin', 'director'],
      subItems: [
        {
          label: 'Gerenciar Usuários',
          icon: User,
          path: '/users',
        },
        {
          label: 'Gerenciar Times',
          icon: Users,
          path: '/teams',
        },
        {
          label: 'Gerenciar Departamentos',
          icon: Building,
          path: '/departments',
        },
      ],
    },
    {
      label: 'Cargos e Salários',
      icon: DollarSign,
      path: '/salary',
      allowedRoles: ['admin', 'director']
    },
    {
      label: 'Meu PDI',
      icon: BookOpen,
      path: '/my-pdi',
      allowedRoles: ['director', 'leader', 'collaborator']
    },
    {
      label: 'Gerenciar PDI',
      icon: BookOpen,
      path: 'pdi',
      allowedRoles: ['admin', 'director', 'leader']
    },
    {
      label: 'Gerenciar Ciclos',
      icon: RotateCcw,
      path: '/cycle',
      allowedRoles: ['admin', 'director'],
    },
    {
      label: 'Código Cultural',
      icon: Award,
      path: '/codigo-cultural',
      allowedRoles: ['admin', 'director'],
    },
    {
      label: 'Autoavaliação',
      icon: FileText,
      path: '/self-evaluation',
      hideForRoles: ['admin', 'director'],
    },
    {
      label: 'Avaliação do Líder',
      icon: Users,
      path: '/leader-evaluation',
      allowedRoles: ['admin', 'leader', 'director'],
    },
    {
      label: 'Consenso',
      icon: Handshake,
      path: '/consensus',
      allowedRoles: ['admin', 'director'],
    },
    {
      label: 'Comitê  de Gente',
      icon: Grid3X3,
      path: '/nine-box',
      allowedRoles: ['admin', 'director'],
    },
    {
      label: 'Relatórios',
      icon: PieChart,
      path: '/reports',
      allowedRoles: ['admin', 'director'],
    },
    {
      label: 'Guia NineBox',
      icon: BookOpen,
      path: '/nine-box-guide',
      allowedRoles: ['admin', 'director', 'leader'],
    },
  ];

  // Filtrar itens baseado no papel do usuário
  const filteredNavItems = navItems.filter(item => {
    // Bloquear acesso a Cargos e Salários para o email específico
    if (profile?.email === 'recrutatop@topconstrutora.com' && item.path === '/salary') {
      return false;
    }

    // Admin tem acesso a tudo, exceto itens em hideForRoles
    if (isAdmin) {
      if (item.hideForRoles && item.hideForRoles.includes('admin')) {
        return false;
      }
      return true;
    }

    if (item.hideForRoles && item.hideForRoles.includes(role as 'admin' | 'director' | 'leader' | 'collaborator')) {
      return false;
    }

    if (item.allowedRoles && !item.allowedRoles.includes(role as 'admin' | 'director' | 'leader' | 'collaborator')) {
      return false;
    }

    return true;
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-[77px] flex items-center justify-between pl-2 pr-4 border-b border-white/10">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <img 
            src={logo} 
            alt="Logo da empresa" 
            className="h-16 w-auto object-contain"
          />
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <div key={item.label}>
              {item.hasDropdown ? (
                <>
                  <button
                    onClick={() => handleDropdownToggle(item.label)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
                      ${openDropdown === item.label
                        ? 'bg-white/10 text-white' 
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${
                        openDropdown === item.label ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  <AnimatePresence>
                    {openDropdown === item.label && item.subItems && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path!}
                              className={({ isActive }) => `
                                flex items-center px-4 py-2.5 text-[14px] font-medium rounded-lg transition-all duration-200
                                ${isActive 
                                  ? 'bg-white/15 text-white border-l-2 border-white' 
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }
                              `}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                              <span>{subItem.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <NavLink
                  to={item.path!}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-white/15 text-white' 
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Separador e opções inferiores */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
              ${isActive
                ? 'bg-white/15 text-white'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
              }
            `}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Configurações</span>
          </NavLink>

          <NavLink
            to="/help"
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
              ${isActive
                ? 'bg-white/15 text-white'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
              }
            `}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <HelpCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Ajuda</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-[15px] font-medium rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200"
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
      <aside className="hidden md:flex flex-col w-64 fixed h-full z-30" style={{backgroundColor: '#1e2938'}}>
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
              className="md:hidden flex flex-col fixed h-full w-64 z-50"
              style={{backgroundColor: '#1e2938'}}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}