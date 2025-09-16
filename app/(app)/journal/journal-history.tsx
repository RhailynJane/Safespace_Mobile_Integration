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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { AppHeader } from "../../../components/AppHeader";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";

// Mock data for demonstration
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

// Mock user data
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
};

// Mock profile data
const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

// Interface for journal entries
interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood_type: string | null;
  emoji: string;
  date: string;
  formattedDate: string;
  tags: string[];
}

// Filter types for organizing entries
type FilterType = "all" | "week" | "month";

// Bottom navigation tabs configuration
const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function JournalHistoryScreen() {
  // State for journal entries, loading status, and UI controls
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("journal");

  // Handle tab navigation
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Simulate data fetching with useEffect
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        // Simulate network request delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Filter entries based on active filter (mock implementation)
        let filteredEntries = [...mockJournalEntries];

        if (activeFilter === "week") {
          // In a real app, this would filter to show only last week's entries
          filteredEntries = filteredEntries.slice(0, 2);
        } else if (activeFilter === "month") {
          // In a real app, this would filter to show only last month's entries
          filteredEntries = filteredEntries.slice(0, 1);
        }

        setEntries(filteredEntries);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [activeFilter]);

  // Navigate to individual journal entry view
  const handleEntryPress = (entryId: string) => {
    router.push(`/(app)/journal/journal-entry/${entryId}`);
  };

  // Change the active filter for entries
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Render filter button with active state styling
  const renderFilterButton = (filter: FilterType, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => handleFilterChange(filter)}
    >
      <Text
        style={[
          styles.filterText,
          activeFilter === filter && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render individual journal entry card
  const renderJournalEntry = (entry: JournalEntry) => {
    const isExpanded = expandedEntry === entry.id;

    return (
      <TouchableOpacity
        key={entry.id}
        style={styles.entryCard}
        onPress={() => handleEntryPress(entry.id)}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text style={styles.entryDate}>{entry.formattedDate}</Text>
          </View>
          <View style={styles.entryMeta}>
            {entry.emoji ? (
              <Text style={styles.entryEmoji}>{entry.emoji}</Text>
            ) : null}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.textSecondary}
              style={styles.expandIcon}
            />
          </View>
        </View>

        <Text
          style={styles.entryContent}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {entry.content}
        </Text>

        {entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {!isExpanded && entry.content.length > 150 && (
          <Text style={styles.readMore}>Read more...</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Journal Entries" showBack={true} showMenu={true} />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>My Journal Entries</Text>

          {/* Filter controls for organizing entries */}
          <View style={styles.filterContainer}>
            {renderFilterButton("all", "All")}
            {renderFilterButton("week", "Week")}
            {renderFilterButton("month", "Month")}
          </View>

          {/* Journal entries list or empty state */}
          <View style={styles.entriesContainer}>
            {loading ? (
              <Text style={styles.loadingText}>Loading entries...</Text>
            ) : entries.length > 0 ? (
              entries.map(renderJournalEntry)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="book-outline"
                  size={64}
                  color={Colors.textTertiary}
                />
                <Text style={styles.emptyStateText}>
                  No journal entries yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Start writing to capture your thoughts and feelings
                </Text>
                <TouchableOpacity
                  style={styles.addEntryButton}
                  onPress={() => router.push("/(app)/journal/journal-create")}
                >
                  <Text style={styles.addEntryButtonText}>
                    Write First Entry
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Floating action button for adding new entries */}
          {entries.length > 0 && (
            <TouchableOpacity
              style={styles.floatingAddButton}
              onPress={() => router.push("/(app)/journal/journal-create")}
            >
              <Ionicons name="add" size={28} color={Colors.surface} />
            </TouchableOpacity>
          )}
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
    paddingTop: Spacing.md,
    marginBottom: 60, // Space for bottom navigation
  },
  pageTitle: {
    ...Typography.title,
    fontSize: 28,
    fontWeight: "600",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 25,
    padding: 4,
    marginBottom: Spacing.xxl,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: 21,
  },
  filterButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  entriesContainer: {
    paddingBottom: 100, // Space for floating button
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    ...Typography.subtitle,
    fontWeight: "600",
    marginBottom: 4,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  expandIcon: {
    marginLeft: Spacing.sm,
  },
  entryContent: {
    ...Typography.body,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  readMore: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    ...Typography.title,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
  },
  addEntryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  addEntryButtonText: {
    ...Typography.button,
  },
  floatingAddButton: {
    position: "absolute",
    bottom: 80, // Adjusted for bottom navigation
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginVertical: Spacing.xl,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.md,
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
});