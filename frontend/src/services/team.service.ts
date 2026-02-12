import { api } from '../config/api';
import type { Team, TeamInsert, TeamUpdate } from '../types/supabase';

export const teamService = {
  // Listar todos os times
  async getAll(): Promise<Team[]> {
    try {
      const response = await api.get('/teams');
      // O backend retorna { success: true, data: [...] }
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar times:', error);
      return [];
    }
  },

  // Buscar time por ID
  async getById(id: string): Promise<Team | null> {
    try {
      const response = await api.get(`/teams/${id}`);
      // O backend retorna { success: true, data: {...} }
      return response.data || response || null;
    } catch (error) {
      console.error('Erro ao buscar time:', error);
      return null;
    }
  },

  // Criar time
  async create(team: TeamInsert): Promise<Team> {
    const response = await api.post('/teams', team);
    return response.data || response;
  },

  // Atualizar time
  async update(id: string, team: TeamUpdate): Promise<Team> {
    const response = await api.put(`/teams/${id}`, team);
    return response.data || response;
  },

  // Deletar time
  async delete(id: string): Promise<void> {
    await api.delete(`/teams/${id}`);
  },

  // Buscar membros de um time
  async getMembers(teamId: string): Promise<any[]> {
    try {
      const response = await api.get(`/teams/${teamId}/members`);
      // O backend retorna { success: true, data: [...] }
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar membros do time:', error);
      return [];
    }
  },

  // Adicionar membro ao time
  async addMember(teamId: string, userId: string): Promise<void> {
    await api.post(`/teams/${teamId}/members`, { user_id: userId });
  },

  // Remover membro do time
  async removeMember(teamId: string, userId: string): Promise<void> {
    await api.delete(`/teams/${teamId}/members/${userId}`);
  },

  // Substituir todos os membros do time
  async replaceMembers(teamId: string, userIds: string[]): Promise<void> {
    await api.put(`/teams/${teamId}/members`, { user_ids: userIds });
  },

  // Buscar times de um usuário
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const response = await api.get(`/teams/user/${userId}`);
      // O backend retorna { success: true, data: [...] }
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar times do usuário:', error);
      return [];
    }
  },

  // Buscar todos os membros de todos os times (batch - evita N+1 queries)
  async getAllMembers(): Promise<{ team_id: string; user: any }[]> {
    try {
      const response = await api.get('/teams/members/all');
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar todos os membros:', error);
      return [];
    }
  }
};
