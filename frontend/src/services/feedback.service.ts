import { api } from '../config/api';

export interface FeedbackType {
  id: string;
  name: string;
  color: string;
  icon: string;
  restricted_to_admin: boolean;
  active: boolean;
  position: number;
}

export interface FeedbackUserRef {
  id: string;
  name: string;
  position: string | null;
  profile_image?: string | null;
}

export interface Feedback {
  id: string;
  author_id: string;
  recipient_id: string;
  message: string;
  competencies: string[];
  internal_note?: string | null;
  request_id: string | null;
  read_at: string | null;
  acknowledged_at: string | null;
  recipient_comment: string | null;
  created_at: string;
  author: FeedbackUserRef | null;
  recipient: FeedbackUserRef | null;
  type: Pick<FeedbackType, 'id' | 'name' | 'color' | 'icon' | 'restricted_to_admin'> | null;
}

export interface FeedbackRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  message: string | null;
  status: 'pending' | 'fulfilled' | 'declined';
  feedback_id: string | null;
  created_at: string;
  requester: FeedbackUserRef | null;
  requested: FeedbackUserRef | null;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function unwrap(response: any) {
  return response.data || response;
}

export const feedbackApiService = {
  async listTypes(all = false): Promise<FeedbackType[]> {
    const response = await api.get(`/feedbacks/types${all ? '?all=true' : ''}`);
    return unwrap(response) || [];
  },

  async createType(data: Partial<FeedbackType>): Promise<FeedbackType> {
    const response = await api.post('/feedbacks/types', data);
    return unwrap(response);
  },

  async updateType(id: string, data: Partial<FeedbackType>): Promise<FeedbackType> {
    const response = await api.put(`/feedbacks/types/${id}`, data);
    return unwrap(response);
  },

  async list(box: 'received' | 'sent', page = 1, typeId?: string): Promise<Paginated<Feedback>> {
    const query = new URLSearchParams({ box, page: String(page) });
    if (typeId) query.set('type_id', typeId);
    const response = await api.get(`/feedbacks?${query.toString()}`);
    return unwrap(response);
  },

  async summary(
    box: 'received' | 'sent',
  ): Promise<{ total: number; by_type: Record<string, number> }> {
    const response = await api.get(`/feedbacks/summary?box=${box}`);
    return unwrap(response) || { total: 0, by_type: {} };
  },

  async adminList(filters: {
    page?: number;
    type_id?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<Paginated<Feedback>> {
    const query = new URLSearchParams();
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.type_id) query.set('type_id', filters.type_id);
    if (filters.from) query.set('from', filters.from);
    if (filters.to) query.set('to', filters.to);
    const response = await api.get(`/feedbacks/admin?${query.toString()}`);
    return unwrap(response);
  },

  async create(data: {
    recipient_id: string;
    type_id: string;
    message: string;
    competencies?: string[];
    internal_note?: string;
    request_id?: string;
  }): Promise<Feedback> {
    const response = await api.post('/feedbacks', data);
    return unwrap(response);
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/feedbacks/${id}/read`, {});
  },

  async acknowledge(id: string, comment?: string): Promise<void> {
    await api.patch(`/feedbacks/${id}/acknowledge`, { comment });
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/feedbacks/${id}`);
  },

  async listRequests(): Promise<{ received: FeedbackRequest[]; sent: FeedbackRequest[] }> {
    const response = await api.get('/feedbacks/requests');
    return unwrap(response) || { received: [], sent: [] };
  },

  async createRequest(requested_id: string, message?: string): Promise<FeedbackRequest> {
    const response = await api.post('/feedbacks/requests', { requested_id, message });
    return unwrap(response);
  },

  async declineRequest(id: string): Promise<void> {
    await api.patch(`/feedbacks/requests/${id}/decline`, {});
  },
};
