import { api } from '../config/api';

export interface Department {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

class DepartmentsService {
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await api.get('/departments');
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      return [];
    }
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    try {
      const response = await api.get(`/departments/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar departamento:', error);
      return null;
    }
  }

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const response = await api.post('/departments', data);
    return response.data.data;
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const response = await api.put(`/departments/${id}`, data);
    return response.data.data;
  }

  async deleteDepartment(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  }
}

export const departmentsService = new DepartmentsService();