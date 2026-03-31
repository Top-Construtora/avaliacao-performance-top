import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { notificationApiService } from '../services/notification.service';
import { Notification, NOTIFICATION_DISPLAY_MAP, NotificationType } from '../types/notification.types';
import toast from 'react-hot-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  fetchNotifications: (options?: { page?: number; filter?: string; type?: string }) => Promise<void>;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotifications: (ids: string[]) => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const channelRef = useRef<any>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const count = await notificationApiService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [profile?.id]);

  const fetchNotifications = useCallback(async (options?: { page?: number; filter?: string; type?: string }) => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const result = await notificationApiService.getNotifications({
        page: options?.page || 1,
        limit: 20,
        filter: options?.filter,
        type: options?.type,
      });
      setNotifications(result.data);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const markAsRead = useCallback(async (ids: string[]) => {
    try {
      await notificationApiService.markAsRead(ids);
      setNotifications(prev =>
        prev.map(n => ids.includes(n.id) ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApiService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const archiveNotifications = useCallback(async (ids: string[]) => {
    try {
      await notificationApiService.archive(ids);
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
      const unreadArchived = notifications.filter(n => ids.includes(n.id) && !n.read).length;
      setUnreadCount(prev => Math.max(0, prev - unreadArchived));
    } catch (error) {
      console.error('Error archiving:', error);
    }
  }, [notifications]);

  const deleteNotifications = useCallback(async (ids: string[]) => {
    try {
      await notificationApiService.deleteNotifications(ids);
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
      const unreadDeleted = notifications.filter(n => ids.includes(n.id) && !n.read).length;
      setUnreadCount(prev => Math.max(0, prev - unreadDeleted));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }, [notifications]);

  // Fetch inicial + Realtime subscription
  useEffect(() => {
    if (!profile?.id) return;

    refreshUnreadCount();
    fetchNotifications();

    // Supabase Realtime subscription
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`,
        },
        (payload) => {
          const raw = payload.new as any;
          const notification: Notification = {
            id: raw.id,
            type: raw.type as NotificationType,
            displayCategory: NOTIFICATION_DISPLAY_MAP[raw.type as NotificationType] || 'info',
            title: raw.title,
            message: raw.message,
            priority: raw.priority || 'medium',
            action_url: raw.action_url || null,
            actor_name: null,
            entity_type: raw.entity_type || null,
            entity_id: raw.entity_id || null,
            metadata: raw.metadata || {},
            read: raw.read || false,
            archived: raw.archived || false,
            created_at: raw.created_at,
            read_at: raw.read_at || null,
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          toast(notification.title, {
            duration: 5000,
            icon: notification.displayCategory === 'success' ? '\u2705'
              : notification.displayCategory === 'warning' ? '\u26a0\ufe0f'
              : notification.displayCategory === 'alert' ? '\ud83d\udea8'
              : notification.displayCategory === 'achievement' ? '\ud83c\udfc6'
              : '\ud83d\udd14',
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.id, refreshUnreadCount, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        currentPage,
        totalPages,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        archiveNotifications,
        deleteNotifications,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
