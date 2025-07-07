import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errorHandler';

export const authService = {
  async login(email: string, password: string) {
    try {
      
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase auth error:', error); // LOG
        throw new ApiError(401, error.message);
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
        console.error('Profile fetch error:', profileError); // LOG
        // Se não encontrar perfil, cria um básico
        const basicProfile = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.email!.split('@')[0],
          position: 'Colaborador',
          is_leader: false,
          is_director: false,
          active: true,
          created_at: new Date().toISOString()
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
        
        return {
          user: data.user,
          session: data.session,
          profile: newProfile
        };
      }

      return {
        user: data.user,
        session: data.session,
        profile
      };
    } catch (error: any) {
      console.error('Auth service error:', error); // LOG
      throw error;
    }
  },

  async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get profile error:', error); // LOG
      throw new ApiError(404, 'User not found');
    }

    return data;
  }
};