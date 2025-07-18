// frontend/src/services/auth.service.ts
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  position: string;
  is_leader?: boolean;
  is_director?: boolean;
  phone?: string;
  birth_date?: string;
  join_date?: string;
  profile_image?: string;
  reports_to?: string;
  team_ids?: string[];
  department_id?: string;
  track_id?: string;
  position_id?: string;
  intern_level?: string;
  contract_type?: 'CLT' | 'PJ';
  admission_date?: string;
  position_start_date?: string;
  
  // Novos campos de perfil pessoal
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informar';
  has_children?: boolean;
  children_age_ranges?: string[];
  marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar';
  hobbies?: string;
  favorite_color?: string;
  supports_team?: boolean;
  team_name?: string;
  practices_sports?: boolean;
  sports?: string[];
}

export const authService = {
  async createUser(userData: CreateUserData) {
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      const userId = authData.user.id;

      // Criar perfil do usuário na tabela users
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          name: userData.name,
          position: userData.position,
          is_leader: userData.is_leader || false,
          is_director: userData.is_director || false,
          phone: userData.phone || null,
          birth_date: userData.birth_date || null,
          join_date: userData.join_date || new Date().toISOString().split('T')[0],
          profile_image: userData.profile_image || null,
          reports_to: userData.reports_to || null,
          active: true,
          department_id: userData.department_id || null,
          track_id: userData.track_id || null,
          position_id: userData.position_id || null,
          intern_level: userData.intern_level || null,
          contract_type: userData.contract_type || 'CLT',
          admission_date: userData.admission_date || userData.join_date || null,
          position_start_date: userData.position_start_date || userData.join_date || null,
          
          // Novos campos de perfil pessoal
          gender: userData.gender || null,
          has_children: userData.has_children || false,
          children_age_ranges: userData.has_children ? (userData.children_age_ranges || []) : [],
          marital_status: userData.marital_status || null,
          hobbies: userData.hobbies || null,
          favorite_color: userData.favorite_color || null,
          supports_team: userData.supports_team || false,
          team_name: userData.supports_team ? userData.team_name : null,
          practices_sports: userData.practices_sports || false,
          sports: userData.practices_sports ? (userData.sports || []) : [],
        })
        .select()
        .single();

      if (profileError) {
        // Se houver erro ao criar o perfil, deletar o usuário do Auth
        await supabase.auth.admin.deleteUser(userId);
        throw new Error('Erro ao criar perfil: ' + profileError.message);
      }

      // Adicionar usuário aos times, se especificado
      if (userData.team_ids && userData.team_ids.length > 0) {
        const teamMembers = userData.team_ids.map(teamId => ({
          team_id: teamId,
          user_id: userId,
        }));

        const { error: teamError } = await supabase
          .from('team_members')
          .insert(teamMembers);

        if (teamError) {
          console.error('Erro ao adicionar usuário aos times:', teamError);
        }
      }

      return { user: userProfile, error: null };
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      return { user: null, error: error.message };
    }
  },

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      return !!data && !error;
    } catch {
      return false;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Buscar dados completos do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('Perfil não encontrado');
      }

      return { user: userProfile, session: data.session, error: null };
    } catch (error: any) {
      return { user: null, session: null, error: error.message };
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return userProfile;
    } catch {
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    try {
      // Garantir consistência dos dados
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

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  },
};