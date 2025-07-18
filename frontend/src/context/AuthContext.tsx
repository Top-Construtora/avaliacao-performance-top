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
  resetPassword: (email: string) => Promise<void>;
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
  
  if (profile.email === 'admin@empresa.com' && profile.is_director) {
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
    isActive: profile.active !== false,
    role
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await api.get('/auth/profile');
        if (response.success !== false && response.data) {
          setUser(response.data);
          setProfile(response.data);
          setIsAuthenticated(true);
        } else {
          // Token inválido, limpar
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.success !== false && response.data) {
        const { user, access_token, profile: userProfile } = response.data;
        
        // Salvar token
        localStorage.setItem('access_token', access_token);
        
        // Usar o perfil retornado ou o user como fallback
        const profileData = userProfile || user;
        
        setUser(user);
        setProfile(profileData);
        setIsAuthenticated(true);
        
        toast.success('Login realizado com sucesso!');
        return true;
      }
      
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      return false;
    } catch (error: any) {
      console.error('Error signing in:', error);
      
      // Mensagem de erro mais específica
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Erro ao fazer login. Verifique suas credenciais.';
      
      toast.error(errorMessage);
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
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!profile) return;

    try {
      // Garantir consistência dos dados antes de enviar
      const updateData = { ...updates };
      
      // Se não tem filhos, limpar array de faixas etárias
      if ('has_children' in updateData && !updateData.has_children) {
        updateData.children_age_ranges = [];
      }
      
      // Se não pratica esportes, limpar array de esportes
      if ('practices_sports' in updateData && !updateData.practices_sports) {
        updateData.sports = [];
      }
      
      // Se não torce para time, limpar nome do time
      if ('supports_team' in updateData && !updateData.supports_team) {
        updateData.team_name = null;
      }

      const response = await api.put(`/users/${profile.id}`, updateData);
      if (response.success !== false && response.data) {
        setProfile(response.data);
        // Atualizar também o user se necessário
        if (user && user.id === profile.id) {
          setUser(response.data);
        }
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
      throw error;
    }
  };

  // Add resetPassword implementation
  const resetPassword = async (email: string) => {
    try {
      await api.post('/auth/reset-password', { email });
      toast.success('Email de recuperação enviado!');
    } catch (error) {
      toast.error('Erro ao enviar email de recuperação');
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
    updateProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};