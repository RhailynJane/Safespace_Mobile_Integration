/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { AppHeader } from "../../../components/AppHeader";
import { Ionicons } from "@expo/vector-icons";
import CurvedBackground from "../../../components/CurvedBackground";
import { useTheme } from "../../../contexts/ThemeContext";

// Type definition for a Notification object.
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "message" | "appointment" | "system" | "reminder";
}

/**
 * NotificationsScreen
 * This screen displays a list of user notifications such as messages,
 * appointment reminders, system updates, or journal/mood reminders.
 */
export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "New Message",
        message: "You have a new message from Dr. Smith",
        time: "10 minutes ago",
        isRead: false,
        type: "message",
      },
      {
        id: "2",
        title: "Appointment Reminder",
        message: "Your appointment is scheduled for tomorrow at 2:00 PM",
        time: "1 hour ago",
        isRead: true,
        type: "appointment",
      },
      {
        id: "3",
        title: "Journal Reminder",
        message: "Don't forget to complete your daily journal entry",
        time: "3 hours ago",
        isRead: false,
        type: "reminder",
      },
      {
        id: "4",
        title: "System Update",
        message: "New features are available in the latest update",
        time: "1 day ago",
        isRead: true,
        type: "system",
      },
      {
        id: "5",
        title: "Mood Check-in",
        message: "How are you feeling today? Track your mood",
        time: "2 days ago",
        isRead: true,
        type: "reminder",
      },
    ];

    setNotifications(mockNotifications);
  };

  /**
   * onRefresh
   * Triggered when user pulls down to refresh the list.
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    setTimeout(() => setRefreshing(false), 1000);
  };

  /**
   * markAsRead
   * Marks a single notification as read by matching its ID.
   * Useful for when user taps on an unread notification.
   */
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  /**
   * markAllAsRead
   * Marks all notifications in the list as read.
   * Triggered when user presses the "Mark all as read" button.
   */
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Notifications" showBack={true} />

        {/* Top bar showing unread count & "Mark all as read" action */}
        <View style={[styles.headerActions, { 
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface 
        }]}>
          <Text style={[styles.unreadText, { color: theme.colors.text }]}>
            {unreadCount} unread{" "}
            {unreadCount === 1 ? "notification" : "notifications"}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={[styles.markAllText, { color: theme.colors.primary }]}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main notifications list (scrollable with pull-to-refresh) */}
        <ScrollView
          style={styles.notificationsList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Empty state when no notifications are available */}
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={theme.colors.textSecondary}
              />
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
                    backgroundColor: theme.colors.surface,
                    borderBottomColor: theme.colors.borderLight 
                  },
                  !notification.isRead && [
                    styles.unreadNotification,
                    { backgroundColor: theme.isDark ? theme.colors.primary + '10' : '#F8F9FF' }
                  ],
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                {/* Left: Notification Icon */}
                <View style={[
                  styles.notificationIconContainer,
                  { backgroundColor: theme.colors.borderLight }
                ]}>
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={20}
                    color={getNotificationColor(notification.type)}
                  />
                </View>

                {/* Middle: Notification details (title, message, time) */}
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
                    {notification.message}
                  </Text>
                  <Text style={[styles.notificationTime, { color: theme.colors.textDisabled }]}>
                    {notification.time}
                  </Text>
                </View>

                {/* Right: Green dot indicator for unread notifications */}
                {!notification.isRead && (
                  <View style={[
                    styles.unreadIndicator,
                    { backgroundColor: theme.colors.primary }
                  ]} />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </CurvedBackground>
  );
}

/**
 * Stylesheet for NotificationsScreen.
 * Handles layout, spacing, typography, and visual states (unread/read).
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  unreadText: {
    fontSize: 14,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
  },
  unreadNotification: {
    // backgroundColor applied via inline style
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 8,
  },
});