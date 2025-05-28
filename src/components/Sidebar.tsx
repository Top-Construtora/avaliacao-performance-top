import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, PieChart, History, User, Settings } from 'lucide-react';

const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Autoavaliação', icon: User, path: '/self-evaluation' },
    { name: 'Avaliações', icon: ClipboardList, path: '/evaluation' },
    { name: 'Relatórios', icon: PieChart, path: '/reports' },
    { name: 'Histórico', icon: History, path: '/history' },
  ];

  return (
    <aside className="w-16 md:w-64 h-screen bg-blue-700 dark:bg-dark-800 flex flex-col transition-colors duration-200">
      <div className="h-16 flex items-center justify-center border-b border-blue-600 dark:border-dark-700">
        <div className="text-white text-xl font-bold hidden md:block">GG Avaliações</div>
        <div className="text-white text-xl font-bold md:hidden">GG</div>
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
                      ? 'bg-blue-800 dark:bg-dark-700 text-white' 
                      : 'text-blue-100 dark:text-gray-300 hover:bg-blue-600 dark:hover:bg-dark-600'
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
        <div className="border-t border-blue-600 dark:border-dark-700 pt-4">
          <NavLink 
            to="/settings" 
            className="flex items-center text-blue-100 dark:text-gray-300 px-4 py-2 hover:bg-blue-600 dark:hover:bg-dark-600 rounded-md transition-colors duration-200"
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