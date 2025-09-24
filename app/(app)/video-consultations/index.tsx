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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";

const { width } = Dimensions.get("window");

// Mock user data
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
};

const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

/**
 * VideoScreen Component
 *
 * A screen that displays video consultation details and technical requirements.
 * Users can view their upcoming appointments and join video meetings.
 * Features a beautiful curved background and comprehensive navigation.
 */
export default function VideoScreen() {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("video");

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Handles navigation tab presses
   * @param tabId - The ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Mock appointment data for demonstration
  const appointments = [
    {
      id: 1,
      supportWorker: "Eric Young",
      date: "October 07, 2025",
      time: "10:30 AM",
      type: "Video",
      status: "Upcoming",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
  ];

  /**
   * Handles joining a video meeting
   * Navigates to the video call screen
   */
  const handleJoinMeeting = () => {
    router.push("/video-consultations/video-call");
  };

  /**
   * Gets the display name for the user
   * @returns The user's display name or a fallback
   */
  const getDisplayName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    if (mockUser?.email) return mockUser.email.split("@")[0];
    return "User";
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CurvedBackground>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        </CurvedBackground>
      </SafeAreaView>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Video Session" showBack={true} />

        {/* Main Content */}
        <ScrollView style={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.appointmentCard}>
              {/* Support Worker Profile */}
              <View style={styles.profileContainer}>
                <Image
                  source={{ uri: appointments[0]?.avatar }}
                  style={styles.avatar}
                />
                <View style={styles.nameContainer}>
                  <Text style={styles.name}>
                    {appointments[0]?.supportWorker ?? ""}
                  </Text>
                  <Text style={styles.date}>{appointments[0]?.date ?? ""}</Text>
                  <Text style={styles.time}>{appointments[0]?.time ?? ""}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    appointments[0]?.status === "Upcoming"
                      ? styles.upcomingBadge
                      : appointments[0]?.status === "Completed"
                      ? styles.completedBadge
                      : styles.canceledBadge,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {appointments[0]?.status ?? ""}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Technical Requirements Section */}
              <Text style={styles.sectionTitle}>Technical Requirements</Text>

              <Text style={styles.subsectionTitle}>System Requirements</Text>
              <View style={styles.requirementItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.requirementText}>
                  Stable internet connection (min 1 Mbps)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.requirementText}>
                  Speakers or headphones
                </Text>
              </View>

              <Text style={styles.subsectionTitle}>Privacy & Security</Text>
              <View style={styles.requirementItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.requirementText}>
                  End to end encrypted video calls
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.requirementText}>
                  HIPAA/PIPEDA compliant platform
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.requirementText}>
                  No recordings without consent
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.requirementText}>
                  Secure data transmission
                </Text>
              </View>

              {/* Join Meeting Button (only for upcoming appointments) */}
              {appointments[0] && appointments[0].status === "Upcoming" && (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={handleJoinMeeting}
                >
                  <Ionicons name="videocam" size={20} color="#FFFFFF" />
                  <Text style={styles.joinButtonText}>Join Meeting</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
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
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
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
  menuProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
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
  scrollContent: {
    flex: 1,
  },
  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: width - 40,
    marginVertical: 20,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212121",
  },
  date: {
    fontSize: 13,
    color: "#757575",
  },
  time: {
    fontSize: 13,
    color: "#757575",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  upcomingBadge: {
    backgroundColor: "#FFECB3",
  },
  completedBadge: {
    backgroundColor: "#C8E6C9",
  },
  canceledBadge: {
    backgroundColor: "#FFCDD2",
  },
  statusText: {
    fontWeight: "600",
    fontSize: 14,
  },
  joinButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  nameContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginTop: 16,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginTop: 8,
    marginRight: 12,
  },
  requirementText: {
    fontSize: 16,
    color: "#424242",
    flex: 1,
    lineHeight: 24,
  },
});
