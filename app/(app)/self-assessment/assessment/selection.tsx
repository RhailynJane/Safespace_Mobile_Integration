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

export default function AssessmentSelectionScreen() {
  // Using mock data instead of AuthContext
  const user = mockUser;
  const profile = mockProfile;

  // State management for UI components
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("assessment");

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Available assessment types with their details
  const assessmentTypes = [
    {
      id: "depression-phq9",
      title: "Depression Screening (PHQ-9)",
      description: "Helps identify symptoms of depression",
      duration: "Duration: 5-7 minutes",
      icon: "sad-outline",
      backgroundColor: "#F3E5F5",
      iconColor: "#9C27B0",
    },
    {
      id: "anxiety-gad7",
      title: "Anxiety Screening (GAD-7)",
      description: "Helps identify symptoms of anxiety",
      duration: "Duration: 3-5 minutes",
      icon: "alert-circle-outline",
      backgroundColor: "#FFF3E0",
      iconColor: "#FF9800",
    },
    {
      id: "general-mental-health",
      title: "General Mental Health",
      description: "Comprehensive Mental health assessment",
      duration: "Duration: 10-15 minutes",
      icon: "checkmark-circle-outline",
      backgroundColor: "#E8F5E8",
      iconColor: "#4CAF50",
    },
    {
      id: "stress-assessment",
      title: "Stress Assessment",
      description: "Evaluate current stress levels and sources",
      duration: "Duration: 5-8 minutes",
      icon: "warning-outline",
      backgroundColor: "#FFEBEE",
      iconColor: "#F44336",
    },
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

  // Navigate to the selected assessment type
  const handleAssessmentType = (assessmentId: string) => {
    // Navigate to the specific assessment questionnaire
    if (assessmentId === "depression-phq9") {
      router.push("../assessment/phq9");
    } else if (assessmentId === "anxiety-gad7") {
      router.push("../assessment/gad7");
    } else if (assessmentId === "general-mental-health") {
      router.push("../assessment/general-mental-health");
    } else if (assessmentId === "stress-assessment") {
      router.push("../assessment/stress-test");
    } else {
      // For other assessments, navigate to a generic placeholder for now
      router.push(`../assessment/questionnaire/${assessmentId}`);
    }
  };


  // Get display name from profile or user data
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

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Self-Assessment" showBack={true} />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Purpose Section */}
          <View style={styles.purposeSection}>
            <Text style={styles.purposeTitle}>
              Purpose: Pre-Appointment Assessment
            </Text>
            <Text style={styles.purposeDescription}>
              This assessment will help your provider better understand your
              current state before your appointment
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsText}>
              Please select an assessment to help evaluate your current mental
              health status
            </Text>
          </View>

          {/* Assessment Types */}
          <View style={styles.assessmentTypesContainer}>
            {assessmentTypes.map((assessment) => (
              <TouchableOpacity
                key={assessment.id}
                style={[
                  styles.assessmentCard,
                  { backgroundColor: assessment.backgroundColor },
                ]}
                onPress={() => handleAssessmentType(assessment.id)}
              >
                <View style={styles.assessmentIconContainer}>
                  <Ionicons
                    name={assessment.icon as any}
                    size={24}
                    color={assessment.iconColor}
                  />
                </View>
                <View style={styles.assessmentContent}>
                  <Text style={styles.assessmentTitle}>{assessment.title}</Text>
                  <Text style={styles.assessmentDescription}>
                    {assessment.description}
                  </Text>
                  <Text style={styles.assessmentDuration}>
                    {assessment.duration}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
  purposeSection: {
    backgroundColor: "transparent",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  purposeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  purposeDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  instructionsSection: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  instructionsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  assessmentTypesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
    paddingBottom: 100,
  },
  assessmentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  assessmentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assessmentContent: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  assessmentDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 5,
  },
  assessmentDuration: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
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
