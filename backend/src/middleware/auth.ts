import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

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
    console.log('🔐 Auth middleware - Iniciando autenticação');
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ Auth middleware - Token não fornecido');
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido'
      });
    }

    console.log('✅ Auth middleware - Token encontrado');

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

    console.log('📡 Auth middleware - Verificando token com Supabase');
    // Verificar o token e obter o usuário
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('❌ Auth middleware - Token inválido:', error?.message);
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    console.log('✅ Auth middleware - Usuário autenticado:', user.id);
    console.log('📡 Auth middleware - Buscando dados do usuário na tabela');

    // Buscar dados completos do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.log('❌ Auth middleware - Usuário não encontrado:', userError?.message);
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    console.log('✅ Auth middleware - Dados do usuário encontrados');

    // Adicionar user e supabase ao request
    req.user = userData;
    req.supabase = supabase;

    console.log('✅ Auth middleware - Autenticação concluída com sucesso');
    next();
  } catch (error: any) {
    console.error('❌ Auth middleware - Erro crítico:', error);
    console.error('Stack:', error.stack);
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