import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

export const competencyController = {
  async getOrganizationalCompetencies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, error } = await req.supabase
        .from('organizational_competencies')
        .select('*')
        .order('name');

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getOrganizationalCompetencyById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data, error } = await req.supabase
        .from('organizational_competencies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Competência não encontrada'
        });
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async createOrganizationalCompetency(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description, is_active = true, position } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Nome é obrigatório'
        });
      }

      const { data, error } = await req.supabase
        .from('organizational_competencies')
        .insert([{ name, description, is_active, position }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateOrganizationalCompetency(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await req.supabase
        .from('organizational_competencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Competência não encontrada'
        });
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteOrganizationalCompetency(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await req.supabase
        .from('organizational_competencies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ success: true, message: 'Competência excluída com sucesso' });
    } catch (error) {
      next(error);
    }
  }
};
