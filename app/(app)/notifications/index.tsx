/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { AppHeader } from "../../../components/AppHeader";
import { Ionicons } from "@expo/vector-icons";
import CurvedBackground from "../../../components/CurvedBackground";
import { useTheme } from "../../../contexts/ThemeContext";
import { useUser } from '@clerk/clerk-expo';
import { getApiBaseUrl } from '../../../utils/apiBaseUrl';
import StatusModal from "../../../components/StatusModal";
import { APP_TIME_ZONE } from '../../../utils/timezone';
import notificationEvents from '../../../utils/notificationEvents';
import { useQuery } from 'convex/react';
import { useConvex } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNotifications } from '../../../contexts/NotificationsContext';

// Type definition for a Notification object.
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "message" | "appointment" | "system" | "reminder" | "mood" | "journaling" | "post_reactions" | "self_assessment";
}

/**
 * NotificationsScreen
 * This screen displays a list of user notifications such as messages,
 * appointment reminders, system updates, or journal/mood reminders.
 */
export default function NotificationsScreen() {
  const { theme, scaledFontSize } = useTheme();
  // Use notifications from context instead of local state to avoid duplicate fetching
  const { notifications: contextNotifications, loading: contextLoading, refreshNotifications } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useUser();
  const baseURL = getApiBaseUrl();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });
  const [convexApi, setConvexApi] = useState<any | null>(null);

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Dynamic import Convex API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('../../../convex/_generated/api');
        if (mounted) setConvexApi(mod.api);
      } catch (err) {
        console.log('Convex API not available for notifications');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideStatusModal = () => {
    setModalVisible(false);
  };

  const convex = useConvex();
  
  // Sync context notifications to local state for display
  useEffect(() => {
    if (contextNotifications && contextNotifications.length >= 0) {
      const mapped: Notification[] = contextNotifications.map((r: any) => ({
        id: String(r.id),
        title: r.title,
        message: r.message,
        time: r.time,
        isRead: !!r.isRead,
        type: (r.type as Notification['type']) || 'system',
      }));
      setNotifications(mapped);
    }
  }, [contextNotifications]);

  // Listen for notification events to auto-refresh via context
  useEffect(() => {
    const unsubscribe = notificationEvents.subscribe((event) => {
      if (event.type === 'received') {
        console.log('🔔 Notification event received, refreshing via context');
        refreshNotifications();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [refreshNotifications]);

  /**
   * onRefresh
   * Triggered when user pulls down to refresh the list.
   */
  const onRefresh = () => {
    setRefreshing(true);
    refreshNotifications();
    setTimeout(() => setRefreshing(false), 1000);
  };

  /**
   * markAsRead
   * Marks a single notification as read by matching its ID.
   * Useful for when user taps on an unread notification.
   * Uses optimistic UI for instant feedback.
   */
  const markAsRead = async (id: string) => {
    // Optimistic update - immediately mark as read in UI
    const previousNotifications = [...notifications];
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );

    try {
  await convex.mutation(api.notifications.markAsRead, { notificationId: id as any });
      // Show success feedback for the action
      showStatusModal('success', 'Notification Read', 'Notification marked as read.');
    } catch (e) {
      console.log('Failed to mark notification as read:', e);
      // Rollback on error
      setNotifications(previousNotifications);
      showStatusModal('error', 'Update Failed', 'Unable to mark notification as read. Please try again.');
    }
  };

  /**
   * clearAllNotifications
   * Deletes all notifications from the list.
   * Triggered when user presses the "Clear all" button.
   * Uses optimistic UI for instant feedback.
   */
  const clearAllNotifications = async () => {
    if (!user?.id) return;
    
    // Optimistic update - immediately clear all notifications
    const previousNotifications = [...notifications];
    setNotifications([]);

    try {
      await convex.mutation(api.notifications.clearAll, { userId: user.id });
      showStatusModal('success', 'Notifications Cleared', 'All notifications have been deleted.');
    } catch (e) {
      console.log('Failed to clear notifications:', e);
      // Rollback on error
      setNotifications(previousNotifications);
      showStatusModal('error', 'Delete Failed', 'Unable to clear notifications. Please try again.');
    }
  };

  /**
   * markAllAsRead
   * Marks all notifications in the list as read.
   * Triggered when user presses the "Mark all as read" button.
   * Uses optimistic UI for instant feedback.
   */
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    // Optimistic update - immediately mark all as read in UI
    const previousNotifications = [...notifications];
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );

    try {
      await convex.mutation(api.notifications.markAllAsRead, { userId: user.id });
      showStatusModal('success', 'All Notifications Read', 'All notifications have been marked as read.');
    } catch (e) {
      console.log('Failed to mark all as read:', e);
      // Rollback on error
      setNotifications(previousNotifications);
      showStatusModal('error', 'Update Failed', 'Unable to mark all notifications as read. Please try again.');
    }
  };

  /**
   * getNotificationIcon
   * Returns the icon name (Ionicons) based on notification type.
   * Ensures consistent visual language for each category.
   */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "chatbubble-outline";
      case "appointment":
        return "calendar-outline";
      case "mood":
        return "happy-outline";
      case "journaling":
        return "document-text-outline";
      case "post_reactions":
        return "heart-outline";
      case "self_assessment":
        return "checkmark-circle-outline";
      case "reminder":
        return "notifications-outline";
      case "system":
        return "information-circle-outline";
      default:
        return "notifications-outline";
    }
  };

  /**
   * getNotificationColor
   * Returns a color code for each notification type.
   */
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "message":
        return "#4FC3F7";
      case "appointment":
        return "#9575CD";
      case "mood":
        return "#66BB6A";
      case "journaling":
        return "#42A5F5";
      case "post_reactions":
        return "#EF5350";
      case "self_assessment":
        return "#26A69A";
      case "reminder":
        return "#4CAF50";
      case "system":
        return "#FFB74D";
      default:
        return "#9E9E9E";
    }
  };

  // Calculate the number of unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <CurvedBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <AppHeader title="Notifications" showBack={true} />

        {/* Top bar showing unread count & action buttons */}
        <View style={[styles.headerActions, { 
          // Make the header bar fully transparent
          backgroundColor: 'transparent',
          borderBottomColor: 'transparent',
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          // Add a little space below the header actions
          marginBottom: 15
        }]}>
          <View style={styles.unreadContainer}>
            <View style={[styles.unreadBadgeIcon, { backgroundColor: unreadCount > 0 ? theme.colors.primary : theme.colors.borderLight }]}>
              <Text style={[styles.unreadCountNumber, { color: unreadCount > 0 ? '#FFFFFF' : theme.colors.textSecondary }]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
            <Text style={[styles.unreadText, { color: theme.colors.text }]}>
              {unreadCount === 1 ? "unread notification" : "unread notifications"}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            {unreadCount > 0 && (
              <TouchableOpacity 
                onPress={markAllAsRead}
                style={[styles.actionButton, { backgroundColor: theme.isDark ? theme.colors.primary + '20' : '#E3F2FD' }]}
              >
                <Ionicons name="checkmark-done" size={16} color={theme.colors.primary} />
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                  Mark read
                </Text>
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity 
                onPress={clearAllNotifications}
                style={[styles.actionButton, { backgroundColor: theme.isDark ? theme.colors.error + '20' : '#FFEBEE' }]}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main notifications list (scrollable with pull-to-refresh) */}
        <ScrollView
          style={styles.notificationsList}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Loading state */}
          {contextLoading && notifications.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading notifications...
              </Text>
            </View>
          ) : notifications.length === 0 ? (
            /* Empty state when no notifications are available */
            <View style={styles.emptyState}>
              <View style={[styles.emptyStateIconContainer, { 
                backgroundColor: theme.isDark ? theme.colors.borderLight : '#F5F5F5' 
              }]}>
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                />
              </View>
              <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                You&apos;ll see important updates here
              </Text>
            </View>
          ) : (
            // Render a list of notifications
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  { 
                    backgroundColor: theme.isDark ? theme.colors.surface : '#FFFFFF',
                  },
                  !notification.isRead && [
                    styles.unreadNotification,
                    { 
                      backgroundColor: theme.isDark ? theme.colors.primary + '15' : '#F0F7FF',
                      borderLeftColor: theme.colors.primary,
                      borderLeftWidth: 4,
                    }
                  ],
                ]}
                onPress={() => markAsRead(notification.id)}
                activeOpacity={0.7}
              >
                {/* Left: Notification Icon */}
                <View style={[
                  styles.notificationIconContainer,
                  { 
                    backgroundColor: getNotificationColor(notification.type) + '15',
                  }
                ]}>
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={22}
                    color={getNotificationColor(notification.type)}
                  />
                </View>

                {/* Middle: Notification details (title, message, time) */}
                <View style={styles.notificationContent}>
                  <View style={styles.notificationTitleRow}>
                    <Text 
                      style={[
                        styles.notificationTitle, 
                        { color: theme.colors.text },
                        !notification.isRead && styles.notificationTitleUnread
                      ]}
                      numberOfLines={1}
                    >
                      {notification.title}
                    </Text>
                    {!notification.isRead && (
                      <View style={[
                        styles.unreadDot,
                        { backgroundColor: theme.colors.primary }
                      ]} />
                    )}
                  </View>
                  <Text 
                    style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {notification.message}
                  </Text>
                  <View style={styles.notificationFooter}>
                    <Ionicons name="time-outline" size={12} color={theme.colors.textDisabled} />
                    <Text style={[styles.notificationTime, { color: theme.colors.textDisabled }]}>
                      {notification.time}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Status Modal for error handling and success feedback */}
        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideStatusModal}
          buttonText="OK"
        />
      </View>
    </CurvedBackground>
  );
}

/**
 * Stylesheet for NotificationsScreen.
 * Handles layout, spacing, typography, and visual states (unread/read).
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unreadContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  unreadBadgeIcon: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  unreadCountNumber: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
  },
  unreadText: {
    fontSize: scaledFontSize(13),
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: scaledFontSize(12),
    fontWeight: "600",
  },
  notificationsList: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 40, // bottom gap so last card isn't flush with gesture bar
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: scaledFontSize(16),
    marginTop: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyStateIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: scaledFontSize(14),
    textAlign: "center",
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  unreadNotification: {
    elevation: 2,
    shadowOpacity: 0.12,
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: scaledFontSize(15),
    fontWeight: "500",
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  notificationMessage: {
    fontSize: scaledFontSize(14),
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notificationTime: {
    fontSize: scaledFontSize(12),
  },
});