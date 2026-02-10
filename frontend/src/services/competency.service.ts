import { api } from '../config/api';

export interface OrganizationalCompetency {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export const competencyService = {
  // Listar todas as competências organizacionais
  async getOrganizationalCompetencies(): Promise<OrganizationalCompetency[]> {
    try {
      const response = await api.get('/competencies/organizational');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar competências organizacionais:', error);
      return [];
    }
  },

  // Buscar competência por ID
  async getOrganizationalCompetencyById(id: string): Promise<OrganizationalCompetency | null> {
    try {
      const response = await api.get(`/competencies/organizational/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar competência:', error);
      return null;
    }
  },

  // Criar competência
  async createOrganizationalCompetency(data: Omit<OrganizationalCompetency, 'id' | 'created_at' | 'updated_at'>): Promise<OrganizationalCompetency> {
    const response = await api.post('/competencies/organizational', data);
    return response.data;
  },

  // Atualizar competência
  async updateOrganizationalCompetency(id: string, data: Partial<OrganizationalCompetency>): Promise<OrganizationalCompetency> {
    const response = await api.put(`/competencies/organizational/${id}`, data);
    return response.data;
  },

  // Deletar competência
  async deleteOrganizationalCompetency(id: string): Promise<void> {
    await api.delete(`/competencies/organizational/${id}`);
  },
};
