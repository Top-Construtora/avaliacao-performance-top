import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { learningService } from '../services/learningService';
import { notificationService } from '../services/notificationService';
import { auditService } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';

const courseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  workload_hours: z.number().min(0).max(9999).optional().nullable(),
  cover_url: z.string().max(500).optional().nullable(),
});

const contentSchema = z.object({
  section: z.string().max(100).optional().nullable(),
  title: z.string().min(2).max(200),
  type: z.enum(['video', 'link', 'file']),
  url: z.string().min(5).max(1000),
  mandatory: z.boolean().optional(),
  position: z.number().int().min(0).max(999).optional(),
});

const classSchema = z.object({
  name: z.string().min(2).max(100),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  allow_late_completion: z.boolean().optional(),
  self_enrollment: z.boolean().optional(),
});

const enrollSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(500),
  mandatory: z.boolean().optional(),
});

const externalCourseSchema = z.object({
  name: z.string().min(2).max(200),
  institution: z.string().max(200).optional().nullable(),
  workload_hours: z.number().min(0).max(9999).optional().nullable(),
  completed_at: z.string().optional().nullable(),
  certificate_url: z.string().max(1000).optional().nullable(),
});

function validationError(res: Response, issues: unknown) {
  return res.status(400).json({ success: false, error: 'Dados inválidos', details: issues });
}

export const learningController = {
  // ===== CURSOS (admin) =====

  async listCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const courses = await learningService.listCourses(authReq.supabase, req.query.all === 'true');
      res.json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  },

  async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = courseSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const course = await learningService.createCourse(authReq.supabase, {
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        workloadHours: parsed.data.workload_hours,
        coverUrl: parsed.data.cover_url,
        createdBy: authReq.user!.id,
      });
      auditService.log(authReq, 'course.created', 'courses', course?.id ?? null, {
        new: { title: parsed.data.title },
      });
      res.status(201).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = courseSchema
        .partial()
        .extend({ active: z.boolean().optional() })
        .safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const course = await learningService.updateCourse(authReq.supabase, req.params.id, {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
        ...(parsed.data.workload_hours !== undefined
          ? { workload_hours: parsed.data.workload_hours }
          : {}),
        ...(parsed.data.cover_url !== undefined ? { cover_url: parsed.data.cover_url } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      });
      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  async getCourseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const course = await learningService.getCourseDetail(authReq.supabase, req.params.id);
      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  async addContent(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = contentSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);
      const content = await learningService.addContent(
        authReq.supabase,
        req.params.id,
        parsed.data,
      );
      res.status(201).json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  },

  async deleteContent(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      await learningService.deleteContent(authReq.supabase, req.params.id, req.params.contentId);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },

  async createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = classSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);
      const cls = await learningService.createClass(authReq.supabase, req.params.id, {
        name: parsed.data.name,
        startDate: parsed.data.start_date,
        endDate: parsed.data.end_date,
        allowLateCompletion: parsed.data.allow_late_completion,
        selfEnrollment: parsed.data.self_enrollment,
      });
      res.status(201).json({ success: true, data: cls });
    } catch (error) {
      next(error);
    }
  },

  async updateClass(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = classSchema
        .partial()
        .extend({ active: z.boolean().optional() })
        .safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);
      const cls = await learningService.updateClass(authReq.supabase, req.params.classId, {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.start_date !== undefined ? { start_date: parsed.data.start_date } : {}),
        ...(parsed.data.end_date !== undefined ? { end_date: parsed.data.end_date } : {}),
        ...(parsed.data.allow_late_completion !== undefined
          ? { allow_late_completion: parsed.data.allow_late_completion }
          : {}),
        ...(parsed.data.self_enrollment !== undefined
          ? { self_enrollment: parsed.data.self_enrollment }
          : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      });
      res.json({ success: true, data: cls });
    } catch (error) {
      next(error);
    }
  },

  async enroll(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = enrollSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const { enrolled } = await learningService.enroll(
        authReq.supabase,
        req.params.classId,
        parsed.data.user_ids,
        parsed.data.mandatory ?? false,
        authReq.user!.id,
      );

      if (enrolled.length > 0) {
        notificationService
          .send(authReq.supabase, {
            type: 'course_enrolled',
            title: 'Você foi inscrito em um curso',
            message: `${authReq.user!.name} inscreveu você em uma turma. Confira em Aprendizado.`,
            targets: enrolled.map((id) => ({ type: 'user' as const, user_id: id })),
            actor_id: authReq.user!.id,
            action_url: '/learning',
            entity_type: 'course_class',
            entity_id: req.params.classId,
          })
          .catch((err) => console.error('Notification error:', err));
      }

      res.json({ success: true, data: { enrolled: enrolled.length } });
    } catch (error) {
      next(error);
    }
  },

  async classOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const overview = await learningService.classOverview(authReq.supabase, req.params.classId);
      res.json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  },

  // ===== ALUNO =====

  async myEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const enrollments = await learningService.myEnrollments(authReq.supabase, authReq.user!.id);
      res.json({ success: true, data: enrollments });
    } catch (error) {
      next(error);
    }
  },

  async enrollmentDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const detail = await learningService.enrollmentDetail(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
      );
      res.json({ success: true, data: detail });
    } catch (error) {
      next(error);
    }
  },

  async setContentDone(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const result = await learningService.setContentDone(
        authReq.supabase,
        req.params.id,
        req.params.contentId,
        authReq.user!.id,
        !!req.body?.done,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async catalog(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const catalog = await learningService.catalog(authReq.supabase, authReq.user!.id);
      res.json({ success: true, data: catalog });
    } catch (error) {
      next(error);
    }
  },

  async selfEnroll(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const enrollment = await learningService.selfEnroll(
        authReq.supabase,
        req.params.classId,
        authReq.user!.id,
      );
      res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
      next(error);
    }
  },

  // ===== CURSOS EXTERNOS =====

  async myExternalCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const courses = await learningService.myExternalCourses(authReq.supabase, authReq.user!.id);
      res.json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  },

  async submitExternalCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const parsed = externalCourseSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error.issues);

      const course = await learningService.submitExternalCourse(
        authReq.supabase,
        authReq.user!.id,
        {
          name: parsed.data.name,
          institution: parsed.data.institution,
          workloadHours: parsed.data.workload_hours,
          completedAt: parsed.data.completed_at,
          certificateUrl: parsed.data.certificate_url,
        },
      );

      notificationService
        .send(authReq.supabase, {
          type: 'external_course_submitted',
          title: 'Curso externo para aprovação',
          message: `${authReq.user!.name} registrou o curso externo "${parsed.data.name}".`,
          targets: [{ type: 'role', role: 'director' }],
          actor_id: authReq.user!.id,
          action_url: '/learning',
          entity_type: 'external_course',
          entity_id: course.id,
          group_key: 'external_course_pending',
          anti_spam: 'aggregate',
        })
        .catch((err) => console.error('Notification error:', err));

      res.status(201).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  async pendingExternalCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const pending = await learningService.pendingExternalCourses(authReq.supabase);
      res.json({ success: true, data: pending });
    } catch (error) {
      next(error);
    }
  },

  async reviewExternalCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const status = req.body?.status;
      if (status !== 'approved' && status !== 'rejected') {
        return res
          .status(400)
          .json({ success: false, error: "status deve ser 'approved' ou 'rejected'" });
      }
      const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 1000) : undefined;

      const course = await learningService.reviewExternalCourse(
        authReq.supabase,
        req.params.id,
        authReq.user!.id,
        status,
        note,
      );

      auditService.log(authReq, `external_course.${status}`, 'external_courses', req.params.id, {
        new: { name: course.name, user_id: course.user_id },
      });

      notificationService
        .send(authReq.supabase, {
          type: 'external_course_reviewed',
          title: status === 'approved' ? 'Curso externo aprovado' : 'Curso externo recusado',
          message:
            status === 'approved'
              ? `Seu curso "${course.name}" foi aprovado e passou a contar no seu histórico.`
              : `Seu curso "${course.name}" foi recusado.${note ? ` Motivo: ${note}` : ''}`,
          targets: [{ type: 'user', user_id: course.user_id }],
          actor_id: authReq.user!.id,
          action_url: '/learning',
          entity_type: 'external_course',
          entity_id: req.params.id,
        })
        .catch((err) => console.error('Notification error:', err));

      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },
};
