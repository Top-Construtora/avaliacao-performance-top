import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errorHandler';

export const authService = {
  async login(email: string, password: string) {
    try {
      console.log('🔐 Tentando fazer login para:', email);
      
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw new ApiError(401, 'Email ou senha inválidos');
      }

      if (!data.user) {
        throw new ApiError(401, 'Usuário não encontrado');
      }

      // Buscar informações adicionais do usuário
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        // Se não encontrar perfil, cria um básico
        const basicProfile = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          position: 'Colaborador',
          is_leader: false,
          is_director: false,
          active: true,
          join_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Tenta criar o perfil
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('users')
          .insert(basicProfile)
          .select()
          .single();
          
        if (createError) {
          console.error('Profile creation error:', createError);
          throw new ApiError(500, 'Erro ao criar perfil de usuário');
        }
        
        console.log('✅ Perfil criado com sucesso');
        
        return {
          user: data.user,
          session: data.session,
          profile: newProfile
        };
      }

      // Verificar se o usuário está ativo
      if (!profile.active) {
        throw new ApiError(403, 'Usuário inativo. Entre em contato com o administrador.');
      }

      console.log('✅ Login bem-sucedido');

      return {
        user: data.user,
        session: data.session,
        profile
      };
    } catch (error: any) {
      console.error('Auth service error:', error);
      throw error;
    }
  },

  async getProfile(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Get profile error:', error);
        throw new ApiError(404, 'Perfil não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  async updateProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        throw new ApiError(400, 'Erro ao atualizar perfil');
      }

      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }
};