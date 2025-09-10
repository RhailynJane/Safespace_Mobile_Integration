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

  // Load notifications on mount
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
      notification.id === id ? { ...notification, isRead: true } : notification
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
      <Text>Notifications</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
