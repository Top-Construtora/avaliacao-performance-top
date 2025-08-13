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
      badgeClass = 'bg-red-500/10 text-red-500 border border-red-500/20';
      label = 'Pendente';
      break;
    case 'in-progress':
      badgeClass = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      label = 'Em Andamento';
      break;
    case 'completed':
      badgeClass = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      label = 'Concluída';
      break;
    default:
      badgeClass = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      label = status;
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${badgeClass} ${className} whitespace-nowrap`}>
      {label}
    </span>
  );
};

export default StatusBadge;