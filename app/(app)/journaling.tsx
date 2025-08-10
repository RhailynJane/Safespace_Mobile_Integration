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
import { Colors, Spacing, Typography } from "../../constants/theme";
import BottomNavigation from "../../components/BottomNavigation";
import { AppHeader } from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { JournalService, supabase } from "../../lib/supabase";

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

export default function JournalScreen() {
  const { user } = useAuth();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journal");
  const [sideMenuVisible, setSideMenuVisible] = useState(false);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // First get the client_id for the current user
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("id")
          .eq("firebase_uid", user.uid)
          .single();

        if (clientError || !clientData) {
          throw clientError || new Error("Client not found");
        }

        const entries = await JournalService.getEntries(clientData.id, "week");
        setJournalEntries(entries);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleCreateJournal = () => {
    router.push("/(app)/journal-create");
  };

  const handleViewAllEntries = () => {
    router.push("/(app)/journal-history");
  };

  const handleEntryPress = (entryId: string) => {
    router.push(`/(app)/journal-entry/${entryId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Journal" showBack={true} showMenu={true} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.subText}>Express your thoughts and feelings</Text>

          {/* Create Journal Card */}
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

          {/* Recent Journal Entries */}
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
                    <Text style={styles.viewAllText}>View Journal Entries</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.noEntriesText}>No entries recorded</Text>

                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={handleViewAllEntries}
                  >
                    <Text style={styles.viewAllText}>View Journal Entries</Text>
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
  );
}

// ... keep your existing styles ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl, // Extra padding for bottom nav
  },
  // Updated header to match mood tracking
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: "600",
  },
  menuButton: {
    padding: Spacing.sm,
  },
  // Rest of your existing styles...
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
