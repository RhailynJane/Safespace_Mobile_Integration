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
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";

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
    router.push("/assessment/selection");
  };

  // Side menu navigation items with icons and actions
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
        // Mock sign out functionality
        console.log("User signed out");
      },
    },
  ];

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
    <SafeAreaView style={styles.container}>
      {/* Curved background component for visual enhancement */}
      <CurvedBackground />
      
      {/* Header section with navigation controls */}
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

      {/* Main scrollable content area */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Illustration section with custom graphics */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationPlaceholder}>
            <View style={styles.cloudShape}>
              <Ionicons name="heart" size={30} color="#4CAF50" />
              <Ionicons name="add-circle" size={20} color="#2196F3" />
              <Ionicons name="heart" size={15} color="#4CAF50" />
            </View>
            <View style={styles.personIllustration}>
              <View style={styles.personHead} />
              <View style={styles.personBody}>
                <View style={styles.heartInHands}>
                  <Ionicons name="heart" size={25} color="#FFFFFF" />
                  <Ionicons name="add" size={15} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
          
          <Text style={styles.questionText}>Why are you taking this assessment?</Text>
        </View>

        {/* Assessment options selection cards */}
        <View style={styles.optionsContainer}>
          {assessmentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, { backgroundColor: option.backgroundColor }]}
              onPress={() => handleAssessmentOption(option.id)}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name={option.icon as any} size={24} color={option.iconColor} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Side menu modal for additional navigation options */}
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
                  <Ionicons name={item.icon as any} size={20} color="#4CAF50" />
                  <Text style={styles.sideMenuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom navigation component */}
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
  illustrationContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  cloudShape: {
    position: "absolute",
    top: 20,
    right: 30,
    width: 80,
    height: 50,
    backgroundColor: "#E3F2FD",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  personIllustration: {
    alignItems: "center",
  },
  personHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFCDD2",
    marginBottom: 10,
  },
  personBody: {
    width: 60,
    height: 80,
    backgroundColor: "#4CAF50",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  heartInHands: {
    width: 40,
    height: 35,
    backgroundColor: "#2196F3",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  questionText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    lineHeight: 28,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 15,
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