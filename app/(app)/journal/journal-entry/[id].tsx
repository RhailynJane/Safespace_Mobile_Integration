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
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../../../constants/theme";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { APP_TIME_ZONE } from "../../../../utils/timezone";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  emoji?: string;
  emotion_type?: string;
  share_with_support_worker: boolean;
  tags?: string[];
}

export default function JournalEntryScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { id } = useLocalSearchParams();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journal");
  const [deleting, setDeleting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideStatusModal = () => {
    setModalVisible(false);
  };

  // Live single entry direct query
  const liveEntry = useQuery(api.journal.getEntry, { id: id as any }) as { entry: JournalEntry } | null | undefined;
  useEffect(() => {
    if (liveEntry && liveEntry.entry) {
      setEntry(liveEntry.entry);
      setLoading(false);
    } else if (liveEntry === undefined) {
      setLoading(true);
    } else if (liveEntry === null) {
      setLoading(false);
    }
  }, [liveEntry]);

  // Live refresh handled by subscription component; focus effect no longer needed

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const deleteEntry = useMutation(api.journal.deleteEntry);

  const handleDelete = async () => {
    showStatusModal('info', 'Delete Entry', 
      'Are you sure you want to delete this journal entry? This action cannot be undone.'
    );
    
    setDeleting(true);
    try {
      await deleteEntry({ id: id as any });
      showStatusModal('success', 'Entry Deleted', 'Journal entry deleted successfully.');
      setTimeout(() => {
        router.replace("/(app)/journal");
      }, 1500);
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      showStatusModal('error', 'Delete Failed', 'Unable to delete journal entry. Please try again.');
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/(app)/journal/journal-edit/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", { ...options, timeZone: APP_TIME_ZONE });
  };

  // Share removed per request

  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Journal Entry" showBack={true} showMenu={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading entry...</Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  if (!entry) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Journal Entry" showBack={true} showMenu={true} />
          <View style={styles.notFoundContainer}>
            <Ionicons
              name="document-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.notFoundText, { color: theme.colors.textSecondary }]}>Entry not found</Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.surface }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Journal Entry" showBack={true} showMenu={true} />

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Centered date & title */}
          <View style={styles.entryHeaderCenter}>
            <Text style={[styles.prettyDate, { color: '#B06200' }]}>
              {formatDate(entry.created_at)}
            </Text>
            <Text style={[styles.bigTitle, { color: theme.colors.text }]}>{entry.title}</Text>
          </View>

          {/* Chips row */}
          {(entry.tags?.length || entry.emotion_type) ? (
            <View style={styles.chipsRow}>
              {entry.tags?.map((tag, i) => (
                <View key={`${entry.id}-chip-${tag}-${i}`} style={[styles.chip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.chipText, { color: theme.colors.textSecondary }]}>{tag}</Text>
                </View>
              ))}
              {entry.emotion_type && (
                <View style={[styles.chip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.chipText, { color: theme.colors.textSecondary }]}>{entry.emotion_type.replace('-', ' ')}</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Visual block removed */}

          {/* Optional audio pill */}
          {(entry.tags?.some(t => /audio|voice|record/i.test(t)) ?? false) && (
            <View style={[styles.audioPill, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.audioLeft}>
                <View style={[styles.playButton, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="play" size={18} color={theme.colors.surface} />
                </View>
                <View style={styles.waveBar} />
              </View>
              <Text style={[styles.audioDuration, { color: theme.colors.textSecondary }]}>00:32</Text>
            </View>
          )}

          {/* Body */}
          <Text style={[styles.entryBody, { color: theme.colors.text }]}>{entry.content}</Text>

          {/* Shared notice */}
          {entry.share_with_support_worker && (
            <View style={[styles.sharedCard, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text style={[styles.sharedCardText, { color: theme.colors.primary }]}>This entry is shared with your support worker</Text>
            </View>
          )}
        </ScrollView>

        {/* Floating actions */}
        <View style={styles.fabBar}>
          <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.surface }]} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.surface }, deleting && styles.disabledButton]} onPress={handleDelete} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={theme.colors.text} />
            )}
          </TouchableOpacity>
        </View>

        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideStatusModal}
          buttonText="OK"
        />

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  entryHeaderCenter: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  prettyDate: {
    fontSize: scaledFontSize(14),
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  bigTitle: {
    fontSize: scaledFontSize(28),
    fontWeight: '700',
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: scaledFontSize(13),
  },
  // heroImage removed
  audioPill: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  audioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DADADA',
    flex: 1,
  },
  audioDuration: {
    fontSize: scaledFontSize(12),
    marginLeft: Spacing.md,
  },
  entryBody: {
    fontSize: scaledFontSize(16),
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: Spacing.md,
    color: "#666",
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  notFoundText: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    color: "#666",
  },
  backButton: {
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  backButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
  entryHeader: {
    marginBottom: Spacing.xl,
  },
  entryDate: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginBottom: Spacing.sm,
    color: "#666",
  },
  entryTitle: {
    fontSize: scaledFontSize(24), // Base size 24px
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  entryMood: {
    fontSize: scaledFontSize(16), // Base size 16px
    textTransform: "capitalize",
    color: "#666",
  },
  entryContent: {
    fontSize: scaledFontSize(16), // Base size 16px
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
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    fontSize: scaledFontSize(14), // Base size 14px
  },
  sharedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sharedCardText: {
    fontSize: scaledFontSize(16), // Base size 16px
    marginLeft: Spacing.md,
    flex: 1,
  },
  entryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
  },
  editButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    marginLeft: Spacing.sm,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    marginLeft: Spacing.sm,
    fontWeight: "600",
  },
  fabBar: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.lg,
    backgroundColor: 'transparent',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});