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
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new ApiError(500, 'Failed to delete user');
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