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
  Switch,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../../../constants/theme";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { journalApi, JournalEntry } from "../../../../utils/journalApi";

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

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

const MAX_CHARACTERS = 1000;

export default function JournalEditScreen() {
  const { id } = useLocalSearchParams();
  const [journalData, setJournalData] = useState({
    title: "",
    content: "",
    emotion: null as EmotionType | null,
    emoji: "",
    shareWithSupportWorker: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("journal");
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchEntry();
    }
  }, [id]);

  const fetchEntry = async () => {
    try {
      setLoading(true);
      const response = await journalApi.getEntry(id as string);
      const entry = response.entry;
      
      setJournalData({
        title: entry.title,
        content: entry.content,
        emotion: entry.emotion_type as EmotionType,
        emoji: entry.emoji || "",
        shareWithSupportWorker: entry.share_with_support_worker,
      });
      setCharacterCount(entry.content.length);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      Alert.alert("Error", "Failed to load journal entry", [
        { text: "OK", onPress: () => router.back() },
      ]);
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

  const handleTitleChange = (text: string) => {
    setJournalData((prev) => ({ ...prev, title: text }));
  };

  const handleContentChange = (text: string) => {
    if (text.length <= MAX_CHARACTERS) {
      setJournalData((prev) => ({ ...prev, content: text }));
      setCharacterCount(text.length);
    }
  };

  const handleEmotionSelect = (emotion: EmotionOption) => {
    setJournalData((prev) => ({
      ...prev,
      emotion: emotion.id,
      emoji: emotion.emoji,
    }));
  };

  const handleToggleShare = (value: boolean) => {
    setJournalData((prev) => ({
      ...prev,
      shareWithSupportWorker: value,
    }));
  };

  const handleSave = async () => {
    if (!journalData.title.trim() || !journalData.content.trim()) {
      Alert.alert("Missing Fields", "Please fill all required fields");
      return;
    }

    setSaving(true);

    try {
      await journalApi.updateEntry(id as string, {
        title: journalData.title.trim(),
        content: journalData.content.trim(),
        emotionType: journalData.emotion || undefined,
        emoji: journalData.emoji,
        shareWithSupportWorker: journalData.shareWithSupportWorker,
      });

      Alert.alert("Success", "Journal entry updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error updating journal entry:", error);
      Alert.alert("Error", error.message || "Failed to update journal entry");
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
      <CurvedBackground>
        <SafeAreaView style={styles.container}>
          <AppHeader title="Edit Journal" showBack={true} showMenu={true} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading entry...</Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Edit Journal" showBack={true} showMenu={true} />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.createContainer}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Journal Title *</Text>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Give your entry a title..."
                  value={journalData.title}
                  onChangeText={handleTitleChange}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Write your Entry *</Text>
                  <Text
                    style={[
                      styles.characterCount,
                      characterCount >= MAX_CHARACTERS &&
                        styles.characterCountMax,
                    ]}
                  >
                    {characterCount}/{MAX_CHARACTERS}
                  </Text>
                </View>
                <TextInput
                  style={styles.contentInput}
                  placeholder="Write about your day, feelings or anything on your mind..."
                  value={journalData.content}
                  onChangeText={handleContentChange}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor={Colors.textTertiary}
                  maxLength={MAX_CHARACTERS}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Select your Emotion *</Text>
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

              <View style={styles.fieldContainer}>
                <View style={styles.shareContainer}>
                  <View style={styles.shareTextContainer}>
                    <Text style={styles.fieldLabel}>
                      Share with Support Worker
                    </Text>
                    <Text style={styles.shareSubtext}>
                      Your support worker will be able to view this entry
                    </Text>
                  </View>
                  <Switch
                    value={journalData.shareWithSupportWorker}
                    onValueChange={handleToggleShare}
                    trackColor={{
                      false: Colors.disabled,
                      true: Colors.primary + "50",
                    }}
                    thumbColor={
                      journalData.shareWithSupportWorker
                        ? Colors.primary
                        : Colors.surface
                    }
                  />
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
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
    paddingBottom: 80,
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
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  characterCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  characterCountMax: {
    color: Colors.error,
    fontWeight: "600",
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
    shadowOffset: { width: 0, height: 2 },
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
  shareContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  shareTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  shareSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});