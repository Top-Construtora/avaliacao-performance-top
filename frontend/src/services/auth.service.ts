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
  contract_type?: 'CLT' | 'PJ' | 'ESTAGIO';
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
      // Primeiro, verificar se o email já existe - com maybeSingle para evitar erro 406
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error('Email já cadastrado no sistema');
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            position: userData.position
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      const userId = authData.user.id;

      // Aguardar um momento para garantir que o usuário foi criado no Auth
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar se o perfil já foi criado automaticamente pelo trigger
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      // Se o perfil já existe, apenas atualizar
      if (existingProfile) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('users')
          .update({
            name: userData.name,
            position: userData.position,
            is_leader: userData.is_leader || false,
            is_director: userData.is_director || false,
            phone: userData.phone || null,
            birth_date: userData.birth_date || null,
            join_date: userData.join_date || new Date().toISOString().split('T')[0],
            profile_image: userData.profile_image || null,
            reports_to: userData.reports_to || null,
            department_id: userData.department_id || null,
            track_id: userData.track_id || null,
            position_id: userData.position_id || null,
            intern_level: userData.intern_level || null,
            contract_type: userData.contract_type || 'CLT',
            position_start_date: userData.position_start_date || userData.join_date || null,
            // Novos campos
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
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error('Erro ao atualizar perfil: ' + updateError.message);
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

        return { user: updatedProfile, error: null };
      }

      // Se o perfil não existe, criar um novo
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.email.toLowerCase(),
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
          position_start_date: userData.position_start_date || userData.join_date || null,
          // Novos campos
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
        try {
          // Usar admin API se disponível
          await supabase.auth.admin.deleteUser(userId);
        } catch (deleteError) {
          console.error('Erro ao deletar usuário após falha:', deleteError);
        }
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
        .maybeSingle(); // Usar maybeSingle para evitar erro 406

      // Se tiver erro ou não encontrar dados, retorna false
      if (error) {
        console.error('Erro ao verificar email:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  },

  // Função auxiliar para limpar usuários órfãos (sem perfil)
  async cleanupOrphanedAuthUsers() {
    try {
      // Esta função precisa ser executada com privilégios de admin
      // Pode ser chamada periodicamente ou manualmente
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      if (!authUsers || !authUsers.users) return;

      for (const authUser of authUsers.users) {
        // Verificar se existe perfil para este usuário
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();

        // Se não existe perfil, deletar o usuário do Auth
        if (!profile) {
          console.log(`Removendo usuário órfão: ${authUser.email}`);
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar usuários órfãos:', error);
    }
  }
};