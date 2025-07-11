import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

export const departmentController = {
  async getDepartments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, error } = await req.supabase
        .from('departments')
        .select('*')
        .order('name');

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
          error: 'Departamento não encontrado' 
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
          error: 'Nome é obrigatório' 
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
      const updates = req.body;

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
          error: 'Departamento não encontrado' 
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

      // Verificar se existem usuários no departamento
      const { data: users, error: usersError } = await req.supabase
        .from('profiles')
        .select('id')
        .eq('department_id', id)
        .limit(1);

      if (usersError) throw usersError;

      if (users && users.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Não é possível excluir departamento com usuários vinculados' 
        });
      }

      const { error } = await req.supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ success: true, message: 'Departamento excluído com sucesso' });
    } catch (error) {
      next(error);
    }
  }
};