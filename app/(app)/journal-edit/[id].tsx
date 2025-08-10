import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

type EmotionType = "very-sad" | "sad" | "neutral" | "happy" | "very-happy";

interface EmotionOption {
  id: EmotionType;
  emoji: string;
  label: string;
}

const emotionOptions: EmotionOption[] = [
  { id: "very-sad", emoji: "😢", label: "Very Sad" },
  { id: "sad", emoji: "🙁", label: "Sad" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "happy", emoji: "🙂", label: "Happy" },
  { id: "very-happy", emoji: "😄", label: "Very Happy" },
];

export default function JournalEditScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [journalData, setJournalData] = useState({
    title: "",
    content: "",
    emotion: null as EmotionType | null,
    emoji: "",
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

        setJournalData({
          title: entryData.title,
          content: entryData.content,
          emotion: entryData.mood_type as EmotionType | null,
          emoji: entryData.emoji,
          tags: entryData.tags || [],
        });
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        Alert.alert("Error", "Failed to load journal entry");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [user, id]);

  const handleTitleChange = (text: string) => {
    setJournalData((prev) => ({ ...prev, title: text }));
  };

  const handleContentChange = (text: string) => {
    setJournalData((prev) => ({ ...prev, content: text }));
  };

  const handleEmotionSelect = (emotion: EmotionOption) => {
    setJournalData((prev) => ({
      ...prev,
      emotion: emotion.id,
      emoji: emotion.emoji,
    }));
  };

  const handleSave = async () => {
    if (!journalData.title.trim() || !journalData.content.trim()) {
      Alert.alert("Missing Fields", "Please fill all fields before saving");
      return;
    }

    if (!user || !id) return;

    setSaving(true);

    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("firebase_uid", user.uid)
        .single();

      if (clientError || !clientData)
        throw clientError || new Error("Client not found");

      await JournalService.updateEntry(clientData.id, id as string, {
        title: journalData.title,
        content: journalData.content,
        mood_type: journalData.emotion || undefined,
        tags: journalData.tags,
      });

      router.back();
    } catch (error) {
      console.error("Error updating journal entry:", error);
      Alert.alert("Error", "Failed to update journal entry");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to discard your changes?",
      [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Edit Journal"
        showBack={true}
        showMenu={true}
        onMenuPress={() => setSideMenuVisible(true)}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.createContainer}>
            {/* Journal Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Journal Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Give your entry a title..."
                value={journalData.title}
                onChangeText={handleTitleChange}
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Write Entry */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Write your Entry</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Write about your day, feelings or anything on your mind..."
                value={journalData.content}
                onChangeText={handleContentChange}
                multiline
                textAlignVertical="top"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Select Emotion */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Select your Emotion</Text>
              <View style={styles.emotionsContainer}>
                {emotionOptions.map((emotion) => (
                  <TouchableOpacity
                    key={emotion.id}
                    style={[
                      styles.emotionButton,
                      journalData.emotion === emotion.id &&
                        styles.emotionButtonSelected,
                    ]}
                    onPress={() => handleEmotionSelect(emotion)}
                  >
                    <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 80, // Space for bottom navigation
  },
  createContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  fieldContainer: {
    marginBottom: Spacing.xxl,
  },
  fieldLabel: {
    ...Typography.subtitle,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  titleInput: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    padding: Spacing.lg,
    ...Typography.body,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: "transparent",
  },
  contentInput: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    padding: Spacing.lg,
    ...Typography.body,
    color: Colors.textPrimary,
    height: 150,
    borderWidth: 2,
    borderColor: "transparent",
  },
  emotionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
  },
  emotionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emotionButtonSelected: {
    backgroundColor: Colors.primary + "30",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  emotionEmoji: {
    fontSize: 24,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.disabled,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.button,
  },
});
