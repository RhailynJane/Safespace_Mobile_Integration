import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { Ionicons } from "@expo/vector-icons";

// Define the notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "message" | "appointment" | "system" | "reminder";
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for notifications
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    // In a real app, you would fetch this from your backend
    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "New Message",
        message: "You have a new message from Dr. Smith",
        time: "10 minutes ago",
        isRead: false,
        type: "message"
      },
      {
        id: "2",
        title: "Appointment Reminder",
        message: "Your appointment is scheduled for tomorrow at 2:00 PM",
        time: "1 hour ago",
        isRead: true,
        type: "appointment"
      },
      {
        id: "3",
        title: "Journal Reminder",
        message: "Don't forget to complete your daily journal entry",
        time: "3 hours ago",
        isRead: false,
        type: "reminder"
      },
      {
        id: "4",
        title: "System Update",
        message: "New features are available in the latest update",
        time: "1 day ago",
        isRead: true,
        type: "system"
      },
      {
        id: "5",
        title: "Mood Check-in",
        message: "How are you feeling today? Track your mood",
        time: "2 days ago",
        isRead: true,
        type: "reminder"
      },
    ];
    
    setNotifications(mockNotifications);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? {...notification, isRead: true} : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      isRead: true
    })));
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
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

  const getNotificationColor = (type: string) => {
    switch(type) {
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <AppHeader title="Notifications" showBack={true} />
      
      <View style={styles.headerActions}>
        <Text style={styles.unreadText}>
          {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>No notifications yet</Text>
            <Text style={styles.emptyStateSubtext}>
              You'll see important updates here
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadNotification
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons
                  name={getNotificationIcon(notification.type)}
                  size={20}
                  color={getNotificationColor(notification.type)}
                />
              </View>
              
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {notification.time}
                </Text>
              </View>
              
              {!notification.isRead && (
                <View style={styles.unreadIndicator} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  unreadText: {
    fontSize: 14,
    color: "#757575",
  },
  markAllText: {
    fontSize: 14,
    color: "#4CAF50",
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
    color: "#9E9E9E",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#BDBDBD",
    textAlign: "center",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    backgroundColor: "#FFFFFF",
  },
  unreadNotification: {
    backgroundColor: "#F8F9FF",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
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
    color: "#212121",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#616161",
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginLeft: 8,
    marginTop: 8,
  },
});