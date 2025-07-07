import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../config/api';
import { User } from '../types/user';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export interface UserRole {
  isAdmin: boolean;
  isLeader: boolean;
  isDirector: boolean;
  isEmployee: boolean;
  isActive: boolean;
  role: 'admin' | 'director' | 'leader' | 'collaborator';
}

export const useUserRole = (): UserRole => {
  const { profile } = useAuth();
  
  if (!profile) {
    return {
      isAdmin: false,
      isLeader: false,
      isDirector: false,
      isEmployee: true,
      isActive: true,
      role: 'collaborator'
    };
  }

  let role: 'admin' | 'director' | 'leader' | 'collaborator' = 'collaborator';
  
  if (profile.email === 'admin@example.com') {
    role = 'admin';
  } else if (profile.is_director) {
    role = 'director';
  } else if (profile.is_leader) {
    role = 'leader';
  }

  return {
    isAdmin: role === 'admin',
    isLeader: profile.is_leader || false,
    isDirector: profile.is_director || false,
    isEmployee: !profile.is_leader && !profile.is_director,
    isActive: profile.active !== false, // assumindo que active é um campo booleano
    role
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  // REMOVIDO: const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await api.get('/auth/profile');
        if (response.success) {
          setUser(response.data);
          setProfile(response.data);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.success) {
        const { user, session, profile } = response.data;
        
        localStorage.setItem('access_token', session.access_token);
        if (session.refresh_token) {
          localStorage.setItem('refresh_token', session.refresh_token);
        }
        
        setUser(user);
        setProfile(profile);
        setIsAuthenticated(true);
        
        toast.success('Login realizado com sucesso!');
        return true; // RETORNA TRUE EM VEZ DE NAVEGAR
      }
      return false;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      // REMOVIDO: navigate('/login');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!profile) return;

    try {
      const response = await api.put(`/users/${profile.id}`, updates);
      if (response.success) {
        setProfile(response.data);
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
      throw error;
    }
  };

  const value = {
    user,
    profile,
    isAuthenticated,
    loading,
    signIn,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};