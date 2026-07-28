import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notificationService';
import { emailService, isEmailEnabled, renderNotificationEmail } from '../services/emailService';
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
          'reunioes',
          'learning',
        ]),
        email_enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(20),
});

export const notificationController = {
  /**
   * Diagnóstico de e-mail (admin/diretoria): mostra o que está configurado e,
   * opcionalmente, dispara um e-mail de teste para o próprio usuário.
   * Nunca expõe a senha — só se ela está presente ou não.
   */
  async testEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const config = {
        email_enabled_flag: process.env.EMAIL_ENABLED === 'true',
        host: process.env.EMAIL_HOST || null,
        port: Number(process.env.EMAIL_PORT || 587),
        secure_tls: Number(process.env.EMAIL_PORT || 587) === 465,
        user: process.env.EMAIL_USER || null,
        password_present: !!process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || null,
        frontend_url: process.env.FRONTEND_URL || null,
        jobs_enabled: process.env.ENABLE_JOBS === 'true',
        service_ready: isEmailEnabled(),
      };

      if (!config.service_ready) {
        return res.json({
          success: true,
          data: {
            sent: false,
            reason:
              'Serviço de e-mail desligado. Confira EMAIL_ENABLED=true e as credenciais SMTP.',
            config,
          },
        });
      }

      const to = authReq.user?.email;
      if (!to) {
        return res.status(400).json({ success: false, error: 'Seu usuário não tem e-mail' });
      }

      const html = renderNotificationEmail({
        title: 'Teste de configuração de e-mail',
        message:
          'Se você está lendo isto, o envio de e-mails do GIO está funcionando. Este é um teste manual — nenhuma ação é necessária.',
        actionUrl: '/notifications',
        actionLabel: 'Abrir notificações',
      });

      const sent = await emailService.send(to, 'GIO — Teste de configuração de e-mail', html);

      res.json({
        success: true,
        data: {
          sent,
          to,
          reason: sent ? null : 'O envio falhou. Veja os logs do backend (module: email).',
          config,
        },
      });
    } catch (error) {
      next(error);
    }
  },

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
