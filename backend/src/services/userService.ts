// backend/src/services/userService.ts
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errorHandler';
import { User } from '../types';

export const userService = {
  async getUsers(filters?: {
    active?: boolean;
    is_leader?: boolean;
    is_director?: boolean;
    reports_to?: string;
  }) {
    let query = supabaseAdmin.from('users').select('*');

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    if (filters?.is_leader !== undefined) {
      query = query.eq('is_leader', filters.is_leader);
    }
    if (filters?.is_director !== undefined) {
      query = query.eq('is_director', filters.is_director);
    }
    if (filters?.reports_to) {
      query = query.eq('reports_to', filters.reports_to);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw new ApiError(500, 'Failed to fetch users');
    }

    return data;
  },

  async getUserById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new ApiError(404, 'User not found');
    }

    return data;
  },

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    // Validar e preparar os dados
    const userToInsert = {
      ...userData,
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userToInsert)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to create user');
    }

    return data;
  },

  async updateUser(id: string, updates: Partial<User>) {
    // Preparar atualizações incluindo novos campos
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Remover campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to update user');
    }

    return data;
  },

  async deleteUser(id: string) {
    // Verificar se o usuário já está desativado
    const { data: user, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('active')
      .eq('id', id)
      .single();

    if (getUserError) {
      throw new ApiError(404, 'User not found');
    }

    // Se usuário já está desativado (active = false), fazer hard delete
    if (user.active === false) {
      // Deletar em cascata: primeiro os dados relacionados, depois o usuário

      // 1. Deletar avaliações
      await supabaseAdmin.from('self_evaluations').delete().eq('employee_id', id);
      await supabaseAdmin.from('leader_evaluations').delete().eq('employee_id', id);
      await supabaseAdmin.from('leader_evaluations').delete().eq('evaluator_id', id);
      await supabaseAdmin.from('consensus_evaluations').delete().eq('employee_id', id);

      // 2. Deletar PDIs
      await supabaseAdmin.from('development_plans').delete().eq('employee_id', id);

      // 3. Deletar membros de times
      await supabaseAdmin.from('team_members').delete().eq('user_id', id);

      // 4. Remover como responsável de times/departamentos
      await supabaseAdmin.from('teams').update({ responsible_id: null }).eq('responsible_id', id);
      await supabaseAdmin.from('departments').update({ responsible_id: null }).eq('responsible_id', id);

      // 5. Remover reports_to de subordinados
      await supabaseAdmin.from('users').update({ reports_to: null }).eq('reports_to', id);

      // 6. Deletar competências de avaliação
      const { data: selfEvals } = await supabaseAdmin.from('self_evaluations').select('id').eq('employee_id', id);
      const { data: leaderEvals } = await supabaseAdmin.from('leader_evaluations').select('id').eq('employee_id', id);

      const evalIds = [
        ...(selfEvals?.map(e => e.id) || []),
        ...(leaderEvals?.map(e => e.id) || [])
      ];

      if (evalIds.length > 0) {
        await supabaseAdmin.from('evaluation_competencies').delete().in('evaluation_id', evalIds);
      }

      // 7. Finalmente, deletar o usuário
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new ApiError(500, 'Failed to permanently delete user');
      }

      // 8. Deletar do Auth
      await supabaseAdmin.auth.admin.deleteUser(id);
    } else {
      // Se usuário está ativo, fazer soft delete (desativar)
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new ApiError(500, 'Failed to deactivate user');
      }
    }
  },

  async createUserWithAuth(email: string, password: string, userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'email'>) {
    try {
      // Verificar se o email já existe na tabela users
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new ApiError(400, 'Email já cadastrado no sistema');
      }

      // Verificar se já existe um usuário no Auth com este email
      const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();

      let authUserId: string;
      let existingAuthUser = null;

      if (existingAuthUsers && existingAuthUsers.users.length > 0) {
        // Procurar o usuário com o email específico
        existingAuthUser = existingAuthUsers.users.find(
          user => user.email?.toLowerCase() === email.toLowerCase()
        );
      }

      if (existingAuthUser) {
        // Se o usuário já existe no Auth, usar o ID existente
        authUserId = existingAuthUser.id;
        
        // Atualizar a senha se necessário
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            position: userData.position
          }
        });
      } else {
        // Criar usuário no Auth usando Admin API (não cria sessão)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password,
          email_confirm: true, // Confirma o email automaticamente
          user_metadata: {
            name: userData.name,
            position: userData.position
          }
        });

        if (authError || !authData.user) {
          throw new ApiError(500, authError?.message || 'Erro ao criar usuário no sistema de autenticação');
        }

        authUserId = authData.user.id;
      }

      // Verificar se já existe um usuário com este ID na tabela users (pode acontecer se houver inconsistências)
      const { data: existingUserById } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (existingUserById) {
        // Se já existe um usuário com este ID mas com email diferente, há uma inconsistência
        if (existingUserById.email !== email.toLowerCase()) {
          throw new ApiError(500, 'Inconsistência detectada: ID de usuário já existe com email diferente');
        }
        // Se é o mesmo email, atualizar os dados e retornar
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            ...userData,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUserId)
          .select()
          .single();

        if (updateError) {
          throw new ApiError(500, 'Erro ao atualizar usuário existente: ' + updateError.message);
        }

        return updatedUser;
      }

      // Preparar dados do usuário
      const userToInsert = {
        id: authUserId,
        email: email.toLowerCase(),
        ...userData,
        active: true,
        join_date: userData.join_date || new Date().toISOString().split('T')[0]
      };

      // Criar perfil do usuário
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert(userToInsert)
        .select()
        .single();

      if (profileError) {
        // Se houver erro ao criar o perfil, deletar o usuário do Auth apenas se foi criado agora
        if (!existingAuthUser) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        throw new ApiError(500, 'Erro ao criar perfil: ' + profileError.message);
      }

      return userProfile;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Erro ao criar usuário');
    }
  },

  async getSubordinates(leaderId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('reports_to', leaderId)
      .eq('active', true)
      .order('name');

    if (error) {
      throw new ApiError(500, 'Failed to fetch subordinates');
    }

    return data;
  },

  // Novos métodos para estatísticas
  async getUserStatistics() {
    try {
      const { data, error } = await supabaseAdmin.from('users').select('id', { count: 'exact' });

      if(error) {
        throw new ApiError(500, 'Failed to fetch user statistics');
      }

      return {
        totalUsers: data.length
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user statistics');
    }
  }
};