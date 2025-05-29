import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, PieChart, History, User, Settings } from 'lucide-react';

const Sidebar = () => {
  const navigation = [
    { name: 'Página Inicial', icon: LayoutDashboard, path: '/' },
    { name: 'Autoavaliação', icon: User, path: '/self-evaluation' },
    { name: 'Avaliação do Líder', icon: User, path: '/leader-evaluation' },
    { name: 'Avaliações', icon: ClipboardList, path: '/evaluation' },
    { name: 'Relatórios', icon: PieChart, path: '/reports' },
    { name: 'Histórico', icon: History, path: '/history' },
  ];

  return (
    <aside className="w-16 md:w-64 h-screen bg-[#1f2937] flex flex-col transition-colors duration-200">
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <div className="text-white text-xl font-bold hidden md:block">GIO</div>
        <div className="text-white text-xl font-bold md:hidden"></div>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 mx-2 rounded-md transition-colors duration-200 ${
                    isActive 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="ml-3 hidden md:block">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 mt-auto">
        <div className="border-t border-gray-700 pt-4">
          <NavLink 
            to="/settings" 
            className="flex items-center text-gray-300 px-4 py-2 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="ml-3 hidden md:block">Configurações</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;