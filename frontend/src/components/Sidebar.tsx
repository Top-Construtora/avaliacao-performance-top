import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronRight,
  ChevronLeft,
  Building,
  User,
  HelpCircle,
  Award,
  ClipboardList,
  Calendar,
  SmilePlus,
  Briefcase,
} from 'lucide-react';
import { useAuth, useUserRole } from '../context/AuthContext';
import { usePeopleCommitteePermission } from '../hooks/usePeopleCommittee';
import gioWordmark from '@/assets/images/gioWordmark.png';
import gioMark from '@/assets/images/gioMark.png';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

type RoleType = 'admin' | 'director' | 'leader' | 'collaborator';

interface NavItem {
  label: string;
  icon: any;
  path?: string;
  allowedRoles?: Array<RoleType>;
  hideForRoles?: Array<RoleType>;
  hasDropdown?: boolean;
  subItems?: NavItem[];
}

interface NavSection {
  title: string;
  allowedRoles?: Array<RoleType>;
  items: NavItem[];
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile } = useAuth();
  const { isDirector, isLeader, isAdmin, role } = useUserRole();
  const { canViewPeopleCommittee } = usePeopleCommitteePermission();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [collapsedDropdown, setCollapsedDropdown] = useState<{
    label: string;
    top: number;
    subItems: NavItem[];
  } | null>(null);

  useEffect(() => {
    if (!collapsedDropdown) return;
    const close = () => setCollapsedDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [collapsedDropdown]);

  const handleCollapsedDropdown = (e: React.MouseEvent<HTMLButtonElement>, item: NavItem) => {
    e.stopPropagation();
    if (collapsedDropdown?.label === item.label) {
      setCollapsedDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setCollapsedDropdown({ label: item.label, top: rect.top, subItems: item.subItems || [] });
    }
  };

  // Definir seções de navegação com permissões
  const navSections: NavSection[] = [
    {
      title: 'Workspace',
      items: [
        {
          label: 'Página Inicial',
          icon: Home,
          path: '/',
        },
      ],
    },
    {
      title: 'Estrutura',
      allowedRoles: ['admin', 'director'],
      items: [
        {
          label: 'Cadastrar',
          icon: Plus,
          hasDropdown: true,
          allowedRoles: ['admin', 'director'],
          subItems: [
            { label: 'Cadastrar Usuário', icon: UserPlus, path: '/register/user' },
            { label: 'Cadastrar Time', icon: Users, path: '/register/team' },
            { label: 'Cadastrar Departamento', icon: Building, path: '/register/department' },
          ],
        },
        {
          label: 'Gerenciar',
          icon: Layers,
          hasDropdown: true,
          allowedRoles: ['admin', 'director'],
          subItems: [
            { label: 'Gerenciar Usuários', icon: User, path: '/users' },
            { label: 'Gerenciar Times', icon: Users, path: '/teams' },
            { label: 'Gerenciar Departamentos', icon: Building, path: '/departments' },
          ],
        },
        {
          label: 'Cargos e Salários',
          icon: DollarSign,
          path: '/salary',
          allowedRoles: ['admin', 'director'],
        },
      ],
    },
    {
      title: 'Avaliação de Desempenho',
      items: [
        {
          label: 'Ciclo',
          icon: RotateCcw,
          hasDropdown: true,
          allowedRoles: ['admin', 'director'],
          subItems: [
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
          ],
        },
        {
          label: 'Avaliações',
          icon: FileText,
          hasDropdown: true,
          subItems: [
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
          ],
        },
        {
          label: 'Comitê',
          icon: Grid3X3,
          hasDropdown: true,
          allowedRoles: ['admin', 'director', 'leader'],
          subItems: [
            {
              label: 'Comitê de Gente',
              icon: Grid3X3,
              path: '/nine-box',
              allowedRoles: ['admin', 'director', 'leader'],
            },
            {
              label: 'Guia NineBox',
              icon: BookOpen,
              path: '/nine-box-guide',
              allowedRoles: ['admin', 'director', 'leader'],
            },
          ],
        },
        {
          label: 'PDI',
          icon: BookOpen,
          hasDropdown: true,
          allowedRoles: ['admin', 'director', 'leader', 'collaborator'],
          subItems: [
            {
              label: 'Meu PDI',
              icon: BookOpen,
              path: '/my-pdi',
              allowedRoles: ['director', 'leader', 'collaborator'],
            },
            {
              label: 'Gerenciar PDI',
              icon: BookOpen,
              path: '/pdi',
              allowedRoles: ['admin', 'director', 'leader'],
            },
            {
              label: 'Calendário PDI',
              icon: Calendar,
              path: '/pdi-calendar',
              allowedRoles: ['admin', 'director', 'leader'],
            },
          ],
        },
        {
          label: 'Relatórios',
          icon: PieChart,
          path: '/reports',
          allowedRoles: ['admin', 'director'],
        },
      ],
    },
    {
      title: 'Recrutamento e Seleção',
      allowedRoles: ['admin', 'director', 'leader'],
      items: [
        {
          label: 'Recrutamento',
          icon: Briefcase,
          hasDropdown: true,
          allowedRoles: ['admin', 'director', 'leader'],
          subItems: [
            {
              label: 'Vagas',
              icon: Briefcase,
              path: '/recruitment',
              allowedRoles: ['admin', 'director', 'leader'],
            },
            {
              label: 'Onboard e Offboard',
              icon: ClipboardList,
              path: '/interviews',
              allowedRoles: ['admin', 'director', 'leader'],
            },
          ],
        },
      ],
    },
    {
      title: 'Engajamento',
      items: [
        {
          label: 'Pesquisas',
          icon: SmilePlus,
          path: '/satisfaction',
        },
      ],
    },
  ];

  // Filtrar item baseado no papel do usuário
  const filterItem = (item: NavItem): boolean => {
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

    if (item.hideForRoles && item.hideForRoles.includes(role as RoleType)) {
      return false;
    }

    // Verificação especial para o Comitê de Gente - líderes precisam de permissão no cargo
    if (item.path === '/nine-box' && isLeader && !isDirector) {
      return canViewPeopleCommittee;
    }

    if (item.allowedRoles && !item.allowedRoles.includes(role as RoleType)) {
      return false;
    }

    return true;
  };

  // Filtrar seções e itens baseado no papel do usuário
  const filteredSections = useMemo(() => {
    return navSections
      .map((section) => ({
        ...section,
        items: section.items
          .filter(filterItem)
          .map((item) =>
            item.subItems ? { ...item, subItems: item.subItems.filter(filterItem) } : item,
          )
          .filter((item) => !item.hasDropdown || (item.subItems && item.subItems.length > 0)),
      }))
      .filter((section) => {
        if (section.items.length === 0) return false;
        if (section.allowedRoles && !isAdmin && !section.allowedRoles.includes(role as RoleType)) {
          return false;
        }
        return true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isAdmin, isLeader, isDirector, role, canViewPeopleCommittee]);

  // Abre automaticamente o dropdown do item ativo
  useEffect(() => {
    for (const section of filteredSections) {
      for (const item of section.items) {
        if (item.subItems?.some((s) => s.path && location.pathname.startsWith(s.path))) {
          setOpenDropdown(item.label);
          return;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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

  const isModuleActive = (item: NavItem) =>
    !!item.subItems?.some((s) => s.path && location.pathname.startsWith(s.path));

  // Inicial do avatar do rodapé
  const inicial = (profile?.name || profile?.email || 'U').charAt(0).toUpperCase();

  // ---- Classes base (espelham os tokens do gioBrand via Tailwind) ----
  // leaf/módulo: py-[9px] px-[11px] rounded-[6px]
  const leafBase =
    'relative w-full flex items-center rounded-[6px] mb-[2px] py-[9px] px-[11px] transition-colors duration-150';
  const leafInactive = 'text-white/55 hover:bg-white/[0.06] hover:text-white';
  const leafActive = 'bg-[#D2FF00]/[0.14] text-[#D2FF00]';
  const leafText = 'text-[13.5px] font-medium tracking-[-0.005em]';
  const subText = 'text-[12.5px] font-medium';

  const sidebarContent = (isMobile: boolean = false) => {
    const collapsed = isCollapsed && !isMobile;
    return (
      <div className="flex flex-col h-full bg-[#1A1A1A] text-white font-gio overflow-hidden">
        {/* Marca + toggle */}
        <div
          className={`min-h-[60px] flex items-center justify-center flex-shrink-0 ${
            collapsed ? 'flex-col gap-[10px] px-1 py-[10px]' : 'flex-row px-2'
          }`}
        >
          {/* Espaçador (largura da seta) p/ centralizar a logo no expandido */}
          {!collapsed && <div className="w-8 flex-shrink-0" />}

          <div className={`${collapsed ? 'flex-none' : 'flex-1'} h-[30px] grid place-items-center`}>
            {/* Wordmark + mark sobrepostos (grid 1/1): crossfade simultâneo */}
            <motion.img
              src={gioWordmark}
              alt="gio"
              initial={false}
              animate={
                collapsed ? { opacity: 0, x: -28, scaleX: 0.35 } : { opacity: 1, x: 0, scaleX: 1 }
              }
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                gridArea: '1 / 1',
                height: 30,
                filter: 'invert(1)',
                transformOrigin: 'left center',
                zIndex: collapsed ? 1 : 2,
              }}
            />
            <motion.img
              src={gioMark}
              alt=""
              aria-hidden="true"
              initial={false}
              animate={collapsed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                gridArea: '1 / 1',
                height: 30,
                filter: 'invert(1)',
                zIndex: collapsed ? 2 : 1,
              }}
            />
          </div>

          {!isMobile && (
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
              className="flex-shrink-0"
            >
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={collapsed ? 'expandir menu lateral' : 'recolher menu lateral'}
                title={collapsed ? 'Expandir menu' : 'Recolher menu'}
                className="w-8 h-8 rounded-[8px] grid place-items-center text-[#ECECEE] hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <ChevronLeft
                  size={20}
                  style={{
                    transition: 'transform .55s cubic-bezier(.22,1,.36,1)',
                    transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
            </motion.div>
          )}
        </div>

        {/* Navegação agrupada */}
        <nav className="flex-grow px-1.5 py-0.5 overflow-y-auto overflow-x-hidden gio-sidebar-scroll">
          {filteredSections.map((section) => (
            <div key={section.title || 'home'} className={collapsed ? 'mb-1.5' : 'mb-[20px]'}>
              {/* Título da seção */}
              {section.title &&
                (collapsed ? (
                  <div className="my-3 mx-1 border-t border-white/[0.08]" />
                ) : (
                  <div className="px-1 pt-0.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 whitespace-nowrap">
                    {section.title}
                  </div>
                ))}

              {/* Itens */}
              {section.items.map((item) => {
                // ----- Item com dropdown -----
                if (item.hasDropdown && item.subItems) {
                  const active = isModuleActive(item);

                  // Colapsado: dropdown via portal (fora do overflow)
                  if (collapsed) {
                    return (
                      <button
                        key={item.label}
                        onClick={(e) => handleCollapsedDropdown(e, item)}
                        title={item.label}
                        className={`${leafBase} justify-center ${
                          collapsedDropdown?.label === item.label
                            ? 'bg-white/[0.06] text-white'
                            : active
                              ? leafActive
                              : leafInactive
                        }`}
                      >
                        <item.icon
                          size={20}
                          className={active ? 'text-[#D2FF00] flex-shrink-0' : 'flex-shrink-0'}
                        />
                      </button>
                    );
                  }

                  // Expandido
                  const aberto = openDropdown === item.label;
                  return (
                    <React.Fragment key={item.label}>
                      <button
                        onClick={() => handleDropdownToggle(item.label)}
                        className={`${leafBase} justify-between ${active ? leafActive : leafInactive}`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[#D2FF00] rounded-r-[3px]" />
                        )}
                        <span className="flex items-center min-w-0">
                          <item.icon
                            size={20}
                            className={`mr-1.5 flex-shrink-0 ${active ? 'text-[#D2FF00]' : ''}`}
                          />
                          <span className={`${leafText} truncate`}>{item.label}</span>
                        </span>
                        {aberto ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>

                      <AnimatePresence initial={false}>
                        {aberto && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mb-0.5">
                              {item.subItems.map((sub) => (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path!}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={({ isActive }) =>
                                    `flex items-center rounded-[6px] mb-[1px] pl-[36px] pr-[11px] py-[6px] transition-colors duration-150 ${
                                      isActive
                                        ? 'bg-[#D2FF00]/[0.14] text-[#D2FF00]'
                                        : 'text-white/35 hover:bg-white/[0.06] hover:text-white'
                                    }`
                                  }
                                >
                                  <sub.icon size={16} className="mr-1.5 flex-shrink-0" />
                                  <span className={`${subText} truncate`}>{sub.label}</span>
                                </NavLink>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                }

                // ----- Item simples (leaf) -----
                if (collapsed) {
                  return (
                    <NavLink
                      key={item.label}
                      to={item.path!}
                      onClick={() => setIsMobileMenuOpen(false)}
                      title={item.label}
                      className={({ isActive }) =>
                        `${leafBase} justify-center ${isActive ? leafActive : leafInactive}`
                      }
                    >
                      {({ isActive }) => (
                        <item.icon
                          size={20}
                          className={isActive ? 'text-[#D2FF00] flex-shrink-0' : 'flex-shrink-0'}
                        />
                      )}
                    </NavLink>
                  );
                }

                return (
                  <NavLink
                    key={item.label}
                    to={item.path!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `${leafBase} justify-start ${isActive ? leafActive : leafInactive}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[#D2FF00] rounded-r-[3px]" />
                        )}
                        <item.icon
                          size={20}
                          className={`mr-1.5 flex-shrink-0 ${isActive ? 'text-[#D2FF00]' : ''}`}
                        />
                        <span className={`${leafText} truncate`}>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Rodapé: usuário + config/ajuda/sair */}
        <div className="border-t border-white/[0.08] p-1.5 flex-shrink-0">
          {/* Usuário */}
          <div
            className={`flex items-center gap-[10px] py-1 ${
              collapsed ? 'px-0 justify-center' : 'px-1 justify-start'
            }`}
          >
            <div className="w-8 h-8 rounded-[6px] grid place-items-center bg-gradient-to-br from-[#A9BE2E] to-[#D2FF00] text-[#0A0E1A] text-[13px] font-bold flex-shrink-0">
              {inicial}
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-[13px] font-semibold text-white tracking-[-0.005em] truncate">
                  {profile?.name}
                </p>
              </div>
            )}
          </div>

          {/* Configurações / Ajuda */}
          <NavLink
            to="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Configurações"
            className={({ isActive }) =>
              `${leafBase} ${collapsed ? 'justify-center' : 'justify-start'} ${
                isActive ? leafActive : leafInactive
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[#D2FF00] rounded-r-[3px]" />
                )}
                <Settings
                  size={18}
                  className={`${collapsed ? '' : 'mr-1.5'} flex-shrink-0 ${isActive ? 'text-[#D2FF00]' : ''}`}
                />
                {!collapsed && <span className={leafText}>Configurações</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/help"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Ajuda"
            className={({ isActive }) =>
              `${leafBase} ${collapsed ? 'justify-center' : 'justify-start'} ${
                isActive ? leafActive : leafInactive
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[#D2FF00] rounded-r-[3px]" />
                )}
                <HelpCircle
                  size={18}
                  className={`${collapsed ? '' : 'mr-1.5'} flex-shrink-0 ${isActive ? 'text-[#D2FF00]' : ''}`}
                />
                {!collapsed && <span className={leafText}>Ajuda</span>}
              </>
            )}
          </NavLink>

          {/* Sair */}
          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className={`${leafBase} ${
              collapsed ? 'justify-center' : 'justify-start'
            } text-[#FF9090] hover:bg-[#DC2626]/10`}
          >
            <LogOut size={18} className={`${collapsed ? '' : 'mr-1.5'} flex-shrink-0`} />
            {!collapsed && <span className={leafText}>Sair do Sistema</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Portal: dropdown do modo colapsado — fora do overflow */}
      {collapsedDropdown &&
        isCollapsed &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key={collapsedDropdown.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'fixed', left: 72, top: collapsedDropdown.top, zIndex: 9999 }}
              className="bg-[#232327] border border-white/[0.08] rounded-[8px] shadow-lg py-2 min-w-[200px] font-gio"
              onClick={(e) => e.stopPropagation()}
            >
              {collapsedDropdown.subItems.map((subItem) => (
                <NavLink
                  key={subItem.path}
                  to={subItem.path!}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-[12.5px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#D2FF00]/[0.14] text-[#D2FF00]'
                        : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
                    }`
                  }
                  onClick={() => {
                    setCollapsedDropdown(null);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <subItem.icon size={16} className="mr-1.5 flex-shrink-0" />
                  <span>{subItem.label}</span>
                </NavLink>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 248 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col fixed h-full z-30 bg-[#1A1A1A] border-r border-white/[0.08]"
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="md:hidden flex flex-col fixed h-full w-[248px] z-50 bg-[#1A1A1A]"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
