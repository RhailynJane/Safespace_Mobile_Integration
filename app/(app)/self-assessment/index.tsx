/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useMemo } from "react";
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
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../contexts/ThemeContext";
import { useBottomNavTabs } from "../../../utils/hooks/useBottomNavTabs";
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
  const { theme, scaledFontSize } = useTheme();
  // Store responses for all questions (question id -> selected value)
  const [responses, setResponses] = useState<{ [key: number]: number }>({});
  const [activeTab, setActiveTab] = useState("assessment");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { user } = useUser();
  const submitAssessment = useMutation(api.assessments.submitAssessment);

  // Live Convex queries for summary (due status, latest assessment, stats)
  const dueStatus = useQuery(
    user?.id ? api.assessments.isAssessmentDue : (undefined as any),
    user?.id ? { userId: user.id } : ("skip" as any)
  ) as { isDue: boolean; daysUntilDue: number } | undefined;
  const latest = useQuery(
    user?.id ? api.assessments.getLatestAssessment : (undefined as any),
    user?.id ? { userId: user.id } : ("skip" as any)
  ) as any | null | undefined;
  const stats = useQuery(
    user?.id ? api.assessments.getAssessmentStats : (undefined as any),
    user?.id ? { userId: user.id } : ("skip" as any)
  ) as { totalAssessments: number; averageScore: number | null; latestScore: number | null; trend: string | null } | undefined;
  const history = useQuery(
    user?.id ? api.assessments.getAssessmentHistory : (undefined as any),
    user?.id ? { userId: user.id, limit: 8 } : ("skip" as any)
  ) as any[] | undefined;

  /**
   * Create styles dynamically based on text size scaling
   * Uses useMemo for performance optimization
   */
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Bottom navigation configuration
  const tabs = useBottomNavTabs();

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
        const responseArray = surveyQuestions.map((q) => ({
          question: q.text,
          answer: responses[q.id]!,
        }));

        await submitAssessment({
          userId: user.id,
          assessmentType: 'SWEMWBS',
          responses: responseArray,
          totalScore,
        });
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
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <AppHeader title="Self Assessment" showBack={true} />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Summary Bar: Due status and latest stats */}
            {user?.id && (
              <View style={[styles.summaryBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
                <View style={styles.summaryItem}>
                  <Ionicons name={dueStatus?.isDue ? "alert-circle" : "checkmark-circle"} size={18} color={dueStatus?.isDue ? '#FFA000' : theme.colors.primary} />
                  <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                    {dueStatus ? (dueStatus.isDue ? 'Assessment due' : `Due in ${dueStatus.daysUntilDue}d`) : 'Checking due status...'}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Ionicons name="speedometer" size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                    {stats?.latestScore != null ? `Last score: ${stats.latestScore}/35` : 'No assessments yet'}
                  </Text>
                </View>
                {stats?.averageScore != null && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Ionicons name="analytics" size={18} color={theme.colors.textSecondary} />
                      <Text style={[styles.summaryText, { color: theme.colors.text }]}>Avg: {stats.averageScore}</Text>
                    </View>
                  </>
                )}
                {stats?.trend && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Ionicons
                        name={stats.trend === 'improving' ? 'trending-up' : stats.trend === 'declining' ? 'trending-down' : 'remove'}
                        size={18}
                        color={stats.trend === 'improving' ? '#2E7D32' : stats.trend === 'declining' ? '#C62828' : theme.colors.textSecondary}
                      />
                      <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                        {stats.trend === 'improving' ? 'Improving' : stats.trend === 'declining' ? 'Declining' : 'Stable'}
                      </Text>
                    </View>
                  </>
                )}
                <TouchableOpacity onPress={() => router.push('/(app)/self-assessment/history')}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>View History</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>
              Short Warwick-Edinburgh Mental Wellbeing Scale
            </Text>
            <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>
              Please rate how you&apos;ve been feeling over the last 2 weeks.
            </Text>

            {/* Survey Questions */}
            <View style={styles.questionsContainer}>
              {/* History sparkline & list (if past assessments) */}
              {history && history.length > 0 && (
                <View style={[styles.historyContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
                  <Text style={[styles.historyTitle, { color: theme.colors.text }]}>Your Recent Scores</Text>
                  <View style={styles.sparklineRow}>
                    {history.slice().reverse().map((h) => {
                      const score = (h.totalScore as number) ?? 0;
                      const normalized = Math.min(1, Math.max(0, (score - 7) / 28));
                      const height = 16 + Math.round(normalized * 20);
                      const bg = stats?.trend === 'declining'
                        ? `rgba(198,40,40,${0.3 + normalized * 0.5})`
                        : stats?.trend === 'improving'
                          ? `rgba(46,125,50,${0.3 + normalized * 0.5})`
                          : `rgba(30,136,229,${0.3 + normalized * 0.5})`;
                      return (
                        <View key={h.id} style={[styles.sparkBox, { height, backgroundColor: bg }]} />
                      );
                    })}
                  </View>
                  {history.slice(0,5).map((h) => (
                    <View key={h.id} style={styles.historyItem}> 
                      <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.historyText, { color: theme.colors.textSecondary }]}>
                        {h.completedAt}: {h.totalScore}/35
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {surveyQuestions.map((question, index) => (
                <View 
                  key={question.id} 
                  style={[
                    styles.questionBlock, 
                    { 
                      backgroundColor: theme.colors.surface,
                      shadowColor: theme.isDark ? "#000" : "#000",
                    }
                  ]}
                >
                  <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>
                    Question {index + 1}
                  </Text>
                  <Text style={[styles.questionText, { color: theme.colors.text }]}>
                    {question.text}
                  </Text>

                  {/* Response Options */}
                  <View style={styles.optionsContainer}>
                    {responseOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionButton,
                          { backgroundColor: theme.colors.borderLight },
                          responses[question.id] === option.value && [
                            styles.optionButtonSelected,
                            { 
                              backgroundColor: theme.isDark ? '#1B5E20' : '#E8F5E9',
                              borderColor: theme.colors.primary 
                            }
                          ],
                        ]}
                        onPress={() =>
                          handleResponse(question.id, option.value)
                        }
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            { borderColor: theme.colors.textDisabled },
                            responses[question.id] === option.value && [
                              styles.radioCircleSelected,
                              { borderColor: theme.colors.primary }
                            ],
                          ]}
                        >
                          {responses[question.id] === option.value && (
                            <View 
                              style={[
                                styles.radioInner, 
                                { backgroundColor: theme.colors.primary }
                              ]} 
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: theme.colors.textSecondary },
                            responses[question.id] === option.value && [
                              styles.optionLabelSelected,
                              { color: theme.colors.text }
                            ],
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
                !isComplete() && [
                  styles.submitButtonDisabled,
                  { backgroundColor: theme.colors.textDisabled }
                ],
              ]}
              onPress={handleSubmit}
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

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <BlurView intensity={80} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.successIconContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Survey Submitted Successfully!
              </Text>

              <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
                Your assessment has been completed and will be
                reviewed by your assigned support worker. You can
                expect to hear from them soon.
              </Text>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
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

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

/**
 * Stylesheet for PreSurveyScreen component
 * Now includes dynamic font scaling via scaledFontSize parameter
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
  // Summary bar styles
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  summaryText: {
    fontSize: scaledFontSize(13),
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E0E0E0',
  },
  subtitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  instructions: {
    fontSize: scaledFontSize(14),
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  questionsContainer: {
    gap: 25,
  },
  historyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 10,
  },
  historyTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: '600',
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 4,
  },
  sparkBox: {
    width: 12,
    height: 20,
    borderRadius: 3,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyText: {
    fontSize: scaledFontSize(12),
  },
  questionBlock: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  questionNumber: {
    fontSize: scaledFontSize(12),
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: scaledFontSize(16),
    fontWeight: "500",
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
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionButtonSelected: {
    borderColor: "#4CAF50",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
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
  },
  optionLabel: {
    fontSize: scaledFontSize(14),
    textAlign: "center",
    lineHeight: 18,
  },
  optionLabelSelected: {
    fontWeight: "500",
  },
  submitButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomPadding: {
    height: 140,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
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
    fontSize: scaledFontSize(20),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: scaledFontSize(15),
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: "#FFFFFF",
  },
});