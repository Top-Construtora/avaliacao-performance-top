import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auditService } from '../services/auditService';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  action: z.string().max(100).optional(),
  table_name: z.string().max(100).optional(),
  user_id: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const auditController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Filtros inválidos',
          details: parsed.error.issues,
        });
      }

      const q = parsed.data;
      const result = await auditService.list({
        page: q.page,
        limit: q.limit,
        action: q.action,
        tableName: q.table_name,
        userId: q.user_id,
        search: q.search,
        from: q.from,
        to: q.to,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
