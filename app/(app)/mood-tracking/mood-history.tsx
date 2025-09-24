/**
 * LLM Prompt: Add concise comments to this React Native component.
 * Reference: chat.deepseek.com
 */
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
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import BottomNavigation from "../../../components/BottomNavigation";

const { width } = Dimensions.get("window");

// Interface for mood entry data structure
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

// Navigation tabs configuration
const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function MoodHistoryScreen() {
  // Mock user data for frontend demonstration
  const mockUser = {
    displayName: "Demo User",
    email: "demo@gmail.com",
  };

  const mockProfile = {
    firstName: "Demo",
    lastName: "User",
  };

  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("mood");

  useEffect(() => {
    // Simulate loading mood history data
    const loadMockData = () => {
      setTimeout(() => {
        // Mock mood history data for demonstration
        const mockData: MoodEntry[] = [
          {
            id: "1",
            client_id: "demo-user",
            mood_type: "happy",
            intensity: 4,
            notes: "Had a great day at work!",
            created_at: "2023-11-15T14:30:00Z",
            updated_at: "2023-11-15T14:30:00Z",
            mood_emoji: "🙂",
            mood_label: "Happy",
            mood_factors: [{ factor: "Work" }, { factor: "Exercise" }],
          },
          {
            id: "2",
            client_id: "demo-user",
            mood_type: "neutral",
            intensity: 3,
            notes: "Regular day, nothing special",
            created_at: "2023-11-14T18:45:00Z",
            updated_at: "2023-11-14T18:45:00Z",
            mood_emoji: "😐",
            mood_label: "Neutral",
            mood_factors: [{ factor: "Routine" }],
          },
          {
            id: "3",
            client_id: "demo-user",
            mood_type: "very-happy",
            intensity: 5,
            notes: "Amazing weekend with friends!",
            created_at: "2023-11-12T20:15:00Z",
            updated_at: "2023-11-12T20:15:00Z",
            mood_emoji: "😄",
            mood_label: "Very Happy",
            mood_factors: [{ factor: "Social" }, { factor: "Leisure" }],
          },
        ];

        setMoodHistory(mockData);
        setLoading(false);
      }, 1000); // Simulate network delay
    };

    loadMockData();
  }, []);

  // Handle tab navigation
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Get display name from user profile
  const getDisplayName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    if (mockUser?.email) return mockUser.email.split("@")[0];
    return "User";
  };

  // Render individual mood entry card
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

  // Show loading indicator while data is being fetched
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Mood Tracker" showBack={true} />

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

        {/* Bottom navigation bar */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "Transparent",
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
    backgroundColor: "#Transparent",
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
