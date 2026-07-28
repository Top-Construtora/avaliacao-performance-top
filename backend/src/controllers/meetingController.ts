import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { meetingService } from '../services/meetingService';
import { notificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';
import { isPrivileged } from '../utils/accessControl';

const createMeetingSchema = z.object({
  type_id: z.string().uuid(),
  title: z.string().max(200).optional().nullable(),
  scheduled_at: z.string().min(10),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  location: z.string().max(300).optional().nullable(),
  meeting_url: z.string().max(500).optional().nullable(),
  participant_ids: z.array(z.string().uuid()).min(1).max(30),
  recurrence: z.enum(['none', 'weekly', 'biweekly', 'monthly']).optional(),
  topics: z.array(z.string().max(500)).max(20).optional(),
});

const updateMeetingSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  scheduled_at: z.string().min(10).optional(),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  location: z.string().max(300).optional().nullable(),
  meeting_url: z.string().max(500).optional().nullable(),
  type_id: z.string().uuid().optional(),
  recurrence: z.enum(['none', 'weekly', 'biweekly', 'monthly']).optional(),
});

function validationError(res: Response, issues: unknown) {
  return res.status(400).json({ success: false, error: 'Dados inválidos', details: issues });
}

function formatMeetingDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export const meetingController = {
  async listTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const types = await meetingService.listTypes(authReq.supabase);
      res.json({ success: true, data: types });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const scope = req.query.scope === 'past' ? 'past' : 'upcoming';
      const meetings = await meetingService.list(
        authReq.supabase,
        authReq.user!.id,
        scope,
        isPrivileged(authReq.user),
        req.query.all === 'true',
      );
      res.json({ success: true, data: meetings });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const meeting = await meetingService.getById(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
        isPrivileged(authReq.user),
      );
      res.json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = createMeetingSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const meeting = await meetingService.create(authReq.supabase, {
        organizerId: authReq.user!.id,
        typeId: parsed.data.type_id,
        title: parsed.data.title,
        scheduledAt: parsed.data.scheduled_at,
        durationMinutes: parsed.data.duration_minutes,
        location: parsed.data.location,
        meetingUrl: parsed.data.meeting_url,
        participantIds: parsed.data.participant_ids,
        recurrence: parsed.data.recurrence,
        topics: parsed.data.topics,
      });

      notificationService
        .send(authReq.supabase, {
          type: 'meeting_scheduled',
          title: 'Reunião agendada',
          message: `${authReq.user!.name} agendou uma reunião com você em ${formatMeetingDate(parsed.data.scheduled_at)}.`,
          targets: parsed.data.participant_ids.map((id) => ({
            type: 'user' as const,
            user_id: id,
          })),
          actor_id: authReq.user!.id,
          action_url: '/meetings',
          entity_type: 'meeting',
          entity_id: meeting.id,
        })
        .catch((err) => console.error('Notification error:', err));

      res.status(201).json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = updateMeetingSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const meeting = await meetingService.update(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
        {
          title: parsed.data.title,
          scheduledAt: parsed.data.scheduled_at,
          durationMinutes: parsed.data.duration_minutes,
          location: parsed.data.location,
          meetingUrl: parsed.data.meeting_url,
          typeId: parsed.data.type_id,
          recurrence: parsed.data.recurrence,
        },
      );

      // Reagendamento notifica os participantes
      if (parsed.data.scheduled_at) {
        const participantIds = await meetingService.getParticipantIds(
          authReq.supabase,
          req.params.id,
        );
        notificationService
          .send(authReq.supabase, {
            type: 'meeting_scheduled',
            title: 'Reunião reagendada',
            message: `${authReq.user!.name} reagendou a reunião para ${formatMeetingDate(parsed.data.scheduled_at)}.`,
            targets: participantIds.map((id) => ({ type: 'user' as const, user_id: id })),
            actor_id: authReq.user!.id,
            action_url: '/meetings',
            entity_type: 'meeting',
            entity_id: req.params.id,
          })
          .catch((err) => console.error('Notification error:', err));
      }

      res.json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  },

  async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const status = req.body?.status;
      if (status !== 'completed' && status !== 'cancelled') {
        return res
          .status(400)
          .json({ success: false, error: "status deve ser 'completed' ou 'cancelled'" });
      }

      const result = await meetingService.setStatus(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
        status,
      );

      if (status === 'cancelled') {
        const participantIds = await meetingService.getParticipantIds(
          authReq.supabase,
          req.params.id,
        );
        notificationService
          .send(authReq.supabase, {
            type: 'meeting_cancelled',
            title: 'Reunião cancelada',
            message: `${authReq.user!.name} cancelou a reunião.`,
            targets: participantIds.map((id) => ({ type: 'user' as const, user_id: id })),
            actor_id: authReq.user!.id,
            action_url: '/meetings',
            entity_type: 'meeting',
            entity_id: req.params.id,
          })
          .catch((err) => console.error('Notification error:', err));
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async addTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 500) : '';
      if (!text) return res.status(400).json({ success: false, error: 'Texto da pauta vazio' });
      const topic = await meetingService.addTopic(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
        text,
      );
      res.status(201).json({ success: true, data: topic });
    } catch (error) {
      next(error);
    }
  },

  async setTopicCovered(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      await meetingService.setTopicCovered(
        authReq.supabase,
        req.params.id,
        req.params.topicId,
        authReq.user!.id,
        !!req.body?.covered,
      );
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const content =
        typeof req.body?.content === 'string' ? req.body.content.trim().slice(0, 5000) : '';
      if (!content) return res.status(400).json({ success: false, error: 'Anotação vazia' });
      const note = await meetingService.addNote(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
        content,
        !!req.body?.is_private,
      );
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  },

  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      await meetingService.deleteNote(
        authReq.supabase,
        req.params.id,
        req.params.noteId,
        authReq.user!.id,
      );
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

  async addTask(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const description =
        typeof req.body?.description === 'string' ? req.body.description.trim().slice(0, 1000) : '';
      if (!description) {
        return res.status(400).json({ success: false, error: 'Descrição da tarefa vazia' });
      }
      const task = await meetingService.addTask(authReq.supabase, req.params.id, authReq.user!.id, {
        description,
        assigneeId: req.body?.assignee_id || null,
        dueDate: req.body?.due_date || null,
      });
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },

  async setTaskDone(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      await meetingService.setTaskDone(
        authReq.supabase,
        req.params.id,
        req.params.taskId,
        authReq.user!.id,
        !!req.body?.done,
      );
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },
};
