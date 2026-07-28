import { api } from '../config/api';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  request_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditListFilters {
  page?: number;
  limit?: number;
  action?: string;
  table_name?: string;
  search?: string;
  from?: string;
  to?: string;
}

export const auditApiService = {
  async list(filters: AuditListFilters = {}) {
    const query = new URLSearchParams();
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.action) query.set('action', filters.action);
    if (filters.table_name) query.set('table_name', filters.table_name);
    if (filters.search) query.set('search', filters.search);
    if (filters.from) query.set('from', filters.from);
    if (filters.to) query.set('to', filters.to);

    const queryStr = query.toString();
    const response = await api.get(`/audit${queryStr ? `?${queryStr}` : ''}`);
    const result = response.data || response;

    return {
      data: (result.data || []) as AuditLogEntry[],
      total: result.total || 0,
      page: result.page || 1,
      limit: result.limit || 25,
      totalPages: result.totalPages || 0,
    };
  },
};
