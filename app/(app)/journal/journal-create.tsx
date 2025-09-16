/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { AppHeader } from "../../../components/AppHeader";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";

// Mock user data
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
};

const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

// Emotion type definitions for the journal entry
type EmotionType = "very-sad" | "sad" | "neutral" | "happy" | "very-happy";
type CreateStep = "create" | "success";

// Emotion option interface and data
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

// Journal data interface
interface JournalData {
  title: string;
  content: string;
  emotion: EmotionType | null;
  emoji: string;
}

// Navigation tabs configuration
const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

/**
 * JournalCreateScreen Component
 *
 * A screen for creating new journal entries with emotion selection.
 * Features a two-step process: creation and success confirmation.
 * Uses mock data for frontend demonstration purposes.
 */
export default function JournalCreateScreen() {
  const [activeTab, setActiveTab] = useState("journal");
  const [currentStep, setCurrentStep] = useState<CreateStep>("create");
  const [journalData, setJournalData] = useState<JournalData>({
    title: "",
    content: "",
    emotion: null,
    emoji: "",
  });
  const [loading, setLoading] = useState(false);

  /**
   * Handles title input change
   * @param text - The new title text
   */
  const handleTitleChange = (text: string) => {
    setJournalData((prev) => ({ ...prev, title: text }));
  };

  /**
   * Handles content input change
   * @param text - The new content text
   */
  const handleContentChange = (text: string) => {
    setJournalData((prev) => ({ ...prev, content: text }));
  };

  /**
   * Handles emotion selection
   * @param emotion - The selected emotion option
   */
  const handleEmotionSelect = (emotion: EmotionOption) => {
    setJournalData((prev) => ({
      ...prev,
      emotion: emotion.id,
      emoji: emotion.emoji,
    }));
  };

  /**
   * Handles tab press navigation
   * @param tabId - The ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Handles saving the journal entry (mock implementation)
   * Validates inputs and simulates a successful save
   */
  const handleSave = async () => {
    if (
      !journalData.title.trim() ||
      !journalData.content.trim() ||
      !journalData.emotion
    ) {
      Alert.alert("Missing Fields", "Please fill all fields before saving");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful save
      setCurrentStep("success");
    } catch (error) {
      console.error("Error saving journal entry:", error);
      Alert.alert("Error", "Failed to save journal entry");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles cancel action with confirmation
   */
  const handleCancel = () => {
    Alert.alert(
      "Discard Entry?",
      "Are you sure you want to discard this journal entry?",
      [
        { text: "Keep Writing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  /**
   * Handles closing the success screen
   */
  const handleClose = () => {
    router.push("/(app)/journal");
  };

  /**
   * Renders the journal creation form
   */
  const renderCreateStep = () => (
    <View style={styles.createContainer}>
      <Text style={styles.pageTitle}>Add New Journal</Text>
      <Text style={styles.pageSubtitle}>
        Express your thoughts and feelings
      </Text>

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
  );

  /**
   * Renders the success confirmation screen
   */
  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <Text style={styles.pageTitle}>Express your thoughts and feelings</Text>

      <View style={styles.createCardDisabled}>
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

          <View style={styles.createButton}>
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={Colors.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.successMessage}>
        <Text style={styles.successTitle}>Entry Saved!</Text>
        <Text style={styles.successSubtitle}>
          Your journal entry has been saved successfully
        </Text>

        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Journal Entries</Text>

        <View style={styles.recentContainer}>
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryEmoji}>{journalData.emoji}</Text>
              <View style={styles.entryInfo}>
                <Text style={styles.entryTitle}>{journalData.title}</Text>
                <Text style={styles.entryDate}>Today, 9:41 AM</Text>
              </View>
            </View>
            <Text style={styles.entryPreview} numberOfLines={2}>
              {journalData.content}
            </Text>
          </View>

          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View Journal Entries</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /**
   * Renders the action buttons (Cancel/Save)
   */
  const renderActionButtons = () => {
    if (currentStep === "success") return null;

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <AppHeader title="Journal" showBack={true} showMenu={true} />
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            style={{ marginBottom: 60 }}
          >
            {currentStep === "create" && renderCreateStep()}
            {currentStep === "success" && renderSuccessStep()}
            {renderActionButtons()}
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
    paddingTop: Spacing.md,
  },
  createContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  pageTitle: {
    ...Typography.title,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  pageSubtitle: {
    ...Typography.caption,
    textAlign: "center",
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
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
    gap: Spacing.lg,
    marginBottom: Spacing.huge,
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
  successContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  createCardDisabled: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    opacity: 0.6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    marginBottom: 20,
  },
  successMessage: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successTitle: {
    ...Typography.title,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  closeButtonText: {
    ...Typography.button,
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
  viewAllButton: {
    alignItems: "center",
  },
  viewAllText: {
    ...Typography.link,
    textDecorationLine: "underline",
  },
});
