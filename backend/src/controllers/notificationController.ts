import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

const updatePreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        category: z.enum([
          'avaliacoes',
          'pdi',
          'pesquisas',
          'entrevistas',
          'carreira',
          'recrutamento',
          'equipe',
          'feedbacks',
        ]),
        email_enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(20),
});

export const notificationController = {
  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const preferences = await notificationService.getPreferences(
        authReq.supabase,
        authReq.user!.id,
      );
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  },

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = updatePreferencesSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Preferências inválidas',
          details: parsed.error.issues,
        });
      }

      await notificationService.updatePreferences(
        authReq.supabase,
        authReq.user!.id,
        parsed.data.preferences,
      );
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

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
        return res
          .status(400)
          .json({ success: false, error: 'ids é obrigatório e deve ser um array' });
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
        return res
          .status(400)
          .json({ success: false, error: 'ids é obrigatório e deve ser um array' });
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
        return res
          .status(400)
          .json({ success: false, error: 'ids é obrigatório e deve ser um array' });
      }

      await notificationService.delete(authReq.supabase, authReq.user!.id, ids);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },
};
