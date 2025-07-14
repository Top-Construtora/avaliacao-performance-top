import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

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
  intern_level?: string; // Mudando de number para string
  contract_type?: 'CLT' | 'PJ';
}

export const authService = {
  // Criar novo usuário
  async createUser(userData: CreateUserData) {
    try {
      console.log('authService: Iniciando criação de usuário:', userData.email);

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            position: userData.position,
            is_leader: userData.is_leader,
            is_director: userData.is_director,
            must_reset_password: true, // Forçar redefinição de senha no primeiro login
          }
        }
      });

      if (authError) {
        console.error('authService: Erro ao criar usuário no Auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário - usuário não retornado');
      }

      console.log('authService: Usuário criado no Auth:', authData.user.id);

      // 2. Aguardar um momento para garantir que o usuário foi criado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Criar/atualizar registro na tabela public.users
      const userRecord: any = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        position: userData.position,
        is_leader: userData.is_leader || false,
        is_director: userData.is_director || false,
        phone: userData.phone || null,
        birth_date: userData.birth_date || null,
        join_date: userData.join_date || new Date().toISOString().split('T')[0],
        active: true,
        reports_to: userData.reports_to || null,
        profile_image: userData.profile_image || null,
      };

      // Adicionar campos opcionais apenas se foram fornecidos
      if (userData.department_id) userRecord.department_id = userData.department_id;
      if (userData.track_id) userRecord.track_id = userData.track_id;
      if (userData.position_id) userRecord.position_id = userData.position_id;
      if (userData.intern_level) userRecord.intern_level = userData.intern_level;
      if (userData.contract_type) userRecord.contract_type = userData.contract_type;

      const { error: dbError } = await supabase
        .from('users')
        .upsert(userRecord, {
          onConflict: 'id'
        });

      if (dbError) {
        console.error('authService: Erro ao criar registro em public.users:', dbError);
        // Não lançar erro aqui pois o usuário já foi criado no Auth
        // O trigger pode cuidar disso automaticamente
      } else {
        console.log('authService: Registro criado em public.users');
      }

      // 4. Adicionar usuário aos times, se especificado
      if (userData.team_ids && userData.team_ids.length > 0) {
        const teamMembers = userData.team_ids.map(teamId => ({
          team_id: teamId,
          user_id: authData.user!.id
        }));

        const { error: teamError } = await supabase
          .from('team_members')
          .insert(teamMembers);

        if (teamError) {
          console.error('authService: Erro ao adicionar usuário aos times:', teamError);
          // Não lançar erro, apenas logar
        } else {
          console.log('authService: Usuário adicionado aos times');
        }
      }

      toast.success('Usuário criado com sucesso!');
      return { user: authData.user, error: null };

    } catch (error: any) {
      console.error('authService: Erro ao criar usuário:', error);
      
      // Mensagens de erro personalizadas
      if (error.message?.includes('User already registered')) {
        toast.error('Este email já está cadastrado');
      } else if (error.message?.includes('Password should be at least')) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
      } else if (error.code === '23505') {
        toast.error('Este email já está em uso');
      } else {
        toast.error('Erro ao criar usuário. Verifique os dados e tente novamente.');
      }
      
      return { user: null, error };
    }
  },

  // Verificar se email já existe
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      return !!data;
    } catch (error) {
      console.error('authService: Erro ao verificar email:', error);
      return false;
    }
  },

  // Criar múltiplos usuários (para importação em massa)
  async createMultipleUsers(users: CreateUserData[]) {
    const results = [];
    
    for (const userData of users) {
      const result = await authService.createUser(userData);
      results.push({
        email: userData.email,
        success: !!result.user,
        error: result.error
      });
      
      // Aguardar entre criações para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  },

  // Gerar senha aleatória segura
  generateSecurePassword(): string {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
};