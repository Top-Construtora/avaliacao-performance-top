import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
  onClick?: () => void;
}

const DashboardCard = ({ title, value, icon, color, onClick }: DashboardCardProps) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow p-4 sm:p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-2 sm:p-3 rounded-full ${color} text-white flex-shrink-0`}>
          <div className="w-5 h-5 sm:w-6 sm:h-6">
            {icon}
          </div>
        </div>
        <div className="ml-3 sm:ml-5 min-w-0 flex-1">
          <h3 className="text-sm sm:text-lg font-medium text-gray-600 truncate">{title}</h3>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-bold">{value}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;