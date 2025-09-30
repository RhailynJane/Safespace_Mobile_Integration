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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { AppHeader } from "../../../components/AppHeader";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { journalApi, JournalTemplate } from "../../../utils/journalApi";

type EmotionType = "very-sad" | "sad" | "neutral" | "happy" | "very-happy";
type CreateStep = "create" | "success";

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

interface JournalData {
  title: string;
  content: string;
  emotion: EmotionType | null;
  emoji: string;
  templateId: number | null;
  shareWithSupportWorker: boolean;
}

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

const MAX_CHARACTERS = 1000;

export default function JournalCreateScreen() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("journal");
  const [currentStep, setCurrentStep] = useState<CreateStep>("create");
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [journalData, setJournalData] = useState<JournalData>({
    title: "",
    content: "",
    emotion: null,
    emoji: "",
    templateId: null,
    shareWithSupportWorker: false,
  });
  const [loading, setLoading] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await journalApi.getTemplates();
      setTemplates(response.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      Alert.alert("Error", "Failed to load journal templates");
    } finally {
      setLoadingTemplates(false);
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

  const handleTemplateSelect = (templateId: number) => {
    setJournalData((prev) => ({
      ...prev,
      templateId: prev.templateId === templateId ? null : templateId,
    }));
  };

  const handleToggleShare = (value: boolean) => {
    setJournalData((prev) => ({
      ...prev,
      shareWithSupportWorker: value,
    }));
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleSave = async () => {
    if (
      !journalData.title.trim() ||
      !journalData.content.trim() ||
      !journalData.emotion
    ) {
      Alert.alert("Missing Fields", "Please fill all required fields");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);

    try {
      const response = await journalApi.createEntry({
        clerkUserId: user.id,
        title: journalData.title.trim(),
        content: journalData.content.trim(),
        emotionType: journalData.emotion,
        emoji: journalData.emoji,
        templateId: journalData.templateId || undefined,
        shareWithSupportWorker: journalData.shareWithSupportWorker,
      });

      if (response.success) {
        setSavedEntryId(response.entry.id);
        setCurrentStep("success");
      }
    } catch (error: any) {
      console.error("Error saving journal entry:", error);
      Alert.alert("Error", error.message || "Failed to save journal entry");
    } finally {
      setLoading(false);
    }
  };

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

  const handleClose = () => {
    router.push("/(app)/journal");
  };

  const renderCreateStep = () => (
    <View style={styles.createContainer}>
      <Text style={styles.pageTitle}>Add New Journal</Text>
      <Text style={styles.pageSubtitle}>
        Express your thoughts and feelings
      </Text>

      {/* Template Selection */}
      {!loadingTemplates && templates.length > 0 && (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Choose a Template (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  journalData.templateId === template.id &&
                    styles.templateCardSelected,
                ]}
                onPress={() => handleTemplateSelect(template.id)}
              >
                <Ionicons
                  name={template.icon as any}
                  size={24}
                  color={
                    journalData.templateId === template.id
                      ? Colors.primary
                      : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.templateName,
                    journalData.templateId === template.id &&
                      styles.templateNameSelected,
                  ]}
                >
                  {template.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
              characterCount >= MAX_CHARACTERS && styles.characterCountMax,
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
            <Text style={styles.fieldLabel}>Share with Support Worker</Text>
            <Text style={styles.shareSubtext}>
              Your support worker will be able to view this entry
            </Text>
          </View>
          <Switch
            value={journalData.shareWithSupportWorker}
            onValueChange={handleToggleShare}
            trackColor={{ false: Colors.disabled, true: Colors.primary + "50" }}
            thumbColor={
              journalData.shareWithSupportWorker
                ? Colors.primary
                : Colors.surface
            }
          />
        </View>
      </View>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successMessage}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={styles.successTitle}>Entry Saved!</Text>
        <Text style={styles.successSubtitle}>
          Your journal entry has been saved successfully
        </Text>

        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>View All Entries</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
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
  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    alignItems: "center",
    minWidth: 100,
    borderWidth: 2,
    borderColor: "transparent",
  },
  templateCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  templateName: {
    ...Typography.caption,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
  templateNameSelected: {
    color: Colors.primary,
    fontWeight: "600",
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
    justifyContent: "center",
  },
  successMessage: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xxl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successTitle: {
    ...Typography.title,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: Spacing.xl,
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
});