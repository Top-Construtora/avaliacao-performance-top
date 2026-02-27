import { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Building,
  User,
  HelpCircle,
  Award,
} from 'lucide-react';
import { useAuth, useUserRole } from '../context/AuthContext';
import { usePeopleCommitteePermission } from '../hooks/usePeopleCommittee';
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
  const { canViewPeopleCommittee } = usePeopleCommitteePermission();
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
      label: 'Comitê de Gente',
      icon: Grid3X3,
      path: '/nine-box',
      allowedRoles: ['admin', 'director', 'leader'], // Leader pode ver se tiver permissão no cargo
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

    // Verificação especial para o Comitê de Gente - líderes precisam de permissão no cargo
    if (item.path === '/nine-box' && isLeader && !isDirector) {
      return canViewPeopleCommittee;
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

  const sidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={`h-[77px] flex items-center border-b border-white/10 ${isCollapsed && !isMobile ? 'justify-center px-2' : 'justify-between pl-2 pr-4'}`}>
        <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
          <img
            src={logo}
            alt="Logo da empresa"
            className={`object-contain ${isCollapsed && !isMobile ? 'h-10 w-auto' : 'h-16 w-auto'}`}
          />
        </div>
        {/* Botão de toggle - só aparece no modo expandido */}
        {!isMobile && !isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
            title="Retrair sidebar"
          >
            <ChevronLeft className="h-5 w-5 text-white/80" />
          </button>
        )}
      </div>

      {/* Botão de toggle - aparece entre logo e menu quando retraído */}
      {!isMobile && isCollapsed && (
        <div className="px-2 py-3 border-b border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            title="Expandir sidebar"
          >
            <ChevronRight className="h-5 w-5 text-white/80" />
          </button>
        </div>
      )}

      {/* Menu de navegação */}
      <nav className={`flex-1 py-4 overflow-y-auto overflow-x-hidden ${isCollapsed && !isMobile ? 'px-2' : 'px-3'}`}>
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <div key={item.label} className="relative group">
              {item.hasDropdown ? (
                <>
                  {isCollapsed && !isMobile ? (
                    // Modo colapsado com dropdown
                    <div className="relative">
                      <button
                        onClick={() => handleDropdownToggle(item.label)}
                        className={`
                          w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200
                          ${openDropdown === item.label
                            ? 'bg-white/10 text-white'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                          }
                        `}
                        title={item.label}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      </button>
                      {/* Tooltip */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                        {item.label}
                      </div>
                      {/* Dropdown para modo colapsado */}
                      <AnimatePresence>
                        {openDropdown === item.label && item.subItems && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-full top-0 ml-2 bg-[#1e2938] rounded-lg shadow-lg py-2 min-w-[200px] z-50"
                          >
                            {item.subItems.map((subItem) => (
                              <NavLink
                                key={subItem.path}
                                to={subItem.path!}
                                className={({ isActive }) => `
                                  flex items-center px-4 py-2.5 text-[14px] font-medium transition-all duration-200
                                  ${isActive
                                    ? 'bg-[#12b0a0]/15 text-[#12b0a0]'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                  }
                                `}
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setOpenDropdown(null);
                                }}
                              >
                                <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                <span>{subItem.label}</span>
                              </NavLink>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    // Modo expandido com dropdown
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
                                      ? 'bg-[#12b0a0]/15 text-[#12b0a0] border-l-2 border-[#12b0a0]'
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
                  )}
                </>
              ) : isCollapsed && !isMobile ? (
                // Item simples em modo colapsado
                <NavLink
                  to={item.path!}
                  className={({ isActive }) => `
                    flex items-center justify-center p-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#12b0a0]/15 text-[#12b0a0]'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={item.label}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {/* Tooltip */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </div>
                </NavLink>
              ) : (
                // Item simples em modo expandido
                <NavLink
                  to={item.path!}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#12b0a0]/15 text-[#12b0a0]'
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
      <div className={`py-4 border-t border-white/10 ${isCollapsed && !isMobile ? 'px-2' : 'px-3'}`}>
        <div className="space-y-1">
          {isCollapsed && !isMobile ? (
            // Modo colapsado
            <>
              <NavLink
                to="/settings"
                className={({ isActive }) => `
                  flex items-center justify-center p-3 rounded-lg transition-all duration-200 relative group
                  ${isActive
                    ? 'bg-[#12b0a0]/15 text-[#12b0a0]'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
                title="Configurações"
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  Configurações
                </div>
              </NavLink>

              <NavLink
                to="/help"
                className={({ isActive }) => `
                  flex items-center justify-center p-3 rounded-lg transition-all duration-200 relative group
                  ${isActive
                    ? 'bg-[#12b0a0]/15 text-[#12b0a0]'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
                title="Ajuda"
              >
                <HelpCircle className="h-5 w-5 flex-shrink-0" />
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  Ajuda
                </div>
              </NavLink>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 rounded-lg text-[#F87171] hover:bg-[#F87171]/10 hover:text-[#F87171] transition-all duration-200 relative group"
                title="Sair"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  Sair
                </div>
              </button>
            </>
          ) : (
            // Modo expandido
            <>
              <NavLink
                to="/settings"
                className={({ isActive }) => `
                  flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-[#12b0a0]/15 text-[#12b0a0]'
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
                    ? 'bg-[#12b0a0]/15 text-[#12b0a0]'
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
                className="w-full flex items-center px-4 py-3 text-[15px] font-medium rounded-lg text-[#F87171] hover:bg-[#F87171]/10 hover:text-[#F87171] transition-all duration-200"
              >
                <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>Sair</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col fixed h-full z-30"
        style={{ background: 'linear-gradient(180deg, #1e6076 0%, #1F2937 30%)' }}
      >
        {sidebarContent(false)}
      </motion.aside>

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
              style={{ background: 'linear-gradient(180deg, #1e6076 0%, #1F2937 30%)' }}
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}