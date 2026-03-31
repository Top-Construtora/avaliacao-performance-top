import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../config/api';
import { User } from '../types/user';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { userService } from '../services/user.service';

interface AuthContextType {
  user: User | null;
  profile: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithMicrosoft: () => Promise<void>;
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
  const [sessionExpired, setSessionExpired] = useState(false);
  const isFetchingProfileRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const profileRef = useRef<User | null>(null);
  const isCheckingAuthRef = useRef(false);

  // Manter profileRef sincronizado com profile
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    // Resetar as refs quando o componente monta
    isFetchingProfileRef.current = false;
    hasInitializedRef.current = false;
    isCheckingAuthRef.current = false;

    checkAuth();

    // Configurar listener para renovação automática de token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('✅ Token renovado automaticamente');
          // Atualizar token no localStorage quando o Supabase renovar automaticamente
          localStorage.setItem('access_token', session.access_token);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuário deslogado');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          isFetchingProfileRef.current = false;
          hasInitializedRef.current = false;
          isCheckingAuthRef.current = false;
        } else if (event === 'SIGNED_IN' && session) {
          console.log('👤 Evento SIGNED_IN detectado');
          localStorage.setItem('access_token', session.access_token);

          // Ignorar durante checkAuth inicial
          if (isCheckingAuthRef.current) {
            console.log('⏭️ checkAuth em andamento, ignorando evento SIGNED_IN');
            return;
          }

          // IMPORTANTE: Durante signIn manual, isFetchingProfileRef estará true
          // Isso significa que o perfil já está sendo buscado pela função signIn
          // e devemos ignorar este evento para evitar duplicação
          if (isFetchingProfileRef.current) {
            console.log('⏭️ Login manual em andamento, ignorando evento SIGNED_IN');
            return;
          }

          // Se já temos um perfil carregado do mesmo usuário, ignorar
          // Isso evita buscas duplicadas no carregamento inicial da página
          if (profileRef.current && profileRef.current.id === session.user.id) {
            console.log('✅ Perfil já carregado, ignorando evento SIGNED_IN');
            return;
          }

          // Este ponto só deve ser alcançado para:
          // 1. Login OAuth (Microsoft)
          // 2. Refresh de sessão sem perfil carregado
          console.log('🔄 Buscando perfil do usuário via evento SIGNED_IN');

          const fetchProfile = async () => {
            try {
              const profileData = await userService.getUserById(session.user.id);

              if (profileData) {
                // Verifica se o usuário está ativo
                if (!profileData.active) {
                  await supabase.auth.signOut();
                  toast.error('Usuário inativo. Entre em contato com o administrador.');
                  return;
                }

                setUser(profileData);
                setProfile(profileData);
                setIsAuthenticated(true);
                toast.success('Login realizado com sucesso!');
              } else {
                console.error('Perfil não encontrado');
                toast.error('Usuário não encontrado no sistema. Entre em contato com o administrador.');
                await supabase.auth.signOut();
              }
            } catch (err) {
              console.error('Erro ao processar perfil:', err);
              toast.error('Erro ao buscar perfil. Entre em contato com o administrador.');
              await supabase.auth.signOut();
            }
          };

          fetchProfile();
        }
      }
    );

    // Cleanup: remover listener quando componente desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    console.log('🔍 Verificando autenticação inicial...');
    isCheckingAuthRef.current = true;

    // Timeout de 5 segundos para não deixar o usuário preso no loading
    const timeoutPromise = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), 5000)
    );

    const authCheckPromise = (async () => {
      // Primeiro verifica se há sessão cached no localStorage
      const { data: { session: cachedSession } } = await supabase.auth.getSession();

      if (!cachedSession) {
        console.log('❌ Nenhuma sessão encontrada');
        return;
      }

      console.log('✅ Sessão cached encontrada, validando com servidor...');

      // Validar token com o servidor do Supabase (getUser faz refresh automático se expirado)
      let validSession = cachedSession;
      const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !validatedUser) {
        console.warn('⚠️ Token expirado ou inválido, tentando refresh explícito...');

        // Tentar refresh explícito como fallback
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession) {
          console.error('❌ Refresh falhou, sessão expirada:', refreshError?.message);
          setSessionExpired(true);
          await supabase.auth.signOut();
          return;
        }

        console.log('✅ Sessão renovada via refresh');
        validSession = refreshedSession;
      } else {
        // getUser validou com sucesso, pegar sessão atualizada
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          validSession = currentSession;
        }
      }

      console.log('✅ Token válido, buscando perfil...');

      // Salvar token validado antes de buscar perfil
      localStorage.setItem('access_token', validSession.access_token);

      try {
        const profileData = await userService.getUserById(validSession.user.id);

        if (profileData) {
          if (!profileData.active) {
            console.warn('⚠️ Usuário inativo detectado no checkAuth');
            await supabase.auth.signOut();
            return;
          }

          console.log('✅ Perfil carregado no checkAuth');
          setUser(profileData);
          setProfile(profileData);
          setIsAuthenticated(true);
        } else {
          console.error('❌ Perfil não encontrado no checkAuth');
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('❌ Erro ao buscar perfil no checkAuth:', error);
        await supabase.auth.signOut();
      }
    })();

    try {
      const result = await Promise.race([authCheckPromise, timeoutPromise]);

      if (result === 'timeout') {
        console.error('⏱️ checkAuth timeout após 5s, redirecionando para login');
        setSessionExpired(true);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        try { await supabase.auth.signOut(); } catch {}
      }
    } catch (error) {
      console.error('❌ Falha no checkAuth:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      console.log('✅ checkAuth finalizado, loading = false');
      setLoading(false);
      hasInitializedRef.current = true;
      isCheckingAuthRef.current = false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Marca que o signIn está processando ANTES de fazer qualquer chamada
    // Isso garante que o listener SIGNED_IN veja e ignore o evento
    isFetchingProfileRef.current = true;

    try {
      setSessionExpired(false);
      console.log('🔐 Iniciando login manual...');

      // Faz login via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Erro ao fazer login:', error.message);
        toast.error(error.message || 'Erro ao fazer login');
        return false;
      }

      if (!data.user || !data.session) {
        console.error('❌ Login sem dados de usuário ou sessão');
        toast.error('Erro ao fazer login');
        return false;
      }

      console.log('✅ Login bem-sucedido, buscando perfil...');

      // Aguardar um pouco para garantir que o evento SIGNED_IN foi disparado e ignorado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Busca o perfil do usuário usando a API
      let profileData: User | null = null;
      try {
        profileData = await userService.getUserById(data.user.id);
      } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        toast.error('Erro ao buscar perfil do usuário');
        await supabase.auth.signOut();
        return false;
      }

      if (!profileData) {
        console.error('❌ Perfil não encontrado');
        toast.error('Perfil não encontrado no sistema');
        await supabase.auth.signOut();
        return false;
      }

      // Verifica se o usuário está ativo
      if (!profileData.active) {
        console.warn('⚠️ Usuário inativo');
        await supabase.auth.signOut();
        toast.error('Usuário inativo. Entre em contato com o administrador.');
        return false;
      }

      console.log('✅ Perfil carregado com sucesso, configurando estado...');

      // Salva os dados no localStorage para permitir refresh automático
      localStorage.setItem('access_token', data.session.access_token);
      setUser(profileData);
      setProfile(profileData);
      setIsAuthenticated(true);
      hasInitializedRef.current = true;

      console.log('🎉 Login completado com sucesso!');
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('❌ Exceção no signIn:', error);
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      return false;
    } finally {
      // Sempre resetar a ref, mesmo em caso de erro
      console.log('🔓 Liberando lock de login (finally)');
      isFetchingProfileRef.current = false;
    }
  };

  const signInWithMicrosoft = async (): Promise<void> => {
    try {
      setSessionExpired(false);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email User.Read offline_access',
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Microsoft OAuth error:', error);
        toast.error('Erro ao iniciar login com Microsoft');
        throw error;
      }
    } catch (error: any) {
      console.error('Error signing in with Microsoft:', error);
      toast.error('Erro ao fazer login com Microsoft');
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
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

      // Remover campos que não existem na tabela
      // @ts-ignore
      delete updateData.children_age_ranges;

      // Atualiza usando a API
      const data = await userService.updateUser(profile.id, updateData);

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
    sessionExpired,
    signIn,
    signInWithMicrosoft,
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