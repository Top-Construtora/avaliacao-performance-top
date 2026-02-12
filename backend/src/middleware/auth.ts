import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { supabaseAdmin } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: Database['public']['Tables']['users']['Row'];
  supabase: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido'
      });
    }

    // Criar cliente Supabase com o token do usuário
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verificar o token e obter o usuário
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('❌ Auth: Token inválido -', error?.message);

      const errorMessage = error?.message?.toLowerCase().includes('expired') ||
                           error?.message?.toLowerCase().includes('invalid')
        ? 'Token expirado ou inválido. Por favor, faça login novamente.'
        : 'Token inválido ou expirado';

      return res.status(401).json({
        success: false,
        error: errorMessage,
        code: error?.code
      });
    }

    // Buscar dados completos do usuário usando supabaseAdmin (bypassa RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('❌ Auth: Usuário não encontrado -', user.id);
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se o usuário está ativo
    if (!userData.active) {
      console.warn('⚠️ Auth: Usuário inativo -', userData.email);
      return res.status(403).json({
        success: false,
        error: 'Usuário inativo'
      });
    }

    // Adicionar user e supabaseAdmin ao request (para bypassar RLS)
    req.user = userData;
    req.supabase = supabaseAdmin;

    next();
  } catch (error: any) {
    console.error('❌ Auth: Erro crítico -', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno no servidor'
    });
  }
};

// Middleware para autorização por roles
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Verificar se o usuário tem uma das roles permitidas
    const userRoles: string[] = [];

    // Admin tem acesso a tudo
    if (req.user.is_admin) {
      userRoles.push('admin');
      return next(); // Admin bypassa todas as verificações
    }

    if (req.user.is_director) userRoles.push('director');
    if (req.user.is_leader) userRoles.push('leader');
    if (!req.user.is_director && !req.user.is_leader) userRoles.push('employee');

    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para acessar este recurso'
      });
    }

    next();
  };
};