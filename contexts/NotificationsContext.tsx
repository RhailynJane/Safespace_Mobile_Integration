// contexts/NotificationsContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ConvexReactClient } from 'convex/react';
import { api } from '../convex/_generated/api';

interface NotificationsContextType {
  unreadCount: number;
  notifications: any[];
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  // Track last active pair to avoid re-subscribing on harmless re-renders
  const activeKeyRef = useRef<string | null>(null);
  const hasLoggedInitRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Log initialization only when inputs transition to a usable state or change
  useEffect(() => {
    const key = `${userId ?? 'none'}:${!!convexClient}`;
    if (hasLoggedInitRef.current !== key) {
      hasLoggedInitRef.current = key;
      console.log(`🔔 NotificationsProvider initialized - userId: ${userId}, hasClient: ${!!convexClient}`);
    }
  }, [convexClient, userId]);

  // Real-time subscription to notifications
  useEffect(() => {
    if (!convexClient || !userId) {
      console.log(`🔔 NotificationsProvider skipping fetch - client: ${!!convexClient}, userId: ${userId}`);
      return;
    }

    // Prevent duplicate interval setup if the pair hasn't changed
    const key = `${userId}:${!!convexClient}`;
    if (activeKeyRef.current === key) {
      return; // already subscribed for this pair; keep existing interval
    }
    activeKeyRef.current = key;

    console.log(`🔔 NotificationsProvider starting subscription for userId: ${userId}`);

    const fetchNotifications = async () => {
      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        console.log(`🔔 Skipping fetch - already in progress`);
        return;
      }
      
      try {
        isFetchingRef.current = true;
        console.log(`🔔 Fetching notifications for userId: ${userId}`);
        const result = await convexClient.query(
          api.notifications.getNotifications,
          { userId, limit: 50 }
        );

        console.log(`🔔 Notifications result:`, result);
        
        if (result?.notifications) {
          setNotifications(result.notifications);
          // Count unread notifications
          const count = result.notifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(count);
          console.log(`🔔 Notifications updated: ${count} unread out of ${result.notifications.length} total`);
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        setLoading(false);
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 30 seconds for real-time updates (reduced from 5s to prevent excessive fetching)
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
      // Allow re-subscribe on next change
      activeKeyRef.current = null;
    };
  }, [convexClient, userId]);

  const refreshNotifications = async () => {
    if (!convexClient || !userId) return;

    // Prevent concurrent refreshes
    if (isFetchingRef.current) {
      console.log(`🔔 Refresh skipped - fetch already in progress`);
      return;
    }

    try {
      isFetchingRef.current = true;
      const result = await convexClient.query(
        api.notifications.getNotifications,
        { userId, limit: 50 }
      );

      if (result?.notifications) {
        setNotifications(result.notifications);
        const count = result.notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      isFetchingRef.current = false;
    }
  };

  return (
    <NotificationsContext.Provider value={{ unreadCount, notifications, loading, refreshNotifications }}>
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
