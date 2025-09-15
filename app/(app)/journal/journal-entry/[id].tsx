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
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { useAuth } from "../../../context/AuthContext";
import { JournalService, supabase } from "../../../lib/supabase";
import { AppHeader } from "../../../components/AppHeader";
import BottomNavigation from "../../../components/BottomNavigation";

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
});

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journal");
  const [sideMenuVisible, setSideMenuVisible] = useState(false);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  useEffect(() => {
    const fetchEntry = async () => {
      if (!user || !id) return;

      try {
        setLoading(true);
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("id")
          .eq("firebase_uid", user.uid)
          .single();

        if (clientError || !clientData) {
          throw clientError || new Error("Client not found");
        }

        const entryData = await JournalService.getEntryById(
          clientData.id,
          id as string
        );
        setEntry(entryData);
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        Alert.alert("Error", "Failed to load journal entry");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [user, id]);

  const handleDelete = async () => {
    if (!user || !id) return;

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
              const { data: clientData, error: clientError } = await supabase
                .from("clients")
                .select("id")
                .eq("firebase_uid", user.uid)
                .single();

              if (clientError || !clientData) {
                throw clientError || new Error("Client not found");
              }

              await JournalService.deleteEntry(clientData.id, id as string);
              router.replace("/(app)/journaling");
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

  const handleEdit = () => {
    router.push(`/(app)/journal-edit/${id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Entry not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Journal Entry"
        showBack={true}
        showMenu={true}
        onMenuPress={() => setSideMenuVisible(true)}
      />

      <ScrollView style={styles.content}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{entry.formattedDate}</Text>
          <Text style={styles.entryTitle}>{entry.title}</Text>
          {entry.emoji && (
            <Text style={styles.entryMood}>
              {entry.emoji} {entry.mood_type}
            </Text>
          )}
        </View>

        <Text style={styles.entryContent}>{entry.content}</Text>

        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Added entry actions buttons */}
        <View style={styles.entryActions}>
          <TouchableOpacity
            style={styles.entryActionButton}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.entryActionButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
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
