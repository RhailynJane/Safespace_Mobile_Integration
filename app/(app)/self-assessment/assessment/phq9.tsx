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
import CurvedBackground from "../../../../components/CurvedBackground";
import BottomNavigation from "../../../../components/BottomNavigation";
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
    gap: 15,
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
    color: "#FFFFFF",
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
    backgroundColor: "#F3E5F5",
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

export default function PHQ9QuestionnaireScreen() {
  // Using mock data instead of AuthContext
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

  // PHQ-9 assessment questions
  const questions = [
    {
      id: 0,
      text: "Over the past 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
      shortText: "Little interest or pleasure in doing things",
    },
    {
      id: 1,
      text: "Over the past 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
      shortText: "Feeling down, depressed, or hopeless",
    },
    {
      id: 2,
      text: "Over the past 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
      shortText: "Trouble falling or staying asleep, or sleeping too much",
    },
    {
      id: 3,
      text: "Over the past 2 weeks, how often have you been bothered by feeling tired or having little energy?",
      shortText: "Feeling tired or having little energy",
    },
    {
      id: 4,
      text: "Over the past 2 weeks, how often have you been bothered by poor appetite or overeating?",
      shortText: "Poor appetite or overeating",
    },
    {
      id: 5,
      text: "Over the past 2 weeks, how often have you been bothered by feeling bad about yourself – or that you are a failure or have let yourself or your family down?",
      shortText: "Feeling bad about yourself or that you are a failure",
    },
    {
      id: 6,
      text: "Over the past 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?",
      shortText: "Trouble concentrating on things",
    },
    {
      id: 7,
      text: "Over the past 2 weeks, how often have you been moving or speaking so slowly that other people could have noticed? Or the opposite – being so fidgety or restless that you have been moving around a lot more than usual?",
      shortText: "Moving or speaking slowly, or being fidgety or restless",
    },
    {
      id: 8,
      text: "Over the past 2 weeks, how often have you been bothered by thoughts that you would be better off dead or of hurting yourself in some way?",
      shortText:
        "Thoughts that you would be better off dead or of hurting yourself",
    },
  ];

  // Answer options for PHQ-9 questions
  const answerOptions = [
    { value: 0, label: "Not At All" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" },
  ];

  // Handle tab navigation
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Handle answer selection for current question
  const handleAnswerSelect = (value: number) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  // Navigate to next question or complete assessment
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Complete the assessment
      setIsCompleted(true);
    }
  };

  // Navigate to previous question
  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Reset the assessment to start over
  const handleStartOver = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setIsCompleted(false);
  };

  // Navigate to assessment selection screen
  const handleTakeAnotherAssessment = () => {
    router.push("../assessment/selection");
  };

  // Side menu navigation items
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
  ];

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="PHQ-9 Assessment" showBack={true} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            ) : isCompleted ? (
              <View style={styles.completionContainer}>
                <Text style={styles.completionTitle}>Assessment Complete</Text>
                <Text style={styles.completionMessage}>
                  Thank you, {user.displayName}. Your responses have been
                  recorded.
                </Text>
                <TouchableOpacity
                  style={styles.anotherAssessmentButton}
                  onPress={handleTakeAnotherAssessment}
                >
                  <Text style={styles.anotherAssessmentText}>
                    Take Another Assessment
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
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

                <View style={styles.questionContainer}>
                  <Text style={styles.questionText}>
                    {questions[currentQuestion]?.text ?? ""}
                  </Text>
                </View>

                <View style={styles.optionsContainer}>
                  {answerOptions.map((opt) => {
                    const selected = answers[currentQuestion] === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.optionButton,
                          selected ? styles.selectedOption : {},
                        ]}
                        onPress={() => handleAnswerSelect(opt.value)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected ? styles.selectedOptionText : {},
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.navigationContainer}>
                  <TouchableOpacity
                    style={[styles.navButton, styles.backButton]}
                    onPress={handleBack}
                    disabled={currentQuestion === 0}
                  >
                    <Text style={styles.navButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      styles.nextButton,
                      answers[currentQuestion] === undefined
                        ? styles.disabledButton
                        : {},
                    ]}
                    onPress={handleNext}
                    disabled={answers[currentQuestion] === undefined}
                  >
                    <Text style={styles.navButtonText}>
                      {currentQuestion === questions.length - 1
                        ? "Complete"
                        : "Next"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        <Modal visible={sideMenuVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setSideMenuVisible(false)}
            />
            <View style={styles.sideMenu}>
              <View style={styles.sideMenuHeader}>
                <Text style={styles.profileName}>
                  {profile.firstName} {profile.lastName}
                </Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.sideMenuItem}
                    onPress={item.onPress}
                  >
                    <Ionicons name={item.icon as any} size={20} color="#333" />
                    <Text style={styles.sideMenuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </CurvedBackground>
  );
}
