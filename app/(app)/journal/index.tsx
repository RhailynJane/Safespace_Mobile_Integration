import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import BottomNavigation from "../../../components/BottomNavigation";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import { journalApi, JournalEntry } from "../../../utils/journalApi";
import { useQuery } from "convex/react";
import { APP_TIME_ZONE } from "../../../utils/timezone";
import { useTheme } from "../../../contexts/ThemeContext";
import StatusModal from "../../../components/StatusModal";

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function JournalScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journal");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const fetchRecentEntries = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await journalApi.getRecentEntries(user.id, 2);
      setJournalEntries(response.entries || []);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      showModal('error', 'Load Failed', 'Unable to load journal entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add useFocusEffect to fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchRecentEntries();
      }
    }, [user?.id, fetchRecentEntries])
  );

  // Live recent entries using Convex when available.
  // We dynamically import the generated API and only render the live child when available.
  const [convexApi, setConvexApi] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("../../../convex/_generated/api");
        if (mounted) setConvexApi(mod.api);
      } catch (_) {
        // Convex not generated or not enabled; ignore silently
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const LiveRecent = ({ api, userId, onData }: { api: any; userId: string; onData: (e: JournalEntry[]) => void }) => {
    const live = useQuery(api.journal.listRecent, { clerkUserId: userId, limit: 2 }) as any[] | undefined;
    useEffect(() => {
      if (Array.isArray(live)) {
        onData(live as unknown as JournalEntry[]);
      }
    }, [live, onData]);
    return null;
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
    return date.toLocaleDateString("en-US", { ...options, timeZone: APP_TIME_ZONE });
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Journal" showBack={true} showMenu={true} />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {user?.id && convexApi ? (
            <LiveRecent api={convexApi} userId={user.id} onData={setJournalEntries} />
          ) : null}
          <View style={styles.content}>
            <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
              Express your thoughts and feelings
            </Text>

            <TouchableOpacity
              style={[styles.createCard, { backgroundColor: theme.colors.surface }]}
              onPress={handleCreateJournal}
            >
              <View style={styles.createCardContent}>
                <View style={[styles.iconContainer, { backgroundColor: theme.isDark ? '#FFB74D' : Colors.warning + '20' }]}>
                  <Ionicons name="book" size={32} color={theme.isDark ? '#FFF3E0' : Colors.warning} />
                </View>

                <View style={styles.createTextContainer}>
                  <Text style={[styles.createTitle, { color: theme.colors.text }]}>Create Journal</Text>
                  <Text style={[styles.createSubtitle, { color: theme.colors.textSecondary }]}>
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
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            <View style={styles.recentSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Journal Entries</Text>

              <View style={[styles.recentContainer, { backgroundColor: theme.isDark ? theme.colors.primary + '20' : Colors.primary + '20' }]}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading entries...</Text>
                  </View>
                ) : journalEntries.length > 0 ? (
                  <>
                    {journalEntries.map((entry) => (
                      <TouchableOpacity
                        key={entry.id}
                        style={[styles.entryCard, { backgroundColor: theme.colors.surface }]}
                        onPress={() => handleEntryPress(entry.id)}
                      >
                        <View style={styles.entryHeader}>
                          {entry.emoji ? (
                            <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                          ) : null}
                          <View style={styles.entryInfo}>
                            <Text style={[styles.entryTitle, { color: theme.colors.text }]}>{entry.title}</Text>
                            <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>
                              {formatDate(entry.created_at)}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.entryPreview, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                          {entry.content}
                        </Text>
                        {entry.share_with_support_worker && (
                          <View style={[styles.sharedBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Ionicons
                              name="people"
                              size={12}
                              color={theme.colors.primary}
                            />
                            <Text style={[styles.sharedText, { color: theme.colors.primary }]}>Shared</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={handleViewAllEntries}
                    >
                      <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                        View Journal Entries
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={[styles.noEntriesText, { color: theme.colors.textSecondary }]}>
                      No entries recorded
                    </Text>

                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={handleViewAllEntries}
                    >
                      <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
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

        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideModal}
          buttonText="OK"
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
    fontSize: scaledFontSize(16), // Base size 16px
    textAlign: "center",
    marginBottom: Spacing.xxl,
    color: "#666",
  },
  createCard: {
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    fontSize: scaledFontSize(18), // Base size 18px
    fontWeight: "600",
    marginBottom: 4,
  },
  createSubtitle: {
    fontSize: scaledFontSize(14), // Base size 14px
    color: "#666",
  },
  createButton: {
    padding: Spacing.sm,
  },
  recentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: scaledFontSize(18), // Base size 18px
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  recentContainer: {
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
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: Spacing.md,
    color: "#666",
  },
  entryCard: {
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
    fontSize: scaledFontSize(24), // Base size 24px
    marginRight: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
    marginBottom: 2,
  },
  entryDate: {
    fontSize: scaledFontSize(12), // Base size 12px
    color: "#666",
  },
  entryPreview: {
    fontSize: scaledFontSize(14), // Base size 14px
    lineHeight: 18,
    color: "#666",
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  sharedText: {
    fontSize: scaledFontSize(10), // Base size 10px
    marginLeft: 4,
  },
  noEntriesText: {
    fontSize: scaledFontSize(14), // Base size 14px
    textAlign: "center",
    marginTop: Spacing.huge,
    marginBottom: Spacing.huge,
    color: "#666",
  },
  viewAllButton: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: scaledFontSize(16), // Base size 16px
    textDecorationLine: "underline",
  },
});