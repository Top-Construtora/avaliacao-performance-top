import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface UserProfile {
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
  department?: string;
  location?: string;
  biography?: string;
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

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        
        // Se o usuário não existe na tabela public.users, tenta criar
        if (error.code === 'PGRST116') {
          const authUser = await supabase.auth.getUser();
          if (authUser.data.user) {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authUser.data.user.id,
                email: authUser.data.user.email!,
                name: authUser.data.user.user_metadata?.name || authUser.data.user.email!.split('@')[0],
                position: authUser.data.user.user_metadata?.position || 'Colaborador',
                is_director: authUser.data.user.user_metadata?.is_director || false,
                is_leader: authUser.data.user.user_metadata?.is_leader || false,
                active: true,
                join_date: new Date().toISOString().split('T')[0]
              });

            if (!insertError) {
              // Tentar buscar novamente
              const { data: newProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
              
              if (newProfile) {
                setProfile(newProfile);
                return;
              }
            }
          }
        }
        
        throw error;
      }
      
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
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
        toast('Por favor, defina uma nova senha', {
          icon: '🔑',
          duration: 5000
        });
      } else {
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      
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
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
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