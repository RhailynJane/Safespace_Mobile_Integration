import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
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
import { useTheme } from "../../../contexts/ThemeContext";
import StatusModal from "../../../components/StatusModal";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

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
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("journal");
  const [currentStep, setCurrentStep] = useState<CreateStep>("create");
  interface JournalTemplate { id: number; name: string; description: string; prompts: string[]; icon: string; }
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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideStatusModal = () => {
    setModalVisible(false);
  };

  // Live templates from Convex
  const liveTemplates = useQuery(api.journal.listTemplates, {});
  useEffect(() => {
    if (Array.isArray(liveTemplates)) {
      setTemplates(liveTemplates as JournalTemplate[]);
      setLoadingTemplates(false);
    } else {
      setLoadingTemplates(true);
    }
  }, [liveTemplates]);

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

  const createEntry = useMutation(api.journal.createEntry);

  const handleSave = async () => {
    if (
      !journalData.title.trim() ||
      !journalData.content.trim() ||
      !journalData.emotion
    ) {
      showStatusModal('error', 'Missing Fields', 'Please fill all required fields before saving.');
      return;
    }

    if (!user?.id) {
      showStatusModal('error', 'Authentication Error', 'Please sign in to save journal entries.');
      return;
    }

    setLoading(true);

    try {
      const response = await createEntry({
        clerkUserId: user.id,
        title: journalData.title.trim(),
        content: journalData.content.trim(),
        emotionType: journalData.emotion || undefined,
        emoji: journalData.emoji,
        templateId: journalData.templateId || undefined,
        shareWithSupportWorker: journalData.shareWithSupportWorker,
      });

      if (response?.success) {
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
      showStatusModal('error', 'Save Failed', error.message || "Unable to save journal entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/(app)/journal");
  };

  const handleCancel = () => {
    showStatusModal('info', 'Discard Entry?', 
      'Are you sure you want to discard this journal entry? Your changes will be lost.'
    );
    // Note: If you need custom button handling, consider using the StatusModal's onClose callback
    // or navigating after confirmation in the actual usage
  };

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={handleSuccessClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.successModal, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>Success!</Text>
          <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>{successMessage}</Text>
          {journalData.shareWithSupportWorker && (
            <View style={[styles.sharedInfo, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text style={[styles.sharedInfoText, { color: theme.colors.primary }]}>
                Your support worker has been notified
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.successButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSuccessClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.successButtonText, { color: theme.colors.surface }]}>View All Entries</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCreateStep = () => (
    <View style={styles.createContainer}>
      <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Add New Journal</Text>
      <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
        Express your thoughts and feelings
      </Text>

      {/* Template Selection */}
      {!loadingTemplates && templates.length > 0 && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Choose a Template (Optional)</Text>
          <Text style={[styles.templateSubtext, { color: theme.colors.textSecondary }]}>
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
                  { backgroundColor: theme.colors.surface },
                  journalData.templateId === template.id && [
                    styles.templateCardSelected,
                    { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' }
                  ],
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
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.templateName,
                    { color: theme.colors.textSecondary },
                    journalData.templateId === template.id && [
                      styles.templateNameSelected,
                      { color: theme.colors.primary }
                    ],
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
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.templatesLoadingText, { color: theme.colors.textSecondary }]}>Loading templates...</Text>
        </View>
      )}

      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Journal Title *</Text>
        <TextInput
          style={[
            styles.titleInput, 
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }
          ]}
          placeholder="Give your entry a title..."
          value={journalData.title}
          onChangeText={handleTitleChange}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <View>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Write your Entry *</Text>
            {selectedTemplate && (
              <Text style={[styles.templatePromptHint, { color: theme.colors.primary }]}>
                Using template: {selectedTemplate.name}
              </Text>
            )}
          </View>
          <View style={styles.characterRow}>
            <Text
              style={[
                styles.characterCount,
                { color: theme.colors.textSecondary },
                characterCount >= MAX_CHARACTERS && [styles.characterCountMax, { color: theme.colors.error }],
              ]}
            >
              {characterCount}/{MAX_CHARACTERS}
            </Text>
          </View>
        </View>
        
        <TextInput
          style={[
            styles.contentInput, 
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }
          ]}
          placeholder="Write about your day, feelings or anything on your mind..."
          value={journalData.content}
          onChangeText={handleContentChange}
          multiline
          textAlignVertical="top"
          placeholderTextColor={theme.colors.textSecondary}
          maxLength={MAX_CHARACTERS}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>How are you feeling? *</Text>
        <Text style={[styles.emotionSubtext, { color: theme.colors.textSecondary }]}>Select your current mood</Text>
        <View style={styles.emotionsContainer}>
          {emotionOptions.map((emotion) => (
            <TouchableOpacity
              key={emotion.id}
              style={[
                styles.emotionButton,
                { backgroundColor: theme.colors.surface },
                journalData.emotion === emotion.id && [
                  styles.emotionButtonSelected,
                  { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' }
                ],
              ]}
              onPress={() => handleEmotionSelect(emotion)}
              activeOpacity={0.8}
            >
              <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
              <Text style={[
                styles.emotionLabel,
                { color: theme.colors.textSecondary },
                journalData.emotion === emotion.id && [styles.emotionLabelSelected, { color: theme.colors.primary }]
              ]}>
                {emotion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <View style={[
          styles.shareContainer, 
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }
        ]}>
          <View style={styles.shareTextContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Share with Support Worker</Text>
            <Text style={[styles.shareSubtext, { color: theme.colors.textSecondary }]}>
              Your support worker will be able to view this entry
            </Text>
          </View>
          <Switch
            value={journalData.shareWithSupportWorker}
            onValueChange={handleToggleShare}
            trackColor={{ false: theme.colors.textDisabled, true: theme.colors.primary + "50" }}
            thumbColor={
              journalData.shareWithSupportWorker
                ? theme.colors.primary
                : theme.colors.surface
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
          style={[
            styles.cancelButton, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }
          ]} 
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton, 
            { backgroundColor: theme.colors.primary },
            loading && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.colors.surface }]}>Save</Text>
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

        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideStatusModal}
          buttonText="OK"
        />

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
    fontSize: scaledFontSize(24), // Base size 24px
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  pageSubtitle: {
    fontSize: scaledFontSize(14), // Base size 14px
    textAlign: "center",
    marginBottom: Spacing.xxl,
    color: "#666",
  },
  fieldContainer: {
    marginBottom: Spacing.xxl,
  },
  fieldLabel: {
    fontSize: scaledFontSize(16), // Base size 16px
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
    fontSize: scaledFontSize(12), // Base size 12px
  },
  characterCountMax: {
    fontWeight: "600",
  },
  titleInput: {
    borderRadius: 12,
    padding: Spacing.lg,
    fontSize: scaledFontSize(16), // Base size 16px
    borderWidth: 1,
  },
  contentInput: {
    borderRadius: 12,
    padding: Spacing.lg,
    fontSize: scaledFontSize(16), // Base size 16px
    height: 450,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  // Template Styles
  templateSubtext: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginBottom: Spacing.lg,
    color: "#666",
  },
  templatePromptHint: {
    fontSize: scaledFontSize(12), // Base size 12px
    fontStyle: 'italic',
    marginTop: 2,
  },
  templatesScrollContainer: {
    paddingRight: Spacing.xl,
  },
  templateCard: {
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
  },
  templateIconContainer: {
    marginBottom: Spacing.sm,
  },
  templateName: {
    fontSize: scaledFontSize(12), // Base size 12px
    textAlign: "center",
  },
  templateNameSelected: {
    fontWeight: "600",
  },
  templatesLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  templatesLoadingText: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginLeft: Spacing.sm,
    color: "#666",
  },
  // Emotion Styles
  emotionSubtext: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginBottom: Spacing.lg,
    color: "#666",
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
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emotionButtonSelected: {
    borderColor: Colors.primary,
  },
  emotionEmoji: {
    fontSize: scaledFontSize(28), // Base size 28px
    marginBottom: Spacing.xs,
  },
  emotionLabel: {
    fontSize: scaledFontSize(12), // Base size 12px
    textAlign: "center",
  },
  emotionLabelSelected: {
    fontWeight: "600",
  },
  shareContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  shareTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  shareSubtext: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: 4,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xl,
    marginBottom: 100,
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
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
    fontSize: scaledFontSize(24), // Base size 24px
    fontWeight: "700",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  successMessage: {
    fontSize: scaledFontSize(16), // Base size 16px
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 22,
    color: "#666",
  },
  sharedInfo: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    alignSelf: "stretch",
  },
  sharedInfoText: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginLeft: Spacing.sm,
    flex: 1,
  },
  successButton: {
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignSelf: "stretch",
    alignItems: "center",
  },
  successButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
});