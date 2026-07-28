import { api } from '../config/api';
import {
  Notification,
  NOTIFICATION_DISPLAY_MAP,
  NotificationType,
} from '../types/notification.types';

function mapNotification(raw: any): Notification {
  return {
    id: raw.id,
    type: raw.type as NotificationType,
    displayCategory: NOTIFICATION_DISPLAY_MAP[raw.type as NotificationType] || 'info',
    title: raw.title,
    message: raw.message,
    priority: raw.priority || 'medium',
    action_url: raw.action_url || null,
    actor_name: raw.actor?.name || null,
    entity_type: raw.entity_type || null,
    entity_id: raw.entity_id || null,
    metadata: raw.metadata || {},
    read: raw.read,
    archived: raw.archived,
    created_at: raw.created_at,
    read_at: raw.read_at || null,
  };
}

export interface NotificationPreference {
  category: string;
  label: string;
  email_enabled: boolean;
}

export interface NotificationPreferencesResult {
  /** false = usuário nunca respondeu ao opt-in de e-mail (mostrar modal) */
  configured: boolean;
  preferences: NotificationPreference[];
}

export const notificationApiService = {
  async getPreferences(): Promise<NotificationPreferencesResult> {
    const response = await api.get('/notifications/preferences');
    const result = response.data || response;
    return {
      configured: !!result?.configured,
      preferences: result?.preferences || [],
    };
  },

  async updatePreferences(
    preferences: Array<{ category: string; email_enabled: boolean }>,
  ): Promise<void> {
    await api.put('/notifications/preferences', { preferences });
  },

  /**
   * Diagnóstico de e-mail (admin/diretoria): dispara teste e devolve a config.
   * `to` permite escolher o destinatário — contas admin costumam ter e-mail
   * fictício cadastrado.
   */
  async testEmail(to?: string): Promise<{
    sent: boolean;
    to?: string;
    reason?: string | null;
    config?: Record<string, unknown>;
  }> {
    const response = await api.post('/notifications/test-email', to ? { to } : {});
    return response.data || response;
  },

  async getNotifications(
    params: {
      page?: number;
      limit?: number;
      filter?: string;
      type?: string;
    } = {},
  ) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.filter) query.set('filter', params.filter);
    if (params.type) query.set('type', params.type);

    const queryStr = query.toString();
    const response = await api.get(`/notifications${queryStr ? `?${queryStr}` : ''}`);
    const result = response.data || response;

    return {
      data: (result.data || []).map(mapNotification),
      total: result.total || 0,
      page: result.page || 1,
      limit: result.limit || 20,
      totalPages: result.totalPages || 0,
    };
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    const result = response.data || response;
    return result?.count || 0;
  },

  async markAsRead(ids: string[]): Promise<void> {
    await api.patch('/notifications/read', { ids });
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all', {});
  },

  async archive(ids: string[]): Promise<void> {
    await api.patch('/notifications/archive', { ids });
  },

  async deleteNotifications(ids: string[]): Promise<void> {
    await api.post('/notifications/delete', { ids });
  },
};
