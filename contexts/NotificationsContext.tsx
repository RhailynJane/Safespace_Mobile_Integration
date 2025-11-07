// contexts/NotificationsContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { api } from '../convex/_generated/api';

interface NotificationsContextType {
  unreadCount: number;
  notifications: any[];
  refreshNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
  convexClient: ConvexReactClient | null;
  userId: string | null;
}

export function NotificationsProvider({ children, convexClient, userId }: NotificationsProviderProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for notifications every 10 seconds
  useEffect(() => {
    if (!convexClient || !userId) return;

    const fetchNotifications = async () => {
      try {
        const result = await convexClient.query(
          api.notifications.getNotifications,
          { userId, limit: 10 }
        );

        if (result?.notifications) {
          setNotifications(result.notifications);
          // Count unread notifications
          const count = result.notifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [convexClient, userId]);

  const refreshNotifications = async () => {
    if (!convexClient || !userId) return;

    try {
      const result = await convexClient.query(
        api.notifications.getNotifications,
        { userId, limit: 10 }
      );

      if (result?.notifications) {
        setNotifications(result.notifications);
        const count = result.notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  };

  return (
    <NotificationsContext.Provider value={{ unreadCount, notifications, refreshNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
