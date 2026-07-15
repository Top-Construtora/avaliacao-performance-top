import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

export const departmentController = {
  async getDepartments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, error } = await req.supabase.from('departments').select('*').order('name');

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getDepartmentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data, error } = await req.supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Departamento não encontrado',
        });
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async createDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description, active = true } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Nome é obrigatório',
        });
      }

      const { data, error } = await req.supabase
        .from('departments')
        .insert([{ name, description, active }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      // Whitelist de campos (anti mass-assignment) — nunca espalhar o corpo cru.
      const { name, description, responsible_id, active } = req.body;
      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (responsible_id !== undefined) updates.responsible_id = responsible_id;
      if (active !== undefined) updates.active = active;

      const { data, error } = await req.supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Departamento não encontrado',
        });
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Pré-check informativo (não-fatal): usuários/times vinculados.
      // Se essas consultas falharem, seguimos direto para o delete e deixamos
      // a captura de FK abaixo tratar — nunca deve virar 500 por causa do check.
      try {
        const [usersRes, teamsRes] = await Promise.all([
          req.supabase.from('profiles').select('id').eq('department_id', id).limit(1),
          req.supabase.from('teams').select('id').eq('department_id', id).limit(1),
        ]);

        if (usersRes.data && usersRes.data.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Não é possível excluir: há usuários vinculados a este departamento.',
          });
        }
        if (teamsRes.data && teamsRes.data.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Não é possível excluir: há times vinculados a este departamento.',
          });
        }
      } catch {
        /* pré-check é apenas informativo; o delete + captura de FK resolvem */
      }

      const { error } = await req.supabase.from('departments').delete().eq('id', id);

      if (error) {
        // Violação de chave estrangeira → 400 amigável em vez de 500
        const code = (error as { code?: string }).code;
        const message = String((error as { message?: string }).message || '');
        if (code === '23503' || /foreign key|violat|constraint/i.test(message)) {
          return res.status(400).json({
            success: false,
            error:
              'Não é possível excluir: existem registros vinculados a este departamento (usuários, times ou avaliações). Remova ou realoque esses vínculos primeiro.',
          });
        }
        throw error;
      }

      res.json({ success: true, message: 'Departamento excluído com sucesso' });
    } catch (error) {
      next(error);
    }
  },
};
