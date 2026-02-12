import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

export const teamController = {
  async getTeams(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, error } = await req.supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getTeamById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data, error } = await req.supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Time não encontrado'
        });
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async createTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, department_id, responsible_id, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Nome é obrigatório'
        });
      }

      const { data, error } = await req.supabase
        .from('teams')
        .insert([{ name, department_id, responsible_id, description }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await req.supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Time não encontrado'
        });
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Primeiro remove todos os membros
      const { error: membersError } = await req.supabase
        .from('team_members')
        .delete()
        .eq('team_id', id);

      if (membersError) throw membersError;

      // Depois deleta o time
      const { error } = await req.supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ success: true, message: 'Time excluído com sucesso' });
    } catch (error) {
      next(error);
    }
  },

  async getTeamMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Buscar membros do time
      const { data: teamMembers, error: membersError } = await req.supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', id);

      if (membersError) throw membersError;

      const userIds = teamMembers?.map((tm: any) => tm.user_id) || [];

      if (userIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Buscar dados dos usuários
      const { data: users, error: usersError } = await req.supabase
        .from('users')
        .select('id, name, email, position, profile_image')
        .in('id', userIds);

      if (usersError) throw usersError;

      res.json({ success: true, data: users || [] });
    } catch (error) {
      next(error);
    }
  },

  async addTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'user_id é obrigatório'
        });
      }

      const { data, error } = await req.supabase
        .from('team_members')
        .insert([{ team_id: id, user_id }])
        .select();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async removeTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;

      const { error } = await req.supabase
        .from('team_members')
        .delete()
        .eq('team_id', id)
        .eq('user_id', userId);

      if (error) throw error;

      res.json({ success: true, message: 'Membro removido com sucesso' });
    } catch (error) {
      next(error);
    }
  },

  async replaceTeamMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { user_ids } = req.body;

      if (!Array.isArray(user_ids)) {
        return res.status(400).json({
          success: false,
          error: 'user_ids deve ser um array'
        });
      }

      // Remove todos os membros atuais
      const { error: deleteError } = await req.supabase
        .from('team_members')
        .delete()
        .eq('team_id', id);

      if (deleteError) throw deleteError;

      // Adiciona os novos membros
      if (user_ids.length > 0) {
        const members = user_ids.map(userId => ({
          team_id: id,
          user_id: userId,
        }));

        const { error: insertError } = await req.supabase
          .from('team_members')
          .insert(members);

        if (insertError) throw insertError;
      }

      res.json({ success: true, message: 'Membros atualizados com sucesso' });
    } catch (error) {
      next(error);
    }
  },

  async getUserTeams(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Buscar os team_ids do usuário
      const { data: teamMemberships, error: memberError } = await req.supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;

      const teamIds = teamMemberships?.map((tm: any) => tm.team_id) || [];

      if (teamIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Buscar os times
      const { data: teams, error: teamsError } = await req.supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)
        .order('name');

      if (teamsError) throw teamsError;

      res.json({ success: true, data: teams || [] });
    } catch (error) {
      next(error);
    }
  },

  // Buscar todos os membros de todos os times (para evitar N+1 queries)
  async getAllTeamMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Buscar todos os relacionamentos team_members
      const { data: teamMembers, error: membersError } = await req.supabase
        .from('team_members')
        .select('team_id, user_id');

      if (membersError) throw membersError;

      if (!teamMembers || teamMembers.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Buscar dados dos usuários únicos
      const userIds = [...new Set(teamMembers.map((tm: any) => tm.user_id))];

      const { data: users, error: usersError } = await req.supabase
        .from('users')
        .select('id, name, email, position, profile_image')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Criar mapa de usuários
      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));

      // Retornar dados agrupados por team_id
      const result = teamMembers.map((tm: any) => ({
        team_id: tm.team_id,
        user: usersMap.get(tm.user_id) || null
      })).filter((item: any) => item.user !== null);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};
