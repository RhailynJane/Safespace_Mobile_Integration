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
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../../../constants/theme";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

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

const MAX_CHARACTERS = 2000;

export default function JournalEditScreen() {
  const { theme, scaledFontSize } = useTheme();
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

  const liveEntry = useQuery(api.journal.getEntry, { id: id as any }) as { entry: any } | null | undefined;
  const fetchEntry = React.useCallback(async () => {
    try {
      setLoading(true);
      if (liveEntry && liveEntry.entry) {
        const entry = liveEntry.entry;
        setJournalData({
          title: entry.title,
          content: entry.content,
          emotion: entry.emotion_type as EmotionType,
          emoji: entry.emoji || "",
          shareWithSupportWorker: entry.share_with_support_worker,
        });
        setCharacterCount(entry.content.length);
      }
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      showStatusModal('error', 'Load Failed', 'Unable to load journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [liveEntry]);

  useEffect(() => {
    if (id) {
      fetchEntry();
    }
  }, [id, fetchEntry]);

  // Refresh entry when returning to this screen (ensures latest Convex state)
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        fetchEntry();
      }
    }, [id, fetchEntry])
  );

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

  const updateEntry = useMutation(api.journal.updateEntry);

  const handleSave = async () => {
    if (
      !journalData.title.trim() ||
      !journalData.content.trim() ||
      !journalData.emotion
    ) {
      showStatusModal('error', 'Missing Fields', 'Please fill all required fields before saving.');
      return;
    }

    setSaving(true);

    try {
      const response = await updateEntry({
        id: id as any,
        title: journalData.title.trim(),
        content: journalData.content.trim(),
        emotionType: journalData.emotion || undefined,
        emoji: journalData.emoji,
        shareWithSupportWorker: journalData.shareWithSupportWorker,
      });

      // Set success message based on sharing status
      if (journalData.shareWithSupportWorker) {
        setSuccessMessage("Journal updated and shared with your support worker");
      } else {
        setSuccessMessage("Journal entry updated successfully");
      }
      
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error updating journal entry:", error);
      showStatusModal('error', 'Update Failed', error.message || "Unable to update journal entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const handleCancel = () => {
    showStatusModal('info', 'Discard Changes?', 
      'Are you sure you want to discard your changes? Your edits will be lost.'
    );
    // Note: If you need custom button handling for the cancel confirmation, 
    // consider implementing a separate confirmation modal component
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
            <Text style={[styles.successButtonText, { color: theme.colors.surface }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Edit Journal" showBack={true} showMenu={true} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading entry...</Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <AppHeader title="Edit Journal" showBack={true} showMenu={true} />
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            style={{ marginBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.createContainer}>
              <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Edit Journal Entry</Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                Update your thoughts and feelings
              </Text>

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
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Write your Entry *</Text>
                  <Text
                    style={[
                      styles.characterCount,
                      { color: theme.colors.textSecondary },
                      characterCount >= MAX_CHARACTERS && [
                        styles.characterCountMax,
                        { color: theme.colors.error }
                      ],
                    ]}
                  >
                    {characterCount}/{MAX_CHARACTERS}
                  </Text>
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
                          { 
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.colors.primary + '08'
                          }
                        ],
                      ]}
                      onPress={() => handleEmotionSelect(emotion)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                      <Text style={[
                        styles.emotionLabel,
                        { color: theme.colors.textSecondary },
                        journalData.emotion === emotion.id && [
                          styles.emotionLabelSelected,
                          { color: theme.colors.primary }
                        ]
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
                    <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                      Share with Support Worker
                    </Text>
                    <Text style={[styles.shareSubtext, { color: theme.colors.textSecondary }]}>
                      Your support worker will be able to view this entry
                    </Text>
                  </View>
                  <Switch
                    value={journalData.shareWithSupportWorker}
                    onValueChange={handleToggleShare}
                    trackColor={{
                      false: theme.colors.textDisabled,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      journalData.shareWithSupportWorker
                        ? theme.colors.primary
                        : theme.colors.surface
                    }
                  />
                </View>
              </View>
            </View>

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
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  { backgroundColor: theme.colors.primary },
                  saving && styles.disabledButton
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: theme.colors.surface }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
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
    fontSize: scaledFontSize(14), // Base size 14px
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
    height: 150,
    borderWidth: 1,
    textAlignVertical: 'top',
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: Spacing.md,
    color: "#666",
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