import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { AuthRequest } from '../middleware/auth';

export const userController = {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const filters = {
        active: req.query.active === 'true',
        is_leader: req.query.is_leader === 'true',
        is_director: req.query.is_director === 'true',
        reports_to: req.query.reports_to as string,
        currentUserEmail: authReq.user?.email
      };

      const users = await userService.getUsers(filters);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async createUserWithAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, ...userData } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios'
        });
      }

      const user = await userService.createUserWithAuth(email, password, userData);
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getSubordinates(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { leaderId } = req.params;
      const subordinates = await userService.getSubordinates(leaderId, authReq.user?.email);

      res.json({
        success: true,
        data: subordinates
      });
    } catch (error) {
      next(error);
    }
  },

  async resetUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Senha é obrigatória'
        });
      }

      await userService.resetUserPassword(id, password);

      res.json({
        success: true,
        message: 'Senha atualizada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
};