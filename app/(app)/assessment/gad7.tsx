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
import { useAuth } from "../../../context/AuthContext";
import BottomNavigation from "../../../components/BottomNavigation";

const { width } = Dimensions.get("window");

export default function GAD7QuestionnaireScreen() {
  const { user, profile, logout } = useAuth();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("assessment");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const questions = [
    {
      id: 0,
      text: "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious or on edge?",
      shortText: "Feeling nervous, anxious or on edge"
    },
    {
      id: 1,
      text: "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
      shortText: "Not being able to stop or control worrying"
    },
    {
      id: 2,
      text: "Over the last 2 weeks, how often have you been bothered by worrying too much about different things?",
      shortText: "Worrying too much about different things"
    },
    {
      id: 3,
      text: "Over the last 2 weeks, how often have you been bothered by trouble relaxing?",
      shortText: "Trouble relaxing"
    },
    {
      id: 4,
      text: "Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still?",
      shortText: "Being so restless that it is hard to sit still"
    },
    {
      id: 5,
      text: "Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?",
      shortText: "Becoming easily annoyed or irritable"
    },
    {
      id: 6,
      text: "Over the last 2 weeks, how often have you been bothered by feeling afraid as if something awful might happen?",
      shortText: "Feeling afraid as if something awful might happen"
    }
  ];

  const answerOptions = [
    { value: 0, label: "Not At All" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleAnswerSelect = (value: number) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Complete the assessment
      setIsCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setIsCompleted(false);
  };

  const handleTakeAnotherAssessment = () => {
    router.push("/assessment/selection");
  };

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
        router.push("/journaling");
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
        await logout();
      },
    },
  ];

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Self Assessment</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSideMenuVisible(true)}>
              <Ionicons name="grid-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Completion Content */}
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>Self Assessment Completed!</Text>
          
          <View style={styles.completionIconContainer}>
            <View style={styles.completionIcon}>
              <Ionicons name="person" size={40} color="#FF9800" />
              <View style={styles.checkmarkBadge}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <Text style={styles.completionMessage}>
            Your therapist will review the result of your assessment!
          </Text>

          <TouchableOpacity 
            style={styles.anotherAssessmentButton}
            onPress={handleTakeAnotherAssessment}
          >
            <Text style={styles.anotherAssessmentText}>Take another assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Side Menu */}
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
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sideMenuItem}
                    onPress={item.onPress}
                  >
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="#4CAF50" />
                    <Text style={styles.sideMenuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Self Assessment</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSideMenuVisible(true)}>
            <Ionicons name="grid-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Question {currentQuestion + 1} of {questions.length}</Text>
          <TouchableOpacity style={styles.startOverButton} onPress={handleStartOver}>
            <Text style={styles.startOverText}>Start Over</Text>
          </TouchableOpacity>
        </View>

        {/* Question Content */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{questions[currentQuestion]?.text}</Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {answerOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                answers[currentQuestion] === option.value && styles.selectedOption
              ]}
              onPress={() => handleAnswerSelect(option.value)}
            >
              <Text style={[
                styles.optionText,
                answers[currentQuestion] === option.value && styles.selectedOptionText
              ]}>
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
          <Text style={[styles.navButtonText, currentQuestion === 0 && styles.disabledText]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            answers[currentQuestion] === undefined && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={answers[currentQuestion] === undefined}
        >
          <Text style={[
            styles.navButtonText,
            styles.nextButtonText,
            answers[currentQuestion] === undefined && styles.disabledText
          ]}>
            {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Side Menu */}
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
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sideMenuItem}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="#4CAF50" />
                  <Text style={styles.sideMenuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  notificationButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF5722",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
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
    backgroundColor: "#F8F9FA",
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
    backgroundColor: "#FFF3E0",
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