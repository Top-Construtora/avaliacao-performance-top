import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errorHandler';
import { User } from '../types';

export const userService = {
  async getUsers(filters?: {
    active?: boolean;
    is_leader?: boolean;
    is_director?: boolean;
    reports_to?: string;
  }) {
    let query = supabaseAdmin.from('users').select('*');

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    if (filters?.is_leader !== undefined) {
      query = query.eq('is_leader', filters.is_leader);
    }
    if (filters?.is_director !== undefined) {
      query = query.eq('is_director', filters.is_director);
    }
    if (filters?.reports_to) {
      query = query.eq('reports_to', filters.reports_to);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw new ApiError(500, 'Failed to fetch users');
    }

    return data;
  },

  async getUserById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new ApiError(404, 'User not found');
    }

    return data;
  },

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to create user');
    }

    return data;
  },

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to update user');
    }

    return data;
  },

  async deleteUser(id: string) {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new ApiError(500, 'Failed to delete user');
    }
  },

  async getSubordinates(leaderId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('reports_to', leaderId)
      .eq('active', true)
      .order('name');

    if (error) {
      throw new ApiError(500, 'Failed to fetch subordinates');
    }

    return data;
  }
};