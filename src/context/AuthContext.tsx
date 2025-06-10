import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
  phone?: string;
  birth_date?: string;
  join_date: string;
  active: boolean;
  reports_to?: string;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar perfil do usuário no banco
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Erro ao carregar perfil do usuário');
    }
  };

  // Verificar sessão ao carregar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Se for o primeiro login (senha temporária), forçar redefinição
      if (data.user?.user_metadata?.must_reset_password) {
        toast('Por favor, defina uma nova senha');
        // Aqui você pode redirecionar para uma página de redefinição
      } else {
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Mensagens de erro personalizadas
      if (error.message === 'Invalid login credentials') {
        toast.error('Email ou senha inválidos');
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar senha
  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Remover flag de senha temporária
      await supabase.auth.updateUser({
        data: { must_reset_password: false }
      });

      toast.success('Senha atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Resetar senha (enviar email)
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('Email de recuperação enviado!');
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao enviar email de recuperação');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar perfil
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
    updatePassword,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Hook para verificar papéis
export const useUserRole = () => {
  const { profile } = useAuth();

  return {
    isDirector: profile?.is_director || false,
    isLeader: profile?.is_leader || profile?.is_director || false,
    isCollaborator: !profile?.is_leader && !profile?.is_director,
    isActive: profile?.active || false,
    role: profile?.is_director 
      ? 'director' 
      : profile?.is_leader 
      ? 'leader' 
      : 'collaborator',
  };
};