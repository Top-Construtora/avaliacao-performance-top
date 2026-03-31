import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import {
  SendNotificationInput,
  RecipientTarget,
  NOTIFICATION_TYPE_CONFIG,
} from '../types/notification.types';

export const notificationService = {

  async send(supabase: SupabaseClient<Database>, input: SendNotificationInput): Promise<void> {
    try {
      const recipientIds = await this.resolveRecipients(supabase, input.targets);

      // Remove o actor dos destinatários (não auto-notificar)
      const filteredIds = input.actor_id
        ? recipientIds.filter(id => id !== input.actor_id)
        : recipientIds;

      if (filteredIds.length === 0) return;

      const config = NOTIFICATION_TYPE_CONFIG[input.type];
      const priority = input.priority || config.defaultPriority;
      const antiSpam = input.anti_spam || 'always';
      const now = new Date().toISOString();

      const toInsert: Array<Database['public']['Tables']['notifications']['Insert']> = [];

      for (const recipientId of filteredIds) {
        // Anti-spam: aggregate
        if (antiSpam === 'aggregate' && input.group_key) {
          const { data: existing } = await supabase
            .from('notifications')
            .select('id, metadata')
            .eq('recipient_id', recipientId)
            .eq('group_key', input.group_key)
            .eq('read', false)
            .eq('archived', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existing) {
            const currentCount = (existing.metadata as any)?.aggregate_count || 1;
            await supabase
              .from('notifications')
              .update({
                message: input.message,
                metadata: { ...input.metadata, aggregate_count: currentCount + 1 } as any,
                created_at: now,
              })
              .eq('id', existing.id);
            continue;
          }
        }

        // Anti-spam: cooldown
        if (antiSpam === 'cooldown' && input.group_key) {
          const cooldownMinutes = input.cooldown_minutes || 30;
          const cooldownThreshold = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();

          const { data: recent } = await supabase
            .from('notifications')
            .select('id')
            .eq('recipient_id', recipientId)
            .eq('group_key', input.group_key)
            .gte('created_at', cooldownThreshold)
            .limit(1)
            .single();

          if (recent) continue;
        }

        toInsert.push({
          recipient_id: recipientId,
          actor_id: input.actor_id || null,
          type: input.type,
          title: input.title,
          message: input.message,
          priority,
          action_url: input.action_url || null,
          entity_type: input.entity_type || null,
          entity_id: input.entity_id || null,
          group_key: input.group_key || null,
          metadata: (input.metadata || {}) as any,
          created_at: now,
        });
      }

      if (toInsert.length > 0) {
        // Batch insert em chunks de 100
        for (let i = 0; i < toInsert.length; i += 100) {
          const chunk = toInsert.slice(i, i + 100);
          const { error } = await supabase
            .from('notifications')
            .insert(chunk);

          if (error) {
            console.error('[NotificationService] Insert error:', error.message);
          }
        }
      }
    } catch (error: any) {
      // Notificações nunca devem quebrar o fluxo principal
      console.error('[NotificationService] send error:', error.message);
    }
  },

  async resolveRecipients(supabase: SupabaseClient<Database>, targets: RecipientTarget[]): Promise<string[]> {
    const userIds = new Set<string>();

    for (const target of targets) {
      switch (target.type) {
        case 'user': {
          if (target.user_id) userIds.add(target.user_id);
          break;
        }
        case 'role': {
          const roleColumn = target.role === 'admin' ? 'is_admin'
            : target.role === 'director' ? 'is_director'
            : 'is_leader';

          const { data } = await supabase
            .from('users')
            .select('id')
            .eq(roleColumn, true)
            .eq('active', true);

          if (data) data.forEach(u => userIds.add(u.id));
          break;
        }
        case 'team': {
          const { data: members } = await supabase
            .from('team_members')
            .select('user_id, users:user_id(active)')
            .eq('team_id', target.team_id);

          if (members) {
            members.forEach((m: any) => {
              if (m.users?.active !== false) userIds.add(m.user_id);
            });
          }
          break;
        }
        case 'department': {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('department_id', target.department_id)
            .eq('active', true);

          if (data) data.forEach(u => userIds.add(u.id));
          break;
        }
        case 'all': {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('active', true);

          if (data) data.forEach(u => userIds.add(u.id));
          break;
        }
      }
    }

    return Array.from(userIds);
  },

  async getByUser(
    supabase: SupabaseClient<Database>,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      filter?: 'all' | 'unread' | 'archived';
      type?: string;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const filter = options.filter || 'all';
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('notifications')
      .select('*, actor:users!notifications_actor_id_fkey(id, name, profile_image)', { count: 'exact' })
      .eq('recipient_id', userId);

    if (filter === 'unread') {
      query = query.eq('read', false).eq('archived', false);
    } else if (filter === 'archived') {
      query = query.eq('archived', true);
    } else {
      query = query.eq('archived', false);
    }

    if (options.type) {
      query = query.eq('type', options.type);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[NotificationService] getByUser error:', error.message);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const total = count || 0;

    return {
      data: data || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async markAsRead(supabase: SupabaseClient<Database>, userId: string, notificationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds)
      .eq('recipient_id', userId);

    if (error) {
      console.error('[NotificationService] markAsRead error:', error.message);
    }
  },

  async markAllAsRead(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      console.error('[NotificationService] markAllAsRead error:', error.message);
    }
  },

  async archive(supabase: SupabaseClient<Database>, userId: string, notificationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ archived: true })
      .in('id', notificationIds)
      .eq('recipient_id', userId);

    if (error) {
      console.error('[NotificationService] archive error:', error.message);
    }
  },

  async delete(supabase: SupabaseClient<Database>, userId: string, notificationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .eq('recipient_id', userId);

    if (error) {
      console.error('[NotificationService] delete error:', error.message);
    }
  },

  async getUnreadCount(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false)
      .eq('archived', false);

    if (error) {
      console.error('[NotificationService] getUnreadCount error:', error.message);
      return 0;
    }

    return count || 0;
  },
};
