import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../config/api';
import { User } from '../types/user';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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

  if (profile.is_admin) {
    role = 'admin';
  } else if (profile.is_director) {
    role = 'director';
  } else if (profile.is_leader) {
    role = 'leader';
  }

  return {
    isAdmin: profile.is_admin || false,
    isLeader: profile.is_leader || false,
    isDirector: profile.is_director || false,
    isEmployee: !profile.is_admin && !profile.is_leader && !profile.is_director,
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
      // Primeiro verifica se há sessão no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Se houver sessão, busca o perfil do usuário
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && profileData) {
        setUser(profileData);
        setProfile(profileData);
        setIsAuthenticated(true);
        
        // Salva o token no sessionStorage para uso com a API
        // sessionStorage é limpo quando o navegador fecha
        sessionStorage.setItem('access_token', session.access_token);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // Faz login via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message || 'Erro ao fazer login');
        return false;
      }

      if (!data.user || !data.session) {
        toast.error('Erro ao fazer login');
        return false;
      }

      // Busca o perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profileData) {
        toast.error('Erro ao buscar perfil do usuário');
        return false;
      }

      // Verifica se o usuário está ativo
      if (!profileData.active) {
        await supabase.auth.signOut();
        toast.error('Usuário inativo. Entre em contato com o administrador.');
        return false;
      }

      // Salva os dados no sessionStorage (limpo ao fechar navegador)
      sessionStorage.setItem('access_token', data.session.access_token);
      setUser(profileData);
      setProfile(profileData);
      setIsAuthenticated(true);
      
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
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

      // Remover campos que não existem na tabela
      // @ts-ignore
      delete updateData.children_age_ranges;

      // Atualiza no Supabase
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        // Atualizar também o user se necessário
        if (user && user.id === profile.id) {
          setUser(data);
        }
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
      throw error;
    }
  };

  // Add updatePassword implementation
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      console.error('Update password error:', error);
      toast.error(error.message || 'Erro ao alterar senha');
      throw error;
    }
  };

  // Add resetPassword implementation
  const resetPassword = async (email: string) => {
    try {
      // Determina a URL de redirecionamento baseada no ambiente
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
        captchaToken: undefined,
      });

      if (error) {
        throw error;
      }

      toast.success(
        'Email de recuperação enviado! Verifique sua caixa de entrada e pasta de spam.',
        { duration: 6000 }
      );
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Erro ao enviar email de recuperação');
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
    updatePassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};