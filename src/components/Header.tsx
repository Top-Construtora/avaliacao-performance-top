import { useState } from 'react';
import { Bell, Moon, Sun, User, Calendar } from 'lucide-react';

const Header = () => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sistema de Avaliação de Desempenho</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-500 capitalize">{currentDate}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 bg-accent-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-700">Admin User</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-semibold shadow-md">
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