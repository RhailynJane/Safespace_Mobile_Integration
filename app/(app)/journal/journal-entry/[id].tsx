import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../../../constants/theme";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";

// Mock data for demonstration (replaces backend implementation)
const mockJournalEntries = [
  {
    id: "1",
    title: "A Productive Day",
    content:
      "Today I accomplished all my goals and felt really productive. I finished my work tasks ahead of schedule and even had time for a relaxing walk in the park. The weather was beautiful and it helped clear my mind. I'm grateful for these moments of peace and accomplishment.",
    mood_type: "happy",
    emoji: "😊",
    date: "2023-10-15",
    formattedDate: "October 15, 2023",
    tags: ["productivity", "gratitude", "mindfulness"],
  },
  {
    id: "2",
    title: "Feeling Anxious",
    content:
      "I've been feeling anxious about the upcoming presentation. I need to remember to practice my breathing exercises and take things one step at a time. It's normal to feel this way before important events, and I know I've prepared well.",
    mood_type: "anxious",
    emoji: "😰",
    date: "2023-10-14",
    formattedDate: "October 14, 2023",
    tags: ["anxiety", "self-care"],
  },
  {
    id: "3",
    title: "Quality Time with Family",
    content:
      "Spent the day with family today. We had a wonderful picnic at the lake and enjoyed each other's company. It's important to cherish these moments and create lasting memories with loved ones.",
    mood_type: "loved",
    emoji: "❤️",
    date: "2023-10-12",
    formattedDate: "October 12, 2023",
    tags: ["family", "gratitude", "memories"],
  },
];

// Mock user data (replaces auth implementation)
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
};

// Mock profile data
const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

// Bottom navigation tabs configuration
const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function JournalEntryScreen() {
  // Get the entry ID from the URL parameters
  const { id } = useLocalSearchParams();

  // State for the journal entry, loading status, and UI controls
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journal");
  const [sideMenuVisible, setSideMenuVisible] = useState(false);

  // Handle tab navigation
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Simulate fetching a specific journal entry
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        // Simulate network request delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Find the entry with the matching ID
        const foundEntry = mockJournalEntries.find((e) => e.id === id);
        setEntry(foundEntry);
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        Alert.alert("Error", "Failed to load journal entry");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  // Handle delete entry action
  const handleDelete = async () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              // Simulate deletion process
              await new Promise((resolve) => setTimeout(resolve, 500));

              // In a real app, this would actually delete the entry
              console.log(`Entry ${id} would be deleted in a real app`);

              // Navigate back to the journal list
              router.replace("/(app)/journal/index");
            } catch (error) {
              console.error("Error deleting journal entry:", error);
              Alert.alert("Error", "Failed to delete journal entry");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Navigate to the edit screen for this entry
  const handleEdit = () => {
    router.push(`/(app)/journal/journal-edit/${id}`);
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CurvedBackground />
        <AppHeader title="Journal Entry" showBack={true} showMenu={true} />
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show not found state if entry doesn't exist
  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <CurvedBackground />
        <AppHeader title="Journal Entry" showBack={true} showMenu={true} />
        <View style={styles.notFoundContainer}>
          <Text>Entry not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="Journal Entry"
          showBack={true}
          showMenu={true}
          onMenuPress={() => setSideMenuVisible(true)}
        />

        <ScrollView style={styles.content}>
          {/* Entry header with date, title, and mood */}
          <View style={styles.entryHeader}>
            <Text style={styles.entryDate}>{entry.formattedDate}</Text>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            {entry.emoji && (
              <Text style={styles.entryMood}>
                {entry.emoji} {entry.mood_type}
              </Text>
            )}
          </View>

          {/* Main content of the journal entry */}
          <Text style={styles.entryContent}>{entry.content}</Text>

          {/* Tags associated with the entry */}
          {entry.tags && entry.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {entry.tags.map((tag: string) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action buttons for editing and deleting the entry */}
          <View style={styles.entryActions}>
            <TouchableOpacity
              style={styles.entryActionButton}
              onPress={handleEdit}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.entryActionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom navigation for app navigation */}
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
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginBottom: 60, // Space for bottom navigation
  },
  entryHeader: {
    marginBottom: Spacing.xl,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  entryTitle: {
    ...Typography.title,
    fontSize: 24,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  entryMood: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  entryContent: {
    ...Typography.body,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  entryActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  entryActionButton: {
    marginLeft: Spacing.md,
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
