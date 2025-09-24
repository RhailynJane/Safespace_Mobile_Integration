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
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  StatusBar,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";

const { width } = Dimensions.get("window");

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
  // Mock user data for frontend demonstration
  const mockUser = {
    displayName: "Demo User",
    email: "demo@gmail.com",
  };

  const mockProfile = {
    firstName: "Demo",
    lastName: "User",
  };

  // Get selected mood from navigation parameters
  const { selectedMood } = useLocalSearchParams<{ selectedMood: MoodType }>();

  // State for mood data including type, intensity, factors, and notes
  const [moodData, setMoodData] = useState({
    type: selectedMood as MoodType,
    intensity: 3,
    factors: [] as string[],
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("mood");

  // Get display name from user profile for personalization
  const getDisplayName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    if (mockUser?.email) return mockUser.email.split("@")[0];
    return "User";
  };

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

  // Handle notes text input change
  const handleNotesChange = (text: string) => {
    setMoodData((prev) => ({ ...prev, notes: text }));
  };

  // Handle form submission with mock success response
  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call delay
    setTimeout(() => {
      Alert.alert("Mood Logged!", "Your mood has been saved successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("../mood-tracking/mood-history"),
        },
      ]);
      setIsSubmitting(false);
    }, 1000);
  };

  // Handle bottom navigation tab presses
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      {/* Elegant curved background with gradient colors - positioned absolutely */}
      <View style={styles.backgroundContainer}>
        <CurvedBackground />
      </View>

      <AppHeader title="Mood Tracker" showBack={true} />

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Mood display section showing selected mood */}
        <View style={styles.moodDisplay}>
          <Text style={styles.moodEmoji}>
            {moodConfig[moodData.type].emoji}
          </Text>
          <Text style={styles.moodLabel}>
            {moodConfig[moodData.type].label}
          </Text>
        </View>

        {/* Intensity selection section with slider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intensity (1-5)</Text>
          <View style={styles.sliderContainer}>
            <Text>1</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={moodData.intensity}
              onValueChange={handleIntensityChange}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#4CAF50"
            />
            <Text>5</Text>
          </View>
          <Text style={styles.intensityValue}>
            Current: {moodData.intensity}
          </Text>
        </View>

        {/* Mood factors selection section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Factors</Text>
          <View style={styles.factorsContainer}>
            {moodFactors.map((factor) => (
              <TouchableOpacity
                key={factor}
                style={[
                  styles.factorButton,
                  moodData.factors.includes(factor) &&
                    styles.selectedFactorButton,
                ]}
                onPress={() => handleFactorToggle(factor)}
              >
                <Text
                  style={[
                    styles.factorText,
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

        {/* Notes input section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about your mood..."
            value={moodData.notes}
            onChangeText={handleNotesChange}
            multiline
          />
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Save Mood Entry</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navButton}
            onPress={() => handleTabPress(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={activeTab === tab.id ? "#4CAF50" : "#666"}
            />
            <Text
              style={[
                styles.navButtonText,
                { color: activeTab === tab.id ? "#4CAF50" : "#666" },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -50,
    paddingTop: 50,
  },
  headerContainer: {
    marginTop: 0,
    paddingTop: 0,
  },
  tempHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  tempHeaderTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  moodDisplay: {
    alignItems: "center",
    marginVertical: 24,
  },
  moodEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  intensityValue: {
    textAlign: "center",
    marginTop: 8,
    color: "#666",
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
    backgroundColor: "#EEE",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  selectedFactorButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  factorText: {
    color: "#333",
  },
  selectedFactorText: {
    color: "#FFF",
  },
  notesInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sideMenu: {
    width: "75%",
    backgroundColor: "#FFFFFF",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#757575",
  },
  sideMenuContent: {
    padding: 10,
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sideMenuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  navButton: {
    alignItems: "center",
    padding: 8,
  },
  navButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
});
