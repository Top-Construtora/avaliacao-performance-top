import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

export const notificationController = {

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { page, limit, filter, type } = req.query;

      const result = await notificationService.getByUser(authReq.supabase, authReq.user!.id, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        filter: (filter as 'all' | 'unread' | 'archived') || 'all',
        type: type as string | undefined,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const count = await notificationService.getUnreadCount(authReq.supabase, authReq.user!.id);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'ids é obrigatório e deve ser um array' });
      }

      await notificationService.markAsRead(authReq.supabase, authReq.user!.id, ids);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      await notificationService.markAllAsRead(authReq.supabase, authReq.user!.id);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'ids é obrigatório e deve ser um array' });
      }

      await notificationService.archive(authReq.supabase, authReq.user!.id, ids);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

  async deleteNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'ids é obrigatório e deve ser um array' });
      }

      await notificationService.delete(authReq.supabase, authReq.user!.id, ids);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },
};
