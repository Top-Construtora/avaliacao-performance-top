import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const { signOut: authSignOut } = useAuth();

  const signOut = async () => {
    await authSignOut();
    navigate('/login');
  };

  return { signOut };
};