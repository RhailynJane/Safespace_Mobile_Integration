import axios from 'axios';
import { getApiBaseUrl } from './apiBaseUrl';
import { convexEnabled, getConvexApi, createConvexClientNoAuth, safeQuery, safeMutation } from './convexClient';

const baseURL = getApiBaseUrl();

/**
 * Notifications API
 * Convex-first with REST fallback
 */

export interface Notification {
  id: string;
  type: 'message' | 'appointment' | 'system' | 'reminder' | 'mood' | 'journaling' | 'post_reactions' | 'self_assessment';
  title: string;
  message: string;
  isRead: boolean;
  is_read?: boolean; // REST compatibility
  created_at: string;
  time: string;
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(userId: string, limit = 200): Promise<{ data: Notification[] }> {
  if (convexEnabled()) {
    try {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      const result = await safeQuery(client, api.notifications.getNotifications, { userId, limit });
      
      if (result?.notifications) {
        return { data: result.notifications };
      }
    } catch (error) {
      console.log('Convex getNotifications failed, falling back to REST:', error);
    }
  }

  // REST fallback
  try {
    const res = await axios.get(`${baseURL}/api/notifications/${userId}`);
    return { data: res.data.data || [] };
  } catch (error) {
    console.error('REST getNotifications error:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  if (convexEnabled()) {
    try {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      const result = await safeQuery(client, api.notifications.getUnreadCount, { userId });
      
      if (result?.count !== undefined) {
        return result.count;
      }
    } catch (error) {
      console.log('Convex getUnreadCount failed, falling back to REST:', error);
    }
  }

  // REST fallback - load all notifications and count unread
  try {
    const { data } = await getNotifications(userId);
    return data.filter((n: Notification) => !n.isRead && !n.is_read).length;
  } catch (error) {
    console.error('REST getUnreadCount error:', error);
    return 0;
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string
): Promise<{ id: string }> {
  if (convexEnabled()) {
    try {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      const result = await safeMutation(client, api.notifications.createNotification, {
        userId,
        type,
        title,
        message,
      });
      
      if (result?.id) {
        return { id: result.id };
      }
    } catch (error) {
      console.log('Convex createNotification failed, falling back to REST:', error);
    }
  }

  // REST fallback - Note: REST API doesn't have a direct create endpoint for client,
  // but we'll add one or use the existing /api/notifications/send
  try {
    const res = await axios.post(`${baseURL}/api/notifications/send`, {
      userId,
      type,
      title,
      message,
    });
    return { id: res.data.id || 'unknown' };
  } catch (error) {
    console.error('REST createNotification error:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  if (convexEnabled()) {
    try {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      await safeMutation(client, api.notifications.markAsRead, { notificationId });
      return;
    } catch (error) {
      console.log('Convex markAsRead failed, falling back to REST:', error);
    }
  }

  // REST fallback
  try {
    await axios.post(`${baseURL}/api/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('REST markAsRead error:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  if (convexEnabled()) {
    try {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      await safeMutation(client, api.notifications.markAllAsRead, { userId });
      return;
    } catch (error) {
      console.log('Convex markAllAsRead failed, falling back to REST:', error);
    }
  }

  // REST fallback
  try {
    await axios.post(`${baseURL}/api/notifications/${userId}/read-all`);
  } catch (error) {
    console.error('REST markAllAsRead error:', error);
    throw error;
  }
}

/**
 * Clear all notifications for a user
 */
export async function clearAllNotifications(userId: string): Promise<void> {
  if (convexEnabled()) {
    try {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      await safeMutation(client, api.notifications.clearAll, { userId });
      return;
    } catch (error) {
      console.log('Convex clearAllNotifications failed, falling back to REST:', error);
    }
  }

  // REST fallback
  try {
    await axios.delete(`${baseURL}/api/notifications/${userId}/clear-all`);
  } catch (error) {
    console.error('REST clearAllNotifications error:', error);
    throw error;
  }
}

/**
 * Delete a single notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  if (convexEnabled()) {
    try {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      await safeMutation(client, api.notifications.deleteNotification, { notificationId });
      return;
    } catch (error) {
      console.log('Convex deleteNotification failed, falling back to REST:', error);
    }
  }

  // REST fallback - Note: REST API doesn't have delete single endpoint
  // We'll need to add it or handle gracefully
  throw new Error('Delete single notification not implemented in REST API');
}

export const notificationsApi = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
};
