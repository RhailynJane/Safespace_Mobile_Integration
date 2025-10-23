import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../../../constants/theme";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { journalApi, JournalEntry } from "../../../../utils/journalApi";
import { APP_TIME_ZONE } from "../../../../utils/timezone";
import { useTheme } from "../../../../contexts/ThemeContext";

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function JournalEntryScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journal");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const response = await journalApi.getEntry(id as string);
        setEntry(response.entry);
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        Alert.alert("Error", "Failed to load journal entry", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEntry();
    }
  }, [id]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry? This action cannot be undone.",
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
              setDeleting(true);
              await journalApi.deleteEntry(id as string);
              Alert.alert("Success", "Journal entry deleted successfully", [
                {
                  text: "OK",
                  onPress: () => router.replace("/(app)/journal"),
                },
              ]);
            } catch (error) {
              console.error("Error deleting journal entry:", error);
              Alert.alert("Error", "Failed to delete journal entry");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
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
    ...Typography.caption,
    marginTop: Spacing.md,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  notFoundText: {
    ...Typography.title,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  backButtonText: {
    ...Typography.button,
  },
  entryHeader: {
    marginBottom: Spacing.xl,
  },
  entryDate: {
    ...Typography.caption,
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
    textTransform: "capitalize",
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
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
  },
  sharedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sharedCardText: {
    ...Typography.body,
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
    ...Typography.button,
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
    ...Typography.button,
    marginLeft: Spacing.sm,
    fontWeight: "600",
  },
});