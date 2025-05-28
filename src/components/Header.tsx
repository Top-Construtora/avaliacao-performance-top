import { useState } from 'react';
import { Bell, Moon, Sun, User } from 'lucide-react';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, we would apply the dark mode class to the html element
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-3 px-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-primary-600">Avaliação de Desempenho</h1>
      
      <div className="flex items-center space-x-4">
        <button 
          className="p-2 rounded-full hover:bg-primary-50 transition-colors"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? <Sun size={20} className="text-primary-600" /> : <Moon size={20} className="text-primary-600" />}
        </button>
        
        <button className="p-2 rounded-full hover:bg-primary-50 transition-colors relative">
          <Bell size={20} className="text-primary-600" />
          <span className="absolute top-0 right-0 w-4 h-4 bg-accent-500 rounded-full text-white text-xs flex items-center justify-center">
            3
          </span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
            <User size={16} />
          </div>
          <span className="text-sm font-medium hidden md:block text-gray-700">Admin User</span>
        </div>
      </div>
    </header>
  );
};

export default Header;