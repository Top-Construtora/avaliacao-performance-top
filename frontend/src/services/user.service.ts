import { api } from '../config/api';
import { User } from '../types/user';

export const userService = {
  async getUsers(filters?: {
    active?: boolean;
    is_leader?: boolean;
    is_director?: boolean;
    is_leader_or_director?: boolean;
    reports_to?: string;
  }): Promise<User[]> {
    const queryParams = new URLSearchParams(
      Object.entries(filters || {}).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    const response = await api.get(`/users?${queryParams}`);
    // O backend retorna { success: true, data: [...] }
    return response.data || response || [];
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    // O backend retorna { success: true, data: {...} }
    return response.data || response;
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const response = await api.post('/users', user);
    return response.data || response;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, updates);
    return response.data || response;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getSubordinates(leaderId: string): Promise<User[]> {
    const response = await api.get(`/users/leader/${leaderId}/subordinates`);
    return response.data || response || [];
  },

  async createUserWithAuth(userData: any): Promise<User> {
    const response = await api.post('/auth/register', userData);
    return response.data || response;
  },

  async checkEmailExists(email: string): Promise<boolean> {
    const response = await api.get(`/users/check-email/${encodeURIComponent(email)}`);
    // O backend retorna { success: true, data: { exists: boolean } }
    return response.data?.exists ?? response.exists ?? false;
  },

  async addUserToTeams(userId: string, teamIds: string[]): Promise<void> {
    await api.post(`/users/${userId}/teams`, { teamIds });
  }
};