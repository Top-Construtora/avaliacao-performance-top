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
      className={`bg-white rounded-lg shadow p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} text-white`}>
          {icon}
        </div>
        <div className="ml-5">
          <h3 className="text-lg font-medium text-gray-600">{title}</h3>
          <div className="mt-1">
            <span className="text-2xl font-bold">{value}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;