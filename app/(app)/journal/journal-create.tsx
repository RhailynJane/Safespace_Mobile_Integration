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
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { AppHeader } from "../../../components/AppHeader";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { journalApi, JournalTemplate } from "../../../utils/journalApi";
import { useTheme } from "../../../contexts/ThemeContext";

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
  const { theme } = useTheme();
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
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleTemplateSelect = (template: JournalTemplate) => {
    const newTemplateId = journalData.templateId === template.id ? null : template.id;
    const newContent = newTemplateId === template.id ? template.prompts[0] : journalData.content;
    
    setJournalData((prev) => ({
      ...prev,
      templateId: newTemplateId,
      content: newContent || prev.content,
    }));

    setSelectedTemplate(newTemplateId === template.id ? template : null);
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
        
        // Set success message based on sharing status
        if (journalData.shareWithSupportWorker) {
          setSuccessMessage("Journal created and shared with your support worker");
        } else {
          setSuccessMessage("Journal entry created successfully");
        }
        
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error("Error saving journal entry:", error);
      Alert.alert("Error", error.message || "Failed to save journal entry");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/(app)/journal");
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

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={handleSuccessClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModal}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Success!</Text>
          <Text style={styles.successMessage}>{successMessage}</Text>
          {journalData.shareWithSupportWorker && (
            <View style={styles.sharedInfo}>
              <Ionicons name="people" size={20} color={Colors.primary} />
              <Text style={styles.sharedInfoText}>
                Your support worker has been notified
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.successButton}
            onPress={handleSuccessClose}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>View All Entries</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          <Text style={styles.templateSubtext}>
            Select a template to get started with guided prompts
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templatesScrollContainer}
          >
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  journalData.templateId === template.id &&
                    styles.templateCardSelected,
                ]}
                onPress={() => handleTemplateSelect(template)}
                activeOpacity={0.8}
              >
                <View style={styles.templateIconContainer}>
                  <Ionicons
                    name={template.icon as any}
                    size={20}
                    color={
                      journalData.templateId === template.id
                        ? Colors.primary
                        : Colors.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.templateName,
                    journalData.templateId === template.id &&
                      styles.templateNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {template.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loadingTemplates && (
        <View style={styles.templatesLoadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.templatesLoadingText}>Loading templates...</Text>
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
          <View>
            <Text style={styles.fieldLabel}>Write your Entry *</Text>
            {selectedTemplate && (
              <Text style={styles.templatePromptHint}>
                Using template: {selectedTemplate.name}
              </Text>
            )}
          </View>
          <View style={styles.characterRow}>
            <Text
              style={[
                styles.characterCount,
                characterCount >= MAX_CHARACTERS && styles.characterCountMax,
              ]}
            >
              {characterCount}/{MAX_CHARACTERS}
            </Text>
          </View>
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
        <Text style={styles.fieldLabel}>How are you feeling? *</Text>
        <Text style={styles.emotionSubtext}>Select your current mood</Text>
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
              activeOpacity={0.8}
            >
              <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
              <Text style={[
                styles.emotionLabel,
                journalData.emotion === emotion.id && styles.emotionLabelSelected
              ]}>
                {emotion.label}
              </Text>
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

  const renderActionButtons = () => {
    if (showSuccessModal) return null;

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <AppHeader title="Journal" showBack={true} showMenu={true} />
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            style={{ marginBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {currentStep === "create" && renderCreateStep()}
            {renderActionButtons()}
          </ScrollView>
        </KeyboardAvoidingView>

        {renderSuccessModal()}

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
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  characterRow: {
    alignItems: "flex-end",
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    ...Typography.body,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.disabled,
  },
  contentInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    ...Typography.body,
    color: Colors.textPrimary,
    height: 450,
    borderWidth: 1,
    borderColor: Colors.disabled,
    textAlignVertical: 'top',
  },
  // Template Styles
  templateSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  templatePromptHint: {
    ...Typography.caption,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  templatesScrollContainer: {
    paddingRight: Spacing.xl,
  },
  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    alignItems: "center",
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  templateIconContainer: {
    marginBottom: Spacing.sm,
  },
  templateName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: 12,
  },
  templateNameSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  templatesLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  templatesLoadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  // Emotion Styles
  emotionSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  emotionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  emotionButton: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emotionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  emotionEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  emotionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: 12,
  },
  emotionLabelSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  shareContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.disabled,
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.disabled,
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
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  successModal: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    ...Typography.title,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  successMessage: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sharedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    alignSelf: "stretch",
  },
  sharedInfoText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  successButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignSelf: "stretch",
    alignItems: "center",
  },
  successButtonText: {
    ...Typography.button,
  },
});