import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { MoodService } from "../../lib/supabase";

const { width } = Dimensions.get("window");

interface MoodEntry {
  id: string;
  client_id: string;
  mood_type: "very-happy" | "happy" | "neutral" | "sad" | "very-sad";
  intensity: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  mood_emoji: string;
  mood_label: string;
  mood_factors?: { factor: string }[];
}

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

const sideMenuItems = [
  {
    icon: "home",
    title: "Dashboard",
    onPress: () => router.replace("/(app)/(tabs)/home"),
  },
  {
    icon: "person",
    title: "Profile",
    onPress: () => router.push("/(app)/(tabs)/profile"),
  },
  {
    icon: "bar-chart",
    title: "Self-Assessment",
    onPress: () => router.push("/self-assessment"),
  },
  {
    icon: "happy",
    title: "Mood Tracking",
    onPress: () => router.push("/mood-tracking"),
  },
  {
    icon: "journal",
    title: "Journaling",
    onPress: () => router.push("/journaling"),
  },
  {
    icon: "library",
    title: "Resources",
    onPress: () => router.push("/resources"),
  },
  {
    icon: "help-circle",
    title: "Crisis Support",
    onPress: () => router.push("/crisis-support"),
  },
  {
    icon: "chatbubble",
    title: "Messages",
    onPress: () => router.push("/(app)/(tabs)/messages"),
  },
  {
    icon: "calendar",
    title: "Appointments",
    onPress: () => router.push("/(app)/(tabs)/appointments"),
  },
  {
    icon: "people",
    title: "Community Forum",
    onPress: () => router.push("/community-forum"),
  },
  {
    icon: "videocam",
    title: "Video Consultations",
    onPress: () => router.push("/video-consultations"),
  },
  {
    icon: "log-out",
    title: "Sign Out",
    onPress: async () => {
      const { logout } = useAuth();
      await logout();
    },
  },
];

export default function MoodHistoryScreen() {
  const { user, profile, logout } = useAuth();
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("mood");

  useEffect(() => {
    const loadMoodHistory = async () => {
      if (profile?.id) {
        try {
          const history = await MoodService.getMoodHistory(profile.id);
          // Map the returned history to match MoodEntry interface
          const mappedHistory: MoodEntry[] = history.map((item: any) => ({
            id: item.id,
            client_id: item.client_id ?? "",
            mood_type: item.mood_type ?? item.mood ?? "neutral",
            intensity: item.intensity,
            notes: item.notes,
            created_at: item.created_at ?? item.date ?? "",
            updated_at: item.updated_at ?? "",
            mood_emoji: item.mood_emoji ?? item.emoji ?? "",
            mood_label: item.mood_label ?? item.mood ?? "",
            mood_factors:
              item.mood_factors ??
              item.factors?.map((f: any) => ({ factor: f })) ??
              [],
          }));
          setMoodHistory(mappedHistory);
        } catch (error) {
          console.error("Error loading mood history:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMoodHistory();
  }, [profile?.id]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const renderMoodEntry = ({ item }: { item: MoodEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryEmoji}>{item.mood_emoji}</Text>
        <View style={styles.entryDetails}>
          <Text style={styles.entryMood}>{item.mood_label}</Text>
          <Text style={styles.entryDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.entryIntensity}>Intensity: {item.intensity}/5</Text>
      </View>
      {item.mood_factors && item.mood_factors.length > 0 && (
        <View style={styles.factorsContainer}>
          {item.mood_factors.map((factorObj, index) => (
            <View key={index} style={styles.factorChip}>
              <Text style={styles.factorText}>{factorObj.factor}</Text>
            </View>
          ))}
        </View>
      )}
      {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSideMenuVisible(true)}>
          <Ionicons name="menu" size={28} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mood History</Text>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {moodHistory.length > 0 ? (
          <FlatList
            data={moodHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderMoodEntry}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No mood entries yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(app)/mood")}
            >
              <Text style={styles.addButtonText}>Log Your First Mood</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
              <Text style={styles.profileName}>{getDisplayName()}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sideMenuItem}
                  onPress={() => {
                    setSideMenuVisible(false);
                    item.onPress();
                  }}
                >
                  <Ionicons name={item.icon as any} size={20} color="#4CAF50" />
                  <Text style={styles.sideMenuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navButton}
            onPress={() => handleTabPress(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={activeTab === tab.id ? "#4CAF50" : "#666"}
            />
            <Text
              style={[
                styles.navButtonText,
                { color: activeTab === tab.id ? "#4CAF50" : "#666" },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  entryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  entryEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  entryDetails: {
    flex: 1,
  },
  entryMood: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  entryDate: {
    fontSize: 14,
    color: "#666",
  },
  entryIntensity: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  factorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  factorChip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  factorText: {
    color: "#2E7D32",
    fontSize: 12,
  },
  entryNotes: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
    width: "75%",
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
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  navButton: {
    alignItems: "center",
    padding: 8,
  },
  navButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
});
