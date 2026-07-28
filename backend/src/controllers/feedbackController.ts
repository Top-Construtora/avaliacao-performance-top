import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { feedbackService } from '../services/feedbackService';
import { notificationService } from '../services/notificationService';
import { auditService } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';
import { isPrivileged } from '../utils/accessControl';

const createFeedbackSchema = z.object({
  recipient_id: z.string().uuid(),
  type_id: z.string().uuid(),
  message: z.string().min(3).max(5000),
  competencies: z.array(z.string().max(100)).max(10).optional(),
  internal_note: z.string().max(2000).optional().nullable(),
  request_id: z.string().uuid().optional().nullable(),
});

const createTypeSchema = z.object({
  name: z.string().min(2).max(50),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
  restricted_to_admin: z.boolean().optional(),
  position: z.number().int().min(0).max(999).optional(),
});

const updateTypeSchema = createTypeSchema.partial().extend({
  active: z.boolean().optional(),
});

const createRequestSchema = z.object({
  requested_id: z.string().uuid(),
  message: z.string().max(1000).optional(),
});

function validationError(res: Response, issues: unknown) {
  return res.status(400).json({ success: false, error: 'Dados inválidos', details: issues });
}

export const feedbackController = {
  // ===== TIPOS =====

  async listTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const includeInactive = req.query.all === 'true' && isPrivileged(authReq.user);
      const types = await feedbackService.listTypes(authReq.supabase, includeInactive);

      // Tipos restritos não aparecem como opção para usuários comuns
      const visible = isPrivileged(authReq.user)
        ? types
        : types.filter((t: any) => !t.restricted_to_admin);

      res.json({ success: true, data: visible });
    } catch (error) {
      next(error);
    }
  },

  async createType(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = createTypeSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const type = await feedbackService.createType(authReq.supabase, parsed.data);
      auditService.log(authReq, 'feedback_type.created', 'feedback_types', type?.id ?? null, {
        new: parsed.data,
      });
      res.status(201).json({ success: true, data: type });
    } catch (error) {
      next(error);
    }
  },

  async updateType(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = updateTypeSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const type = await feedbackService.updateType(authReq.supabase, req.params.id, parsed.data);
      auditService.log(authReq, 'feedback_type.updated', 'feedback_types', req.params.id, {
        new: parsed.data,
      });
      res.json({ success: true, data: type });
    } catch (error) {
      next(error);
    }
  },

  // ===== FEEDBACKS =====

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = createFeedbackSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const privileged = isPrivileged(authReq.user);
      const feedback = await feedbackService.createFeedback(
        authReq.supabase,
        {
          authorId: authReq.user!.id,
          recipientId: parsed.data.recipient_id,
          typeId: parsed.data.type_id,
          message: parsed.data.message,
          competencies: parsed.data.competencies,
          internalNote: parsed.data.internal_note,
          requestId: parsed.data.request_id,
        },
        privileged,
      );

      // Tipos restritos (ex.: Advertência) entram na trilha de auditoria
      if (feedback?.type?.restricted_to_admin) {
        auditService.log(authReq, 'feedback.restricted_sent', 'feedbacks', feedback.id, {
          new: { recipient_id: parsed.data.recipient_id, type: feedback.type.name },
        });
      }

      notificationService
        .send(authReq.supabase, {
          type: 'feedback_received',
          title: 'Você recebeu um feedback',
          message: `${authReq.user!.name} enviou um feedback para você.`,
          targets: [{ type: 'user', user_id: parsed.data.recipient_id }],
          actor_id: authReq.user!.id,
          action_url: '/feedbacks',
          entity_type: 'feedback',
          entity_id: feedback.id,
        })
        .catch((err) => console.error('Notification error:', err));

      res.status(201).json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const box = req.query.box === 'sent' ? 'sent' : 'received';
      const result = await feedbackService.listForUser(authReq.supabase, authReq.user!.id, box, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        typeId: (req.query.type_id as string) || undefined,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const box = req.query.box === 'sent' ? 'sent' : 'received';
      const result = await feedbackService.summaryForUser(authReq.supabase, authReq.user!.id, box);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const result = await feedbackService.adminList(authReq.supabase, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 25,
        typeId: (req.query.type_id as string) || undefined,
        userId: (req.query.user_id as string) || undefined,
        from: (req.query.from as string) || undefined,
        to: (req.query.to as string) || undefined,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      await feedbackService.markRead(authReq.supabase, req.params.id, authReq.user!.id);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const comment =
        typeof req.body?.comment === 'string' ? req.body.comment.slice(0, 2000) : undefined;

      const feedback = await feedbackService.acknowledge(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
        comment,
      );

      notificationService
        .send(authReq.supabase, {
          type: 'feedback_acknowledged',
          title: 'Feedback confirmado',
          message: `${authReq.user!.name} confirmou o recebimento do seu feedback.`,
          targets: [{ type: 'user', user_id: (feedback as any).author_id }],
          actor_id: authReq.user!.id,
          action_url: '/feedbacks',
          entity_type: 'feedback',
          entity_id: req.params.id,
        })
        .catch((err) => console.error('Notification error:', err));

      res.json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const removed = await feedbackService.deleteFeedback(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
        isPrivileged(authReq.user),
      );
      auditService.log(authReq, 'feedback.deleted', 'feedbacks', req.params.id, {
        old: { author_id: removed.author_id },
      });
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

  // ===== SOLICITAÇÕES =====

  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = createRequestSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const request = await feedbackService.createRequest(
        authReq.supabase,
        authReq.user!.id,
        parsed.data.requested_id,
        parsed.data.message,
      );

      notificationService
        .send(authReq.supabase, {
          type: 'feedback_request_received',
          title: 'Pedido de feedback',
          message: `${authReq.user!.name} pediu um feedback seu.`,
          targets: [{ type: 'user', user_id: parsed.data.requested_id }],
          actor_id: authReq.user!.id,
          action_url: '/feedbacks',
          entity_type: 'feedback_request',
          entity_id: request.id,
        })
        .catch((err) => console.error('Notification error:', err));

      res.status(201).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const result = await feedbackService.listRequests(authReq.supabase, authReq.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async declineRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      await feedbackService.declineRequest(authReq.supabase, req.params.id, authReq.user!.id);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },
};
