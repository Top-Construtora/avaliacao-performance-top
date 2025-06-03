import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PieChart, 
  History, 
  User, 
  UserPlus,
  Settings, 
  Target,
  FileText,
  BarChart3,
  LogOut,
  X
} from 'lucide-react';
import logo from '../../assets/images/logo.png';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const navigation = [
    { name: 'Página Inicial', icon: LayoutDashboard, path: '/' },
    { name: 'Cadastro de Usuários', icon: UserPlus, path: '/users' }, 
    { name: 'Autoavaliação', icon: User, path: '/self-evaluation' },
    { name: 'Avaliação do Líder', icon: User, path: '/leader-evaluation' },
    { name: 'Avaliação de Potencial', icon: Target, path: '/potential-evaluation' },
    { name: 'Consenso', icon: Target, path: '/consensus' }, 
    { name: 'Matriz 9 Box', icon: BarChart3, path: '/nine-box' },
    { name: 'Plano de Ação (PDI)', icon: FileText, path: '/action-plan' },
    { name: 'Relatórios', icon: PieChart, path: '/reports' },
  ];

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50">
        <div className="flex items-center">
          <img 
            src={logo} 
            alt="Logo da empresa" 
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>
        {/* Close button - visible only on mobile */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 lg:hidden"
        >
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) => 
              `flex items-center px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30 shadow-lg shadow-primary-500/10' 
                  : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium text-sm lg:text-base truncate">{item.name}</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </NavLink>
        ))}
      </nav>
      
      <div className="px-3 py-4 border-t border-gray-700/50 space-y-1">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={({ isActive }) => 
            `flex items-center w-full px-3 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30 shadow-lg shadow-primary-500/10' 
                : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium text-sm lg:text-base">Configurações</span>
        </NavLink>
        <button className="flex items-center w-full px-3 py-3 text-gray-300 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200">
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium text-sm lg:text-base">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;