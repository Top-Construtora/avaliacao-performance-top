import { Bell, Calendar, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 lg:hidden"
            >
              <Menu size={20} />
            </button>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                Sistema de Avaliação de Desempenho
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-gray-500 capitalize truncate">
                  {currentDate}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <button className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
              <Bell size={18} className="sm:w-5 sm:h-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-accent-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-semibold text-gray-700">Admin User</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-semibold shadow-md text-sm sm:text-base">
                AU
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;