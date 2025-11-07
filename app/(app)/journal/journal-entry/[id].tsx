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
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", { ...options, timeZone: APP_TIME_ZONE });
  };

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

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.entryHeader}>
            <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>{formatDate(entry.created_at)}</Text>
            <Text style={[styles.entryTitle, { color: theme.colors.text }]}>{entry.title}</Text>
            {entry.emoji && entry.emotion_type && (
              <Text style={[styles.entryMood, { color: theme.colors.textSecondary }]}>
                {entry.emoji} {entry.emotion_type.replace("-", " ")}
              </Text>
            )}
          </View>

          <Text style={[styles.entryContent, { color: theme.colors.text }]}>{entry.content}</Text>

          {entry.tags && entry.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {entry.tags.map((tag: string, index: number) => (
                <View 
                  key={`${entry.id}-${tag}-${index}`} 
                  style={[styles.tag, { backgroundColor: theme.colors.primary + '20' }]}
                >
                  <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {entry.share_with_support_worker && (
            <View style={[styles.sharedCard, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text style={[styles.sharedCardText, { color: theme.colors.primary }]}>
                This entry is shared with your support worker
              </Text>
            </View>
          )}

          <View style={styles.entryActions}>
            <TouchableOpacity
              style={[
                styles.editButton, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.primary 
                }
              ]}
              onPress={handleEdit}
              disabled={deleting}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { 
                  backgroundColor: theme.colors.error,
                  borderColor: theme.colors.error 
                },
                deleting && styles.disabledButton,
              ]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.surface} />
                  <Text style={[styles.deleteButtonText, { color: theme.colors.surface }]}>
                    Delete
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

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
});