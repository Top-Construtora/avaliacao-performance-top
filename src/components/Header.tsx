import { useState } from 'react';
import { Bell, Moon, Sun, User } from 'lucide-react';

const Header = () => {

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-3 px-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-[#1f2937]-600">Avaliação de Desempenho</h1>
      
      <div className="flex items-center space-x-4">
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