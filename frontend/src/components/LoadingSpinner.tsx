import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  /** Texto exibido abaixo do spinner */
  text?: string;
  /** Altura mínima do container */
  minHeight?: string;
}

/**
 * Componente de loading padronizado do sistema
 * Usar em todas as páginas para manter consistência visual
 */
const LoadingSpinner = ({
  text = 'Carregando dados...',
  minHeight = 'min-h-[400px]',
}: LoadingSpinnerProps) => {
  return (
    <div className={`flex items-center justify-center ${minHeight}`}>
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-900 dark:text-primary-700 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
