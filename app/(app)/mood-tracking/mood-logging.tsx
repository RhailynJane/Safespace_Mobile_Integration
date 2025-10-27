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
  ActivityIndicator,
  Switch,
  Dimensions,
  StatusBar,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import BottomNavigation from "../../../components/BottomNavigation";
import { moodApi } from "../../../utils/moodApi";
import { useTheme } from "../../../contexts/ThemeContext";

const { width } = Dimensions.get("window");

// Character limit for notes
const NOTES_MAX_LENGTH = 200;

// Define mood types for type safety
type MoodType = "very-happy" | "happy" | "neutral" | "sad" | "very-sad";

// Configuration for different mood types with emojis and labels
const moodConfig = {
  "very-happy": { emoji: "😄", label: "Very Happy" },
  happy: { emoji: "🙂", label: "Happy" },
  neutral: { emoji: "😐", label: "Neutral" },
  sad: { emoji: "🙁", label: "Sad" },
  "very-sad": { emoji: "😢", label: "Very Sad" },
};

// Predefined list of mood factors for user selection
const moodFactors = [
  "Family",
  "Health Concerns",
  "Sleep Quality",
  "Social Interaction",
  "Financial Stress",
  "Physical Activity",
  "Work/School Stress",
  "Weather",
];

// Navigation tabs configuration
const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function MoodLoggingScreen() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { selectedMood } = useLocalSearchParams<{ selectedMood: MoodType }>();

  // State for mood data including type, intensity, factors, notes, and sharing
  const [moodData, setMoodData] = useState({
    type: selectedMood as MoodType,
    intensity: 3,
    factors: [] as string[],
    notes: "",
    shareWithSupportWorker: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("mood");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Handle intensity slider value change
  const handleIntensityChange = (value: number) => {
    setMoodData((prev) => ({ ...prev, intensity: value }));
  };

  // Toggle mood factors selection
  const handleFactorToggle = (factor: string) => {
    setMoodData((prev) => ({
      ...prev,
      factors: prev.factors.includes(factor)
        ? prev.factors.filter((f) => f !== factor)
        : [...prev.factors, factor],
    }));
  };

  // Handle notes text input change with character limit
  const handleNotesChange = (text: string) => {
    if (text.length <= NOTES_MAX_LENGTH) {
      setMoodData((prev) => ({ ...prev, notes: text }));
    }
  };

  // Toggle share with support worker
  const handleShareToggle = (value: boolean) => {
    setMoodData((prev) => ({ ...prev, shareWithSupportWorker: value }));
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.replace("../mood-tracking/mood-history");
  };

  // Handle form submission with API call
  const handleSubmit = async () => {
    if (!user?.id) {
      setErrorMessage("User not authenticated");
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create mood entry via API
      await moodApi.createMood({
        clerkUserId: user.id,
        moodType: moodData.type,
        intensity: moodData.intensity,
        notes: moodData.notes,
        factors: moodData.factors,
      });

      // Set success message based on sharing status
      if (moodData.shareWithSupportWorker) {
        setSuccessMessage("Mood logged and shared with your support worker");
      } else {
        setSuccessMessage("Your mood has been logged successfully");
      }
      
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to log mood. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render success modal
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
          {moodData.shareWithSupportWorker && (
            <View style={styles.sharedInfo}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text style={styles.sharedInfoText}>
                Your support worker has been notified
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.successButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSuccessClose}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>View Mood History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render error modal
  const renderErrorModal = () => (
    <Modal
      visible={showErrorModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowErrorModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.successModal, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.successIcon}>
            <Ionicons name="close-circle" size={64} color="#F44336" />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>Error</Text>
          <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>{errorMessage}</Text>
          <TouchableOpacity
            style={[styles.successButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowErrorModal(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Handle bottom navigation tab presses
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Calculate character count for notes
  const notesCharCount = moodData.notes.length;

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#FFFFFF"
            translucent={false}
          />
        </View>

        <AppHeader title="Log Your Mood" showBack={true} />

        {/* Main Content */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Mood display section showing selected mood */}
          <View style={[styles.moodDisplay, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? "#000" : "#000" }]}>
            <Text style={styles.moodEmoji}>
              {moodConfig[moodData.type].emoji}
            </Text>
            <Text style={[styles.moodLabel, { color: theme.colors.text }]}>
              {moodConfig[moodData.type].label}
            </Text>
          </View>

          {/* Intensity selection section with slider */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? "#000" : "#000" }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Intensity (1-5)</Text>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>1</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={moodData.intensity}
                onValueChange={handleIntensityChange}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.isDark ? "#444" : "#E0E0E0"}
                thumbTintColor={theme.colors.primary}
              />
              <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>5</Text>
            </View>
            <Text style={[styles.intensityValue, { color: theme.colors.primary }]}>
              Current: {moodData.intensity}
            </Text>
          </View>

          {/* Mood factors selection section */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? "#000" : "#000" }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              What&apos;s affecting your mood?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Select all that apply
            </Text>
            <View style={styles.factorsContainer}>
              {moodFactors.map((factor) => (
                <TouchableOpacity
                  key={factor}
                  style={[
                    styles.factorButton,
                    { backgroundColor: theme.isDark ? "#2A2A2A" : "#F5F5F5", borderColor: theme.colors.borderLight },
                    moodData.factors.includes(factor) &&
                      { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => handleFactorToggle(factor)}
                >
                  <Text
                    style={[
                      styles.factorText,
                      { color: theme.colors.textSecondary },
                      moodData.factors.includes(factor) &&
                        styles.selectedFactorText,
                    ]}
                  >
                    {factor}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes input section with character counter */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? "#000" : "#000" }]}>
            <View style={styles.notesHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notes (Optional)</Text>
              <Text
                style={[
                  styles.charCounter,
                  { color: theme.colors.textSecondary },
                  notesCharCount >= NOTES_MAX_LENGTH && styles.charCounterMax,
                ]}
              >
                {notesCharCount}/{NOTES_MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              style={[
                styles.notesInput,
                { 
                  backgroundColor: theme.isDark ? "#2A2A2A" : "#FFFFFF",
                  borderColor: theme.colors.borderLight,
                  color: theme.colors.text,
                }
              ]}
              placeholder="Add any notes about your mood..."
              placeholderTextColor={theme.colors.textSecondary}
              value={moodData.notes}
              onChangeText={handleNotesChange}
              multiline
              maxLength={NOTES_MAX_LENGTH}
            />
          </View>

          {/* Share with support worker toggle */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? "#000" : "#000" }]}>
            <View style={styles.shareContainer}>
              <View style={styles.shareTextContainer}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Share with Support Worker
                </Text>
                <Text style={[styles.shareSubtext, { color: theme.colors.textSecondary }]}>
                  Allow your support worker to view this mood entry
                </Text>
              </View>
              <Switch
                value={moodData.shareWithSupportWorker}
                onValueChange={handleShareToggle}
                trackColor={{ false: theme.isDark ? "#444" : "#E0E0E0", true: "#A5D6A7" }}
                thumbColor={
                  moodData.shareWithSupportWorker ? theme.colors.primary : theme.isDark ? "#666" : "#F5F5F5"
                }
                ios_backgroundColor={theme.isDark ? "#444" : "#E0E0E0"}
              />
            </View>
            {moodData.shareWithSupportWorker && (
              <View style={styles.shareNotice}>
                <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.shareNoticeText}>
                  Your support worker will be notified about this mood entry
                </Text>
              </View>
            )}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#FFF"
                  style={styles.submitIcon}
                />
                <Text style={styles.submitButtonText}>Save Mood Entry</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Success Modal */}
        {renderSuccessModal()}
        
        {/* Error Modal */}
        {renderErrorModal()}

        {/* Bottom navigation bar */}
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
    marginTop: -50,
    paddingTop: 50,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  moodDisplay: {
    alignItems: "center",
    marginVertical: 24,
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodEmoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  moodLabel: {
    fontSize: 22,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  intensityValue: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
  },
  factorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  factorButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  selectedFactorButton: {
    // Removed - using inline styles
  },
  factorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  selectedFactorText: {
    color: "#FFF",
    fontWeight: "600",
  },
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  charCounter: {
    fontSize: 13,
    fontWeight: "500",
  },
  charCounterMax: {
    color: "#F44336",
    fontWeight: "600",
  },
  notesInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 15,
  },
  shareContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shareTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  shareSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  shareNotice: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    gap: 8,
  },
  shareNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#2E7D32",
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModal: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  sharedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignSelf: "stretch",
  },
  sharedInfoText: {
    fontSize: 14,
    color: "#2E7D32",
    marginLeft: 8,
    flex: 1,
  },
  successButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: "stretch",
    alignItems: "center",
  },
  successButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});