/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";

const { width } = Dimensions.get("window");

// Mock user data for demonstration purposes
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
};

const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

export default function GeneralMentalHealthAssessmentScreen() {
  // State management for UI components and assessment progress
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("assessment");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Comprehensive mental health assessment questions organized by domains
  const questions = [
    // Overall Well-being
    {
      id: 0,
      text: "Over the past 2 weeks, how would you rate your overall mental health?",
      shortText: "Overall mental health rating",
      domain: "Overall Well-being",
    },
    {
      id: 1,
      text: "Over the past 2 weeks, how often have you felt cheerful and in good spirits?",
      shortText: "Feeling cheerful and in good spirits",
      domain: "Overall Well-being",
    },
    {
      id: 2,
      text: "Over the past 2 weeks, how often have you felt calm and relaxed?",
      shortText: "Feeling calm and relaxed",
      domain: "Overall Well-being",
    },

    // Mood & Emotions
    {
      id: 3,
      text: "Over the past 2 weeks, how often have you felt sad or down?",
      shortText: "Feeling sad or down",
      domain: "Mood & Emotions",
    },
    {
      id: 4,
      text: "Over the past 2 weeks, how often have you felt hopeless about the future?",
      shortText: "Feeling hopeless about the future",
      domain: "Mood & Emotions",
    },
    {
      id: 5,
      text: "Over the past 2 weeks, how often have you experienced mood swings?",
      shortText: "Experiencing mood swings",
      domain: "Mood & Emotions",
    },
    {
      id: 6,
      text: "Over the past 2 weeks, how often have you felt emotionally overwhelmed?",
      shortText: "Feeling emotionally overwhelmed",
      domain: "Mood & Emotions",
    },

    // Anxiety & Stress
    {
      id: 7,
      text: "Over the past 2 weeks, how often have you felt nervous, anxious, or on edge?",
      shortText: "Feeling nervous, anxious, or on edge",
      domain: "Anxiety & Stress",
    },
    {
      id: 8,
      text: "Over the past 2 weeks, how often have you felt stressed or under pressure?",
      shortText: "Feeling stressed or under pressure",
      domain: "Anxiety & Stress",
    },
    {
      id: 9,
      text: "Over the past 2 weeks, how often have you had trouble relaxing?",
      shortText: "Having trouble relaxing",
      domain: "Anxiety & Stress",
    },

    // Sleep & Energy
    {
      id: 10,
      text: "Over the past 2 weeks, how often have you had trouble falling or staying asleep?",
      shortText: "Having trouble with sleep",
      domain: "Sleep & Energy",
    },
    {
      id: 11,
      text: "Over the past 2 weeks, how often have you felt tired or had little energy?",
      shortText: "Feeling tired or lacking energy",
      domain: "Sleep & Energy",
    },
    {
      id: 12,
      text: "Over the past 2 weeks, how often has your sleep been restful and refreshing?",
      shortText: "Sleep being restful and refreshing",
      domain: "Sleep & Energy",
    },

    // Concentration & Daily Functioning
    {
      id: 13,
      text: "Over the past 2 weeks, how often have you had trouble concentrating on things?",
      shortText: "Having trouble concentrating",
      domain: "Concentration & Daily Functioning",
    },
    {
      id: 14,
      text: "Over the past 2 weeks, how often have you felt productive and accomplished tasks well?",
      shortText: "Feeling productive and accomplishing tasks",
      domain: "Concentration & Daily Functioning",
    },
    {
      id: 15,
      text: "Over the past 2 weeks, how often have daily activities felt overwhelming?",
      shortText: "Daily activities feeling overwhelming",
      domain: "Concentration & Daily Functioning",
    },

    // Social & Relationships
    {
      id: 16,
      text: "Over the past 2 weeks, how often have you felt connected to friends and family?",
      shortText: "Feeling connected to friends and family",
      domain: "Social & Relationships",
    },
    {
      id: 17,
      text: "Over the past 2 weeks, how often have you withdrawn from social activities?",
      shortText: "Withdrawing from social activities",
      domain: "Social & Relationships",
    },

    // Coping & Self-care
    {
      id: 18,
      text: "Over the past 2 weeks, how often have you been taking good care of yourself?",
      shortText: "Taking good care of yourself",
      domain: "Coping & Self-care",
    },
    {
      id: 19,
      text: "Over the past 2 weeks, how often have you been able to cope with daily challenges?",
      shortText: "Coping with daily challenges",
      domain: "Coping & Self-care",
    },
  ];

  // Answer options with numerical values for scoring
  const answerOptions = [
    { value: 0, label: "Never" },
    { value: 1, label: "Rarely" },
    { value: 2, label: "Sometimes" },
    { value: 3, label: "Often" },
    { value: 4, label: "Always" },
  ];

  // Handle navigation between tabs
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Record user's answer for the current question
  const handleAnswerSelect = (value: number) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  // Navigate to the next question or complete assessment
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Complete the assessment
      setIsCompleted(true);
    }
  };

  // Navigate back to the previous question
  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Reset the assessment to start from the beginning
  const handleStartOver = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setIsCompleted(false);
  };

  // Navigate to assessment selection screen
  const handleTakeAnotherAssessment = () => {
    router.replace("../assessment/selection");
  };

  // Side menu navigation options
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        setSideMenuVisible(false);
        router.replace("/(app)/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/profile");
      },
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/self-assessment");
      },
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/mood-tracking");
      },
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/journal");
      },
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/resources");
      },
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/crisis-support");
      },
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/appointments");
      },
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/community-forum");
      },
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/video-consultations");
      },
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: async () => {
        setSideMenuVisible(false);
        // For demo purposes, just navigate to home instead of actual logout
        router.replace("/(app)/(tabs)/home");
      },
    },
  ];

  // Get display name from profile or user data
  const getDisplayName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    if (mockUser?.email) return mockUser.email.split("@")[0];
    return "User";
  };

  // Show loading indicator while processing
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // Render completion screen when assessment is finished
  if (isCompleted) {
    return (
      <CurvedBackground>
        <SafeAreaView style={styles.container}>
          <AppHeader title="General-Assessment" showBack={true} />

          {/* Completion Content */}
          <View style={styles.completionContainer}>
            <Text style={styles.completionTitle}>
              Mental Health Assessment Completed!
            </Text>

            <View style={styles.completionIconContainer}>
              <View style={styles.completionIcon}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </View>
            </View>

            <Text style={styles.completionMessage}>
              Your comprehensive mental health assessment has been completed.
              Your therapist will review the results before your appointment.
            </Text>

            <TouchableOpacity
              style={styles.anotherAssessmentButton}
              onPress={handleTakeAnotherAssessment}
            >
              <Text style={styles.anotherAssessmentText}>
                Take another assessment
              </Text>
            </TouchableOpacity>
          </View>

          {/* Side Menu Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={sideMenuVisible}
            onRequestClose={() => setSideMenuVisible(false)}
          >
            <View style={styles.modalContainer}>
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setSideMenuVisible(false)}
              />
              <View style={styles.sideMenu}>
                <View style={styles.sideMenuHeader}>
                  <Text style={styles.profileName}>{getDisplayName()}</Text>
                  <Text style={styles.profileEmail}>{mockUser?.email}</Text>
                </View>
                <ScrollView style={styles.sideMenuContent}>
                  {sideMenuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.sideMenuItem}
                      onPress={item.onPress}
                    >
                      <Ionicons
                        name={item.icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color="#4CAF50"
                      />
                      <Text style={styles.sideMenuItemText}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

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

  // Main assessment screen with questions and navigation
  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="General-Assessment" showBack={true} />

        {/* Scrollable content area for questions */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      ((currentQuestion + 1) / questions.length) * 100
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentQuestion + 1} of {questions.length}
            </Text>
          </View>

          {/* Question Header */}
          <View style={styles.questionHeader}>
            <View style={styles.questionNumberContainer}>
              <Text style={styles.questionNumber}>
                Question {currentQuestion + 1}
              </Text>
              <Text style={styles.domainText}>
                {questions[currentQuestion]?.domain}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.startOverButton}
              onPress={handleStartOver}
            >
              <Text style={styles.startOverText}>Start Over</Text>
            </TouchableOpacity>
          </View>

          {/* Question Content */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {questions[currentQuestion]?.text}
            </Text>
          </View>

          {/* Answer Options */}
          <View style={styles.optionsContainer}>
            {answerOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  answers[currentQuestion] === option.value &&
                    styles.selectedOption,
                ]}
                onPress={() => handleAnswerSelect(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    answers[currentQuestion] === option.value &&
                      styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={handleBack}
            disabled={currentQuestion === 0}
          >
            <Text
              style={[
                styles.navButtonText,
                currentQuestion === 0 && styles.disabledText,
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              answers[currentQuestion] === undefined && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={answers[currentQuestion] === undefined}
          >
            <Text
              style={[
                styles.navButtonText,
                styles.nextButtonText,
                answers[currentQuestion] === undefined && styles.disabledText,
              ]}
            >
              {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Side Menu Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={sideMenuVisible}
          onRequestClose={() => setSideMenuVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setSideMenuVisible(false)}
            />
            <View style={styles.sideMenu}>
              <View style={styles.sideMenuHeader}>
                <Text style={styles.profileName}>{getDisplayName()}</Text>
                <Text style={styles.profileEmail}>{mockUser?.email}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sideMenuItem}
                    onPress={item.onPress}
                  >
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.sideMenuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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

// Styles remain unchanged from the original implementation
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#545353ff",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  questionNumberContainer: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  domainText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
    marginTop: 2,
  },
  startOverButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startOverText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  questionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: "transparent",
    marginTop: 1,
    marginBottom: 1,
  },
  questionText: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    textAlign: "left",
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 5,
    marginTop: 1
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "transparent",
    marginBottom: 120,
  },
  navButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  backButton: {
    backgroundColor: "#9E9E9E",
  },
  nextButton: {
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#000000 ",
  },
  nextButtonText: {
    color: "#FFFFFF",
  },
  disabledText: {
    color: "#9E9E9E",
  },
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "transparent",
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 40,
    textAlign: "center",
  },
  completionIconContainer: {
    marginBottom: 40,
  },
  completionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  checkmarkBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  completionMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  anotherAssessmentButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  anotherAssessmentText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
});
