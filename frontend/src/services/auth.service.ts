import { supabase } from '../lib/supabase';
import { userService } from './user.service';
import { teamService } from './team.service';
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

}

export const authService = {
  async createUser(userData: CreateUserData) {
    try {
      // Primeiro, verificar se o email já existe - usando a API
      const emailExists = await userService.checkEmailExists(userData.email);

      if (emailExists) {
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

      // Verificar se o perfil já foi criado automaticamente pelo trigger - usando a API
      const existingProfile = await userService.getUserById(userId);

      // Preparar dados do usuário
      const userProfileData = {
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
      };

      let userProfile: User;

      // Se o perfil já existe, apenas atualizar
      if (existingProfile) {
        userProfile = await userService.updateUser(userId, userProfileData);
      } else {
        // Se o perfil não existe, criar um novo
        userProfile = await userService.createUser({
          id: userId,
          email: userData.email.toLowerCase(),
          ...userProfileData,
          active: true,
        } as any);
      }

      // Adicionar usuário aos times, se especificado - usando a API
      if (userData.team_ids && userData.team_ids.length > 0) {
        try {
          await userService.addUserToTeams(userId, userData.team_ids);
        } catch (teamError) {
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
      return await userService.checkEmailExists(email);
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  },

  // Função auxiliar para limpar usuários órfãos (sem perfil)
  // NOTA: Esta função precisa ser executada com privilégios de admin
  // e deve ser chamada no backend, não no frontend
  async cleanupOrphanedAuthUsers() {
    try {
      // Esta função precisa ser executada com privilégios de admin
      // Pode ser chamada periodicamente ou manualmente
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      if (!authUsers || !authUsers.users) return;

      for (const authUser of authUsers.users) {
        // Verificar se existe perfil para este usuário - usando a API
        try {
          const profile = await userService.getUserById(authUser.id);

          // Se não existe perfil, deletar o usuário do Auth
          if (!profile) {
            console.log(`Removendo usuário órfão: ${authUser.email}`);
            await supabase.auth.admin.deleteUser(authUser.id);
          }
        } catch (error) {
          // Se o getUserById retornar erro 404, significa que não existe perfil
          console.log(`Removendo usuário órfão: ${authUser.email}`);
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar usuários órfãos:', error);
    }
  }
};
