/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../contexts/ThemeContext";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import BottomNavigation from "../../../components/BottomNavigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import StatusModal from "../../../components/StatusModal";

interface MoodEntry {
  id: string;
  mood_type: string;
  mood_emoji: string;
  mood_label: string;
  notes?: string;
  created_at: string;
  factors?: string[];
}

const MoodEntryDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState("home");
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [status, setStatus] = useState<{ 
    visible: boolean; 
    title?: string; 
    message?: string; 
    type?: "success" | "error" 
  }>({ visible: false });

  const history = useQuery(
    api.moods.getMoodHistory,
    userId ? { userId, limit: 100, offset: 0 } : "skip"
  ) as { moods: MoodEntry[] } | undefined;

  const entry = history?.moods.find((m) => m.id === id);
  const updateMood = useMutation(api.moods.updateMood);
  const deleteMood = useMutation(api.moods.deleteMood);

  // Navigation tabs
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

  React.useEffect(() => {
    if (entry?.notes) {
      setEditedNotes(entry.notes);
    }
  }, [entry?.notes]);

  const handleSave = async () => {
    if (!entry) return;
    try {
      await updateMood({
        id: entry.id as any,
        notes: editedNotes,
      });
      setStatus({
        visible: true,
        type: "success",
        title: "Saved",
        message: "Your mood entry has been updated.",
      });
      setIsEditing(false);
    } catch (error: any) {
      setStatus({
        visible: true,
        type: "error",
        title: "Error",
        message: error.message || "Failed to update mood entry.",
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Mood Entry",
      "Are you sure you want to delete this mood entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMood({ id: id as any });
              setStatus({
                visible: true,
                type: "success",
                title: "Deleted",
                message: "Mood entry has been deleted.",
              });
              setTimeout(() => {
                router.back();
              }, 1500);
            } catch (error: any) {
              setStatus({
                visible: true,
                type: "error",
                title: "Error",
                message: error.message || "Failed to delete mood entry.",
              });
            }
          },
        },
      ]
    );
  };

  if (!entry) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Mood Entry" showBack={true} />
          <View style={styles.centerContent}>
            <Ionicons name="sad-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.notFoundText, { color: theme.colors.text }]}>
              Mood entry not found
            </Text>
          </View>
          <BottomNavigation tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  const createdDate = new Date(entry.created_at);
  const formattedDate = createdDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = createdDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader 
          title="Mood Entry" 
          showBack={true}
        />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Mood Display */}
          <View style={[styles.moodCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.moodHeader}>
              <Text style={styles.moodEmoji}>{entry.mood_emoji}</Text>
              <View style={styles.moodInfo}>
                <Text style={[styles.moodLabel, { color: theme.colors.text }]}>
                  {entry.mood_label}
                </Text>
                <Text style={[styles.moodType, { color: theme.colors.textSecondary }]}>
                  {entry.mood_type}
                </Text>
              </View>
            </View>
          </View>

          {/* Date & Time */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {formattedDate}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {formattedTime}
              </Text>
            </View>
          </View>

          {/* Factors */}
          {entry.factors && entry.factors.length > 0 && (
            <View style={[styles.factorsCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Contributing Factors
              </Text>
              <View style={styles.factorsContainer}>
                {entry.factors.map((factor, index) => (
                  <View
                    key={index}
                    style={[styles.factorChip, { backgroundColor: theme.colors.primary + "20" }]}
                  >
                    <Text style={[styles.factorText, { color: theme.colors.primary }]}>
                      {factor}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          <View style={[styles.notesCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.notesHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                What Happened
              </Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                  <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.editBtnText, { color: theme.colors.primary }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <View>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  value={editedNotes}
                  onChangeText={setEditedNotes}
                  placeholder="Write about what happened..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditedNotes(entry.notes || "");
                      setIsEditing(false);
                    }}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.background }]}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                  >
                    <Text style={[styles.actionBtnText, { color: "#FFF" }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[styles.notesText, { color: theme.colors.text }]}>
                {entry.notes || "No notes added"}
              </Text>
            )}
          </View>

          {/* Delete Button */}
          <TouchableOpacity 
            onPress={handleDelete} 
            style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
          >
            <Ionicons name="trash-outline" size={20} color="#FFF" />
            <Text style={styles.deleteButtonText}>Delete Mood Entry</Text>
          </TouchableOpacity>
        </ScrollView>

        <StatusModal
          visible={status.visible}
          onClose={() => setStatus({ visible: false })}
          title={status.title || ""}
          message={status.message || ""}
          type={status.type || "info"}
        />

        <BottomNavigation tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    </CurvedBackground>
  );
};

export default MoodEntryDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  notFoundText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
  },
  moodCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  moodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 64,
    marginRight: 16,
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  moodType: {
    fontSize: 16,
    textTransform: "capitalize",
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
  },
  factorsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  factorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  factorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  factorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  notesInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    borderWidth: 1,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
