import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { LoginRequest } from '../types';
import { AuthRequest } from '../middleware/auth';

export const authController = {
  async login(req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction) {
    try {
      
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios'
        });
      }
      
      const result = await authService.login(email, password);
            
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Login error:', error); // LOG
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Logout é feito no frontend, mas podemos adicionar lógica adicional aqui
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }
      
      const profile = await authService.getProfile(userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
};