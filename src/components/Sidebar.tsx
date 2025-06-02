import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PieChart, 
  History, 
  User, 
  Settings, 
  Target,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navigation = [
    { name: 'Página Inicial', icon: LayoutDashboard, path: '/' },
    { name: 'Autoavaliação', icon: User, path: '/self-evaluation' },
    { name: 'Avaliação do Líder', icon: User, path: '/leader-evaluation' },
    { name: 'Avaliação de Potencial', icon: Target, path: '/potential-evaluation' },
    { name: 'Consenso', icon: Target, path: '/consensus' }, 
    { name: 'Matriz 9 Box', icon: BarChart3, path: '/nine-box' },
    { name: 'Plano de Ação (PDI)', icon: FileText, path: '/action-plan' },
    { name: 'Relatórios', icon: PieChart, path: '/reports' },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col transition-all duration-300 ease-in-out`}>
      <div className="h-16 flex items-center justify-between pl-2 pr-4 border-b border-gray-700/50">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <img 
            src="../../assets/images/logo.png" 
            alt="Logo da empresa" 
            className="h-14 w-auto object-contain"
          />
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 lg:hidden"
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30 shadow-lg shadow-primary-500/10' 
                  : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
              }`
            }
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
            {!isCollapsed && (
              <span className="font-medium">{item.name}</span>
            )}
            {!isCollapsed && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="px-3 py-4 border-t border-gray-700/50">
        <NavLink
          to="/settings"
          className={({ isActive }) => 
            `flex items-center ${isCollapsed ? 'justify-center' : ''} w-full px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30 shadow-lg shadow-primary-500/10' 
                : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
            }`
          }
          title={isCollapsed ? 'Configurações' : undefined}
        >
          <Settings className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium">Configurações</span>}
        </NavLink>
        <button className={`flex items-center ${isCollapsed ? 'justify-center' : ''} w-full px-3 py-2.5 text-gray-300 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 mt-1`}>
          <LogOut className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;