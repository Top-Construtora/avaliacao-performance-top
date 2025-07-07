import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[70vh] p-4 sm:p-6 text-center">
      <h1 className="text-4xl sm:text-6xl font-bold text-blue-600">404</h1>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mt-4">Página não encontrada</h2>
      <p className="text-gray-500 mt-2 max-w-md text-sm sm:text-base px-4">
        A página que você está procurando não existe ou foi removida.
      </p>
      <Link to="/" className="mt-6 sm:mt-8">
        <Button variant="primary" icon={<Home size={16} />}>
          Voltar para o Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;