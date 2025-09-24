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

// Mock user data for frontend-only implementation
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
};

const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

export default function StressQuestionnaireScreen() {
  // Using mock data instead of auth context
  const user = mockUser;
  const profile = mockProfile;

  // State management for UI components
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

  // Stress assessment questions based on the Perceived Stress Scale (PSS)
  const questions = [
    {
      id: 0,
      text: "In the last month, how often have you been upset because of something that happened unexpectedly?",
      shortText: "Upset because of something unexpected",
    },
    {
      id: 1,
      text: "In the last month, how often have you felt that you were unable to control the important things in your life?",
      shortText: "Unable to control important things",
    },
    {
      id: 2,
      text: "In the last month, how often have you felt nervous and stressed?",
      shortText: "Felt nervous and stressed",
    },
    {
      id: 3,
      text: "In the last month, how often have you felt confident about your ability to handle your personal problems?",
      shortText: "Confident about handling personal problems",
    },
    {
      id: 4,
      text: "In the last month, how often have you felt that things were going your way?",
      shortText: "Things were going your way",
    },
    {
      id: 5,
      text: "In the last month, how often have you found that you could not cope with all the things that you had to do?",
      shortText: "Could not cope with all the things to do",
    },
    {
      id: 6,
      text: "In the last month, how often have you been able to control irritations in your life?",
      shortText: "Able to control irritations",
    },
    {
      id: 7,
      text: "In the last month, how often have you felt that you were on top of things?",
      shortText: "Felt on top of things",
    },
    {
      id: 8,
      text: "In the last month, how often have you been angered because of things that were outside of your control?",
      shortText: "Angered by things outside your control",
    },
    {
      id: 9,
      text: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?",
      shortText: "Difficulties piling up too high to overcome",
    },
  ];

  // Response options for the stress assessment
  const answerOptions = [
    { value: 0, label: "Never" },
    { value: 1, label: "Almost Never" },
    { value: 2, label: "Sometimes" },
    { value: 3, label: "Fairly Often" },
    { value: 4, label: "Very Often" },
  ];

  // Handle tab navigation in the bottom navigation bar
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Record user's answer selection
  const handleAnswerSelect = (value: number) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  // Navigate to the next question or complete the assessment
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
    router.push("../assessment/selection");
  };

  // Get display name from user profile or email
  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
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

  // Show completion screen when assessment is finished
  if (isCompleted) {
    return (
      <CurvedBackground>
        <SafeAreaView style={styles.container}>
          <AppHeader title="Stress-Assessment" showBack={true} />

          {/* Completion Content */}
          <View style={styles.completionContainer}>
            <Text style={styles.completionTitle}>
              Self Assessment Completed!
            </Text>

            <View style={styles.completionIconContainer}>
              <View style={styles.completionIcon}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </View>
            </View>

            <Text style={styles.completionMessage}>
              Your therapist will review the result of your assessment!
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

          {/* Bottom Navigation Bar */}
          <BottomNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  // Main assessment screen with questions and answer options
  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Stress-Assessment" showBack={true} />

        {/* Scrollable content area for questions */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Question progress indicator and reset button */}
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>
              Question {currentQuestion + 1} of {questions.length}
            </Text>
            <TouchableOpacity
              style={styles.startOverButton}
              onPress={handleStartOver}
            >
              <Text style={styles.startOverText}>Start Over</Text>
            </TouchableOpacity>
          </View>

          {/* Current question display */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {questions[currentQuestion]?.text}
            </Text>
          </View>

          {/* Answer options for the current question */}
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

        {/* Navigation buttons for moving between questions */}
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

        {/* Bottom Navigation Bar */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
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
  questionNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
    color: "#000000",
  },
  nextButtonText: {
    color: "#FFFFFF",
  },
  disabledText: {
    color: "#000000",
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
    backgroundColor: "#FFEBEE",
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
