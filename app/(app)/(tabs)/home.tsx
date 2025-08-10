"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

type MoodEntry = {
  id: string;
  mood_type: string;
  created_at: string;
  mood_emoji?: string;
  mood_label?: string;
};

type Resource = {
  id: string;
  title: string;
  duration: string;
};

export default function HomeScreen() {
  const { user, profile, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [sideMenuVisible, setSideMenuVisible] = useState(false);

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const quickActions = [
    {
      id: "mood",
      title: "Track Mood",
      icon: "happy",
      color: "#E8F5E9",
      onPress: () => router.push("/mood-tracking"),
    },
    {
      id: "journal",
      title: "Journal",
      icon: "create",
      color: "#E0F7FA",
      onPress: () => router.push("/journaling"),
    },
    {
      id: "resources",
      title: "Resources",
      icon: "book",
      color: "#E8EAF6",
      onPress: () => router.push("/resources"),
    },
    {
      id: "crisis",
      title: "Crisis Support",
      icon: "help-buoy",
      color: "#F3E5F5",
      onPress: () => router.push("/crisis-support"),
    },
  ];

  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/profile");
      },
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/self-assessment");
      },
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/mood-tracking");
      },
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/journaling");
      },
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/resources");
      },
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/crisis-support");
      },
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/appointments");
      },
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/community-forum");
      },
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/video-consultations");
      },
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: async () => {
        try {
          setSideMenuVisible(false);
          await logout();
        } catch (error) {
          console.error("Sign out error:", error);
        }
      },
    },
  ];

  const getEmojiForMood = (moodType: string) => {
    switch (moodType) {
      case "very-happy":
        return "😄";
      case "happy":
        return "🙂";
      case "neutral":
        return "😐";
      case "sad":
        return "🙁";
      case "very-sad":
        return "😢";
      default:
        return "😐";
    }
  };

  const getLabelForMood = (moodType: string) => {
    switch (moodType) {
      case "very-happy":
        return "Very Happy";
      case "happy":
        return "Happy";
      case "neutral":
        return "Neutral";
      case "sad":
        return "Sad";
      case "very-sad":
        return "Very Sad";
      default:
        return "Unknown";
    }
  };

  const fetchRecentMoods = async () => {
    try {
      if (!user?.uid) return;

      // First get client ID
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("firebase_uid", user.uid)
        .single();

      if (clientError || !clientData) return;

      // Then fetch mood entries
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) return;

      const transformedEntries = (data || []).map((entry) => ({
        ...entry,
        mood_emoji: getEmojiForMood(entry.mood_type),
        mood_label: getLabelForMood(entry.mood_type),
      }));

      setRecentMoods(transformedEntries);
    } catch (error) {
      console.log("Mood entries not available");
      setRecentMoods([]);
    }
  };

  const fetchResources = async () => {
    try {
      // Check if resources table exists
      const { data: tableExists } = await supabase.rpc("table_exists", {
        table_name: "resources",
      });

      if (!tableExists) {
        setResources([]);
        return;
      }

      const { data, error } = await supabase
        .from("resources")
        .select("id, title, duration")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      setResources([]);
    }
  };

  // Set up realtime subscription for mood updates
  useEffect(() => {
    if (!user?.uid) return;

    // First get client ID for the filter
    supabase
      .from("clients")
      .select("id")
      .eq("firebase_uid", user.uid)
      .single()
      .then(({ data: clientData, error: clientError }) => {
        if (clientError || !clientData) return;

        const subscription = supabase
          .channel("mood_entries")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "mood_entries",
              filter: `client_id=eq.${clientData.id}`,
            },
            () => {
              fetchRecentMoods(); // Refresh when mood entries change
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      });
  }, [user?.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRecentMoods(), fetchResources()]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?.uid])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getGreetingName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    return "User";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSideMenuVisible(true)}>
            <Ionicons name="menu" size={28} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hello, {getGreetingName()}</Text>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Emergency Help Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => router.push("/crisis-support")}
            >
              <View style={styles.helpButtonContent}>
                <Ionicons name="help-buoy" size={24} color="white" />
                <Text style={styles.helpButtonText}>Get Help Now</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.actionCard, { backgroundColor: action.color }]}
                  onPress={action.onPress}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={24}
                    color="#4CAF50"
                  />
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mood Tracking Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Moods</Text>
            {recentMoods.length > 0 ? (
              <View style={styles.recentMoods}>
                {recentMoods.map((mood) => (
                  <View key={mood.id} style={styles.moodItem}>
                    <Text style={styles.moodEmoji}>{mood.mood_emoji}</Text>
                    <View style={styles.moodDetails}>
                      <Text style={styles.moodDate}>
                        {formatDate(mood.created_at)}
                      </Text>
                      <Text style={styles.moodText}>{mood.mood_label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No mood entries yet</Text>
            )}
          </View>

          {/* Resources Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Resources</Text>
            {resources.length > 0 ? (
              resources.map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  style={styles.resourceCard}
                  onPress={() => router.push(`/resources/${resource.id}`)}
                >
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <Text style={styles.resourceDuration}>
                      {resource.duration}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={32} color="#4CAF50" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>No resources available</Text>
            )}
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.navItem,
                activeTab === tab.id && styles.navItemActive,
              ]}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id !== "home") router.push(`/${tab.id}`);
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={activeTab === tab.id ? "#4CAF50" : "#757575"}
              />
              <Text
                style={[
                  styles.navText,
                  activeTab === tab.id && styles.navTextActive,
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Side Menu */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={sideMenuVisible}
          onRequestClose={() => setSideMenuVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setSideMenuVisible(false)}
            />
            <View style={styles.sideMenu}>
              <View style={styles.sideMenuHeader}>
                <Text style={styles.profileName}>{getGreetingName()}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sideMenuItem}
                    onPress={item.onPress}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.sideMenuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
  },
  content: {
    flex: 1,
    paddingBottom: 70,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 16,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F44336",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  helpButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  recentMoods: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
  },
  moodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  moodEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  moodDetails: {
    flex: 1,
  },
  moodDate: {
    fontSize: 14,
    color: "#757575",
  },
  moodText: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  noDataText: {
    textAlign: "center",
    color: "#757575",
    paddingVertical: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
    marginTop: 8,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 4,
  },
  resourceDuration: {
    fontSize: 14,
    color: "#757575",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
  },
  navText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  navTextActive: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sideMenu: {
    width: width * 0.75,
    backgroundColor: "#FFFFFF",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#757575",
  },
  sideMenuContent: {
    padding: 10,
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sideMenuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
});
