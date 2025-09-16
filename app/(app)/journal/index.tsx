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
import BottomNavigation from "../../../components/BottomNavigation";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";

// Mock data
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
};

const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

// Mock journal entries data
const mockJournalEntries = [
  {
    id: "1",
    title: "A Reflective Day",
    content:
      "Today I spent time thinking about my goals and aspirations. It was a productive day overall.",
    mood_type: "reflective",
    emoji: "🤔",
    date: "2023-10-15",
    formattedDate: "Oct 15, 2023",
    tags: ["reflection", "goals"],
  },
  {
    id: "2",
    title: "Morning Gratitude",
    content:
      "I'm grateful for the beautiful sunrise and the opportunity to start a new day fresh.",
    mood_type: "grateful",
    emoji: "🙏",
    date: "2023-10-14",
    formattedDate: "Oct 14, 2023",
    tags: ["gratitude", "morning"],
  },
];

export default function JournalScreen() {
  const [journalEntries, setJournalEntries] = useState(mockJournalEntries);
  const [loading, setLoading] = useState(false); // Set to false since we're using mock data
  const [activeTab, setActiveTab] = useState("journal");

  // No need for backend fetch in this frontend-only version
  useEffect(() => {
    // Simulate loading delay for demonstration
    const timer = setTimeout(() => {
      setJournalEntries(mockJournalEntries);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Handles tab press navigation
   * @param tabId - The ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Navigates to the journal creation screen
   */
  const handleCreateJournal = () => {
    router.push("/(app)/journal/journal-create");
  };

  /**
   * Navigates to view all journal entries
   */
  const handleViewAllEntries = () => {
    router.push("/(app)/journal/journal-history");
  };

  /**
   * Handles pressing on a specific journal entry
   * @param entryId - The ID of the journal entry to view
   */
  const handleEntryPress = (entryId: string) => {
    router.push(`/(app)/journal/journal-entry/${entryId}`);
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Journal" showBack={true} showMenu={true} />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.subText}>
              Express your thoughts and feelings
            </Text>

            {/* Create Journal Card - Main call to action */}
            <TouchableOpacity
              style={styles.createCard}
              onPress={handleCreateJournal}
            >
              <View style={styles.createCardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="book" size={32} color={Colors.warning} />
                </View>

                <View style={styles.createTextContainer}>
                  <Text style={styles.createTitle}>Create Journal</Text>
                  <Text style={styles.createSubtitle}>
                    Set up a journal based on your current mood & conditions
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateJournal}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Recent Journal Entries Section */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Journal Entries</Text>

              <View style={styles.recentContainer}>
                {loading ? (
                  <Text style={styles.noEntriesText}>Loading...</Text>
                ) : journalEntries.length > 0 ? (
                  <>
                    {journalEntries.slice(0, 2).map((entry) => (
                      <TouchableOpacity
                        key={entry.id}
                        style={styles.entryCard}
                        onPress={() => handleEntryPress(entry.id)}
                      >
                        <View style={styles.entryHeader}>
                          {entry.emoji ? (
                            <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                          ) : null}
                          <View style={styles.entryInfo}>
                            <Text style={styles.entryTitle}>{entry.title}</Text>
                            <Text style={styles.entryDate}>
                              {entry.formattedDate}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.entryPreview} numberOfLines={2}>
                          {entry.content}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={handleViewAllEntries}
                    >
                      <Text style={styles.viewAllText}>
                        View Journal Entries
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.noEntriesText}>
                      No entries recorded
                    </Text>

                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={handleViewAllEntries}
                    >
                      <Text style={styles.viewAllText}>
                        View Journal Entries
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation Component */}
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl, // Extra padding for bottom nav
  },
  content: {
    flex: 1,
    paddingTop: Spacing.xxl,
  },
  subText: {
    ...Typography.subtitle,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    color: Colors.textSecondary,
  },
  createCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.warning + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    ...Typography.subtitle,
    fontWeight: "600",
    marginBottom: 4,
  },
  createSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  createButton: {
    padding: Spacing.sm,
  },
  recentSection: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  recentContainer: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 16,
    padding: Spacing.xl,
    minHeight: 200,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  entryEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  entryPreview: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  noEntriesText: {
    ...Typography.caption,
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: Spacing.huge,
    marginBottom: Spacing.huge,
  },
  viewAllButton: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  viewAllText: {
    ...Typography.link,
    textDecorationLine: "underline",
  },
});
