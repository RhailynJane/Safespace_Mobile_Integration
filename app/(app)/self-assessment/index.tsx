import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { BlurView } from "expo-blur";
import { assessmentTracker } from "../../../utils/assessmentTracker";
import { useUser } from "@clerk/clerk-expo";
const { width } = Dimensions.get("window");

// Survey questions based on Short Warwick-Edinburgh Mental Wellbeing Scale
const surveyQuestions = [
  { id: 1, text: "I've been feeling optimistic about the future." },
  { id: 2, text: "I've been feeling useful." },
  { id: 3, text: "I've been feeling relaxed." },
  { id: 4, text: "I've been dealing with problems well." },
  { id: 5, text: "I've been thinking clearly." },
  { id: 6, text: "I've been feeling close to other people." },
  { id: 7, text: "I've been able to make up my own mind about things." },
];

// Response options for each question
const responseOptions = [
  { value: 1, label: "None of the time" },
  { value: 2, label: "Rarely" },
  { value: 3, label: "Some of the time" },
  { value: 4, label: "Often" },
  { value: 5, label: "All of the time" },
];

export default function PreSurveyScreen() {
  // Store responses for all questions (question id -> selected value)
  const [responses, setResponses] = useState<{ [key: number]: number }>({});
  const [activeTab, setActiveTab] = useState("assessment");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { user } = useUser();

  // Bottom navigation configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Handle selecting a response for a question
  const handleResponse = (questionId: number, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Check if all questions have been answered
  const isComplete = () => {
    return surveyQuestions.every((q) => responses[q.id] !== undefined);
  };

  // Calculate total score (7-35 range)
  const calculateScore = () => {
    return Object.values(responses).reduce((sum, val) => sum + val, 0);
  };

  // Handle survey submission
  const handleSubmit = async () => {
    if (!isComplete()) {
      Alert.alert(
        "Incomplete Survey",
        "Please answer all questions before submitting."
      );
      return;
    }

    const totalScore = calculateScore();
    console.log("Survey responses:", responses);
    console.log("Total score:", totalScore);

    try {
      if (user?.id) {
        await assessmentTracker.submitAssessment(
          user.id,
          responses,
          totalScore
        );
        setShowSuccessModal(true);
      } else {
        Alert.alert("Error", "User not found. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      Alert.alert(
        "Submission Error",
        "Failed to submit assessment. Please try again."
      );
    }
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Pre-Self Assessment Test" showBack={true} />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Short Warwick-Edinburgh Mental Wellbeing Scale
            </Text>
            <Text style={styles.instructions}>
              Please rate how you&apos;ve been feeling over the last 2 weeks.
            </Text>

            {/* Survey Questions */}
            <View style={styles.questionsContainer}>
              {surveyQuestions.map((question, index) => (
                <View key={question.id} style={styles.questionBlock}>
                  <Text style={styles.questionNumber}>
                    Question {index + 1}
                  </Text>
                  <Text style={styles.questionText}>{question.text}</Text>

                  {/* Response Options */}
                  <View style={styles.optionsContainer}>
                    {responseOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionButton,
                          responses[question.id] === option.value &&
                            styles.optionButtonSelected,
                        ]}
                        onPress={() =>
                          handleResponse(question.id, option.value)
                        }
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            responses[question.id] === option.value &&
                              styles.radioCircleSelected,
                          ]}
                        >
                          {responses[question.id] === option.value && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.optionLabel,
                            responses[question.id] === option.value &&
                              styles.optionLabelSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    {/* Success Modal */}
                    <Modal
                      visible={showSuccessModal}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={() => setShowSuccessModal(false)}
                    >
                      <BlurView intensity={80} style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                          <View style={styles.successIconContainer}>
                            <Ionicons
                              name="checkmark-circle"
                              size={64}
                              color="#4CAF50"
                            />
                          </View>

                          <Text style={styles.modalTitle}>
                            Survey Submitted Successfully!
                          </Text>

                          <Text style={styles.modalMessage}>
                            Your assessment has been completed and will be
                            reviewed by your assigned support worker. You can
                            expect to hear from them soon.
                          </Text>

                          <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                              setShowSuccessModal(false);
                              router.replace("/(app)/(tabs)/home");
                            }}
                          >
                            <Text style={styles.modalButtonText}>
                              Return to Home
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </BlurView>
                    </Modal>
                  </View>
                </View>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !isComplete() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isComplete()}
            >
              <Text style={styles.submitButtonText}>
                {isComplete()
                  ? "Submit Survey"
                  : `${Object.keys(responses).length}/${
                      surveyQuestions.length
                    } Answered`}
              </Text>
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>

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
  scrollContent: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  instructions: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  questionsContainer: {
    gap: 25,
  },
  questionBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 20,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionButtonSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: "#4CAF50",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  optionLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  optionLabelSelected: {
    color: "#333",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#BDBDBD",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
