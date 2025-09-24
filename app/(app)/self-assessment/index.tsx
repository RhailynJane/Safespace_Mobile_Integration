/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState } from "react";
import {
  View,
  Text,
  Image,
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
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";

const { width } = Dimensions.get("window");

export default function AssessmentScreen() {
  // State for managing side menu visibility
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  // State for loading indicator (not currently used but kept for structure)
  const [loading, setLoading] = useState(false);
  // State to track active tab in bottom navigation
  const [activeTab, setActiveTab] = useState("assessment");

  // Mock user data to replace backend implementation
  const mockUser = {
    displayName: "Demo User",
    email: "demo@gmail.com",
  };

  const mockProfile = {
    firstName: "Demo",
    lastName: "User",
  };

  // Configuration for bottom navigation tabs
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Handler for tab press in bottom navigation
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Assessment options data with styling and metadata
  const assessmentOptions = [
    {
      id: "before-appointment",
      title: "Before Appointment",
      description: "Complete assessment before meeting with your provider",
      icon: "calendar-outline",
      backgroundColor: "#E8F5E8",
      iconColor: "#4CAF50",
    },
    {
      id: "provider-requested",
      title: "Provider Requested",
      description: "Your healthcare provider asked you to complete this",
      icon: "person-outline",
      backgroundColor: "#E3F2FD",
      iconColor: "#2196F3",
    },
    {
      id: "personal-check-in",
      title: "Personal Check-in",
      description: "Monitor your mental health progress",
      icon: "heart-outline",
      backgroundColor: "#FCE4EC",
      iconColor: "#E91E63",
    },
  ];

  // Handler for when user selects an assessment option
  const handleAssessmentOption = (optionId: string) => {
    // All assessment options navigate to the same assessment selection screen
    router.push("../self-assessment/assessment/selection");
  };

  // Helper function to get display name from user data
  const getDisplayName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    if (mockUser?.email) return mockUser.email.split("@")[0];
    return "User";
  };

  // Loading state UI (not currently triggered but kept for structure)
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

        {/* Main scrollable content area */}
        <View style={styles.content}>
          <Text style={styles.questionText}>
            Why are you taking this assessment?
          </Text>
        </View>

        {/* Assessment options selection cards */}
        <View style={styles.optionsContainer}>
          {assessmentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                { backgroundColor: option.backgroundColor },
              ]}
              onPress={() => handleAssessmentOption(option.id)}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={option.iconColor}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom navigation component */}
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
    backgroundColor: "transparent",
  },
  questionText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    lineHeight: 28,
    marginTop: 50,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 15,
    marginBottom: 250,
  },
  optionCard: {
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
  optionIconContainer: {
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
    marginTop: 10
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
