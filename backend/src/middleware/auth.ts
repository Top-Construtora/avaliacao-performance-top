import { Request, Response, NextFunction } from 'express';
import { createUserClient } from '../config/supabase';
import { ApiError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: any;
  supabase?: any;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Por enquanto, vamos permitir acesso sem token para debug
      console.warn('No token provided, using anonymous access');
      const { supabaseAdmin } = await import('../config/supabase');
      (req as AuthRequest).supabase = supabaseAdmin;
      (req as AuthRequest).user = { id: 'anonymous' };
      return next();
    }

    const supabase = createUserClient(token);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    (req as AuthRequest).user = user;
    (req as AuthRequest).supabase = supabase;
    
    next();
  } catch (error) {
    next(error);
  }
};