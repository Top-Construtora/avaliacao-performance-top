import { api } from '../config/api';
import { Department } from '../types';

// Interface estendida para incluir propriedades adicionais que podem vir da API
interface DepartmentFromAPI extends Department {
  active?: boolean;
  responsible_id?: string;
  manager_id?: string;
}

class DepartmentsService {
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await api.get('/departments');
      
      // Verifica diferentes estruturas possíveis de resposta
      let rawDepartments: any[] = [];
      
      if (response.data) {
        // Se a resposta tem data.data (estrutura padrão da API)
        if (response.data.data) {
          rawDepartments = Array.isArray(response.data.data) ? response.data.data : [];
        }
        // Se a resposta é diretamente um array em data
        else if (Array.isArray(response.data)) {
          rawDepartments = response.data;
        }
        // Se a resposta tem outra estrutura
        else if (response.data.departments) {
          rawDepartments = Array.isArray(response.data.departments) ? response.data.departments : [];
        }
      }
      
      // Mapear os departamentos para o formato esperado
      const departments = rawDepartments.map(dept => this.mapDepartmentFromApi(dept));
      
      return departments;
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      return [];
    }
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    try {
      const response = await api.get(`/departments/${id}`);
      
      // Verifica diferentes estruturas possíveis
      if (response.data) {
        if (response.data.data) {
          return this.mapDepartmentFromApi(response.data.data);
        }
        if (response.data.id) {
          return this.mapDepartmentFromApi(response.data);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar departamento:', error);
      return null;
    }
  }

  async createDepartment(data: Partial<Department>): Promise<Department> {
    try {
      // Mapear campos se necessário
      const payload = {
        name: data.name,
        description: data.description,
        responsible_id: data.responsibleId, // Mapear de camelCase para snake_case
      };
      
      const response = await api.post('/departments', payload);
      
      // Processar resposta
      if (response.data?.data) {
        return this.mapDepartmentFromApi(response.data.data);
      }
      
      return this.mapDepartmentFromApi(response.data);
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      throw error;
    }
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    try {
      // Mapear campos se necessário
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.responsibleId !== undefined) payload.responsible_id = data.responsibleId;
      
      const response = await api.put(`/departments/${id}`, payload);
      
      // Processar resposta
      if (response.data?.data) {
        return this.mapDepartmentFromApi(response.data.data);
      }
      
      return this.mapDepartmentFromApi(response.data);
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      throw error;
    }
  }

  async deleteDepartment(id: string): Promise<void> {
    try {
      await api.delete(`/departments/${id}`);
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      throw error;
    }
  }

  // Método auxiliar para mapear dados da API para o formato esperado
  private mapDepartmentFromApi(apiData: any): Department {
    return {
      id: apiData.id,
      name: apiData.name,
      description: apiData.description,
      responsibleId: apiData.responsible_id || apiData.responsibleId || apiData.manager_id,
      createdAt: apiData.created_at || apiData.createdAt || new Date().toISOString(),
    };
  }

  // Método para buscar departamentos ativos (retorna todos pois Department não tem campo active)
  async getActiveDepartments(): Promise<Department[]> {
    try {
      const allDepartments = await this.getDepartments();
      
      // Se a API retornar departamentos com campo active, podemos filtrar aqui
      // Por enquanto, retorna todos
      return allDepartments;
    } catch (error) {
      console.error('Erro ao buscar departamentos ativos:', error);
      return [];
    }
  }

  // Método estendido que retorna departamentos com campo active
  async getDepartmentsWithActive(): Promise<DepartmentFromAPI[]> {
    try {
      const response = await api.get('/departments');
      
      let rawDepartments: any[] = [];
      
      if (response.data) {
        if (response.data.data) {
          rawDepartments = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          rawDepartments = response.data;
        }
      }
      
      // Retorna com todas as propriedades incluindo active
      return rawDepartments.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        responsibleId: dept.responsible_id || dept.responsibleId || dept.manager_id,
        createdAt: dept.created_at || dept.createdAt || new Date().toISOString(),
        active: dept.active !== undefined ? dept.active : true, // Default true
        responsible_id: dept.responsible_id,
        manager_id: dept.manager_id
      }));
    } catch (error) {
      console.error('Erro ao buscar departamentos com active:', error);
      return [];
    }
  }

  // Método para buscar departamentos com detalhes adicionais
  async getDepartmentsWithDetails(): Promise<Department[]> {
    try {
      const response = await api.get('/departments?include=responsible,teams,members');
      
      if (response.data?.data) {
        return response.data.data.map((dept: any) => this.mapDepartmentFromApi(dept));
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar departamentos com detalhes:', error);
      return [];
    }
  }

  // Método para buscar departamentos por responsável
  async getDepartmentsByResponsible(responsibleId: string): Promise<Department[]> {
    try {
      const response = await api.get(`/departments?responsible_id=${responsibleId}`);
      
      if (response.data?.data) {
        return response.data.data.map((dept: any) => this.mapDepartmentFromApi(dept));
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar departamentos por responsável:', error);
      return [];
    }
  }
}

export const departmentsService = new DepartmentsService();