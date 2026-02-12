import { api } from '../config/api';
import type { Department, DepartmentInsert, DepartmentUpdate } from '../types/supabase';

export const departmentService = {
  // Listar todos os departamentos
  async getAll(): Promise<Department[]> {
    try {
      const response = await api.get('/departments');
      // O backend retorna { success: true, data: [...] }
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      return [];
    }
  },

  // Buscar departamento por ID
  async getById(id: string): Promise<Department | null> {
    try {
      const response = await api.get(`/departments/${id}`);
      // O backend retorna { success: true, data: {...} }
      return response.data || response || null;
    } catch (error) {
      console.error('Erro ao buscar departamento:', error);
      return null;
    }
  },

  // Criar departamento
  async create(department: DepartmentInsert): Promise<Department> {
    const response = await api.post('/departments', department);
    return response.data || response;
  },

  // Atualizar departamento
  async update(id: string, department: DepartmentUpdate): Promise<Department> {
    const response = await api.put(`/departments/${id}`, department);
    return response.data || response;
  },

  // Deletar departamento
  async delete(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  },
};
