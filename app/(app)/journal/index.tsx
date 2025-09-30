import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import BottomNavigation from "../../../components/BottomNavigation";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import { journalApi, JournalEntry } from "../../../utils/journalApi";

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function JournalScreen() {
  const { user } = useUser();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journal");

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchRecentEntries();
      }
    }, [user?.id])
  );

  const fetchRecentEntries = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await journalApi.getRecentEntries(user.id, 2);
      setJournalEntries(response.entries || []);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      Alert.alert("Error", "Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleCreateJournal = () => {
    router.push("/(app)/journal/journal-create");
  };

  const handleViewAllEntries = () => {
    router.push("/(app)/journal/journal-history");
  };

  const handleEntryPress = (entryId: string) => {
    router.push(`/(app)/journal/journal-entry/${entryId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
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

            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Journal Entries</Text>

              <View style={styles.recentContainer}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading entries...</Text>
                  </View>
                ) : journalEntries.length > 0 ? (
                  <>
                    {journalEntries.map((entry) => (
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
                              {formatDate(entry.created_at)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.entryPreview} numberOfLines={2}>
                          {entry.content}
                        </Text>
                        {entry.share_with_support_worker && (
                          <View style={styles.sharedBadge}>
                            <Ionicons
                              name="people"
                              size={12}
                              color={Colors.primary}
                            />
                            <Text style={styles.sharedText}>Shared</Text>
                          </View>
                        )}
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
    paddingBottom: Spacing.xxl,
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
    shadowOffset: { width: 0, height: 2 },
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
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
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  sharedText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: 4,
    fontSize: 10,
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