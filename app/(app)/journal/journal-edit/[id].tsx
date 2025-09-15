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
import { Colors, Spacing, Typography } from "../../../../constants/theme";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";

// Mock user data 
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
  uid: "demo-user-id",
};

const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

// Navigation tabs configuration
const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

// Emotion types and options for journal entries
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

// Mock journal entry data for demonstration
const mockJournalEntry = {
  id: "1",
  title: "My Journal Entry",
  content: "Today was a productive day. I accomplished many tasks and felt satisfied with my progress.",
  mood_type: "happy" as EmotionType,
  emoji: "🙂",
  tags: ["productive", "satisfied"],
  created_at: new Date().toISOString(),
};

/**
 * JournalEditScreen Component
 * 
 * A screen for editing existing journal entries with a beautiful curved background.
 * Users can modify the title, content, and emotional state of their journal entry.
 * Includes navigation controls and a visually appealing interface.
 */
export default function JournalEditScreen() {
  const { id } = useLocalSearchParams();
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

  /**
   * Handles navigation tab presses
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

  // Simulate loading journal entry data on component mount
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        // Simulate network request delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use mock data for frontend demonstration
        setJournalData({
          title: mockJournalEntry.title,
          content: mockJournalEntry.content,
          emotion: mockJournalEntry.mood_type,
          emoji: mockJournalEntry.emoji,
          tags: mockJournalEntry.tags,
        });
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        Alert.alert("Error", "Failed to load journal entry");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  /**
   * Updates the journal title in state
   * @param text - The new title text
   */
  const handleTitleChange = (text: string) => {
    setJournalData((prev) => ({ ...prev, title: text }));
  };

  /**
   * Updates the journal content in state
   * @param text - The new content text
   */
  const handleContentChange = (text: string) => {
    setJournalData((prev) => ({ ...prev, content: text }));
  };

  /**
   * Handles emotion selection for the journal entry
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
   * Saves the journal entry changes (frontend simulation)
   */
  const handleSave = async () => {
    if (!journalData.title.trim() || !journalData.content.trim()) {
      Alert.alert("Missing Fields", "Please fill all fields before saving");
      return;
    }

    setSaving(true);

    try {
      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would call an API to save the changes
      console.log("Saving journal entry:", {
        ...journalData,
        id: id || "new-entry",
      });
      
      // Navigate back after successful "save"
      router.back();
    } catch (error) {
      console.error("Error updating journal entry:", error);
      Alert.alert("Error", "Failed to update journal entry");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handles cancel action with confirmation dialog
   */
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

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CurvedBackground>
          <View style={styles.centered}>
            <Text>Loading your journal entry...</Text>
          </View>
        </CurvedBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CurvedBackground />
      
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
            {/* Journal Title Input */}
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

            {/* Journal Content Input */}
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

            {/* Emotion Selection */}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});