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
import { AppHeader } from "../../../components/AppHeader";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { journalApi, JournalEntry } from "../../../utils/journalApi";

type FilterType = "all" | "week" | "month";

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function JournalHistoryScreen() {
  const { user } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("journal");

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchEntries();
      }
    }, [user?.id, activeFilter])
  );

  const getDateFilters = () => {
    const now = new Date();
    let startDate: Date | undefined;

    if (activeFilter === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (activeFilter === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return startDate ? { startDate: startDate.toISOString() } : {};
  };

  const fetchEntries = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const filters = getDateFilters();
      const response = await journalApi.getHistory(user.id, filters);
      setEntries(response.entries || []);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      Alert.alert("Error", "Failed to load journal history");
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

  const handleEntryPress = (entryId: string) => {
    router.push(`/(app)/journal/journal-entry/${entryId}`);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

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
            <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
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

        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.map((tag: string, index: number) => (
              <View key={`${entry.id}-${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {entry.share_with_support_worker && (
          <View style={styles.sharedBadge}>
            <Ionicons name="people" size={12} color={Colors.primary} />
            <Text style={styles.sharedText}>Shared with Support Worker</Text>
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

          <View style={styles.filterContainer}>
            {renderFilterButton("all", "All")}
            {renderFilterButton("week", "Week")}
            {renderFilterButton("month", "Month")}
          </View>

          <View style={styles.entriesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading entries...</Text>
              </View>
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

          {entries.length > 0 && (
            <TouchableOpacity
              style={styles.floatingAddButton}
              onPress={() => router.push("/(app)/journal/journal-create")}
            >
              <Ionicons name="add" size={28} color={Colors.surface} />
            </TouchableOpacity>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    marginBottom: 60,
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
    shadowOffset: { width: 0, height: 1 },
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
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
    bottom: 80,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});