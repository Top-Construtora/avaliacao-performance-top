import { Status } from '../types';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  let badgeClass = '';
  let label = '';

  switch (status) {
    case 'pending':
      badgeClass = 'bg-red-100 text-red-800';
      label = 'Pendente';
      break;
    case 'in-progress':
      badgeClass = 'bg-yellow-100 text-yellow-800';
      label = 'Em Andamento';
      break;
    case 'completed':
      badgeClass = 'bg-green-100 text-green-800';
      label = 'Concluída';
      break;
    default:
      badgeClass = 'bg-gray-100 text-gray-800';
      label = status;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;