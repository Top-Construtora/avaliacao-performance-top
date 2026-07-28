import { api } from '../config/api';

export interface CulturalCodeItem {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  order_index: number;
}

export interface CulturalCodeSection {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  items: CulturalCodeItem[];
}

export const culturalCodeService = {
  async getAll(): Promise<CulturalCodeSection[]> {
    const response = await api.get('/cultural-code');
    return response.data || response || [];
  },

  async createSection(data: { title: string; description?: string }): Promise<CulturalCodeSection> {
    const response = await api.post('/cultural-code/sections', data);
    return response.data || response;
  },

  async updateSection(
    id: string,
    data: Partial<Pick<CulturalCodeSection, 'title' | 'description' | 'order_index'>>,
  ): Promise<CulturalCodeSection> {
    const response = await api.put(`/cultural-code/sections/${id}`, data);
    return response.data || response;
  },

  async deleteSection(id: string): Promise<void> {
    await api.delete(`/cultural-code/sections/${id}`);
  },

  async createItem(data: {
    section_id: string;
    title: string;
    description?: string;
  }): Promise<CulturalCodeItem> {
    const response = await api.post('/cultural-code/items', data);
    return response.data || response;
  },

  async updateItem(
    id: string,
    data: Partial<Pick<CulturalCodeItem, 'title' | 'description' | 'order_index'>>,
  ): Promise<CulturalCodeItem> {
    const response = await api.put(`/cultural-code/items/${id}`, data);
    return response.data || response;
  },

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/cultural-code/items/${id}`);
  },
};
