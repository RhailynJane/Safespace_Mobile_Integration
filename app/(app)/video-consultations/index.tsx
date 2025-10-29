/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */

import { useState, useMemo } from "react";
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
import { useTheme } from "../../../contexts/ThemeContext";

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
  const { theme, scaledFontSize } = useTheme();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("video");

  /**
   * Create styles dynamically based on text size scaling
   * Uses useMemo for performance optimization
   */
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CurvedBackground>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </CurvedBackground>
      </SafeAreaView>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <AppHeader title="Video Consultations" showBack={true} />

        {/* Main Content */}
        <ScrollView style={styles.scrollContent}>
          <View style={styles.content}>
            <View style={[styles.appointmentCard, { backgroundColor: theme.colors.surface }]}>
              {/* Support Worker Profile */}
              <View style={styles.profileContainer}>
                <Image
                  source={{ uri: appointments[0]?.avatar }}
                  style={styles.avatar}
                />
                <View style={styles.nameContainer}>
                  <Text style={[styles.name, { color: theme.colors.text }]}>
                    {appointments[0]?.supportWorker ?? ""}
                  </Text>
                  <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                    {appointments[0]?.date ?? ""}
                  </Text>
                  <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
                    {appointments[0]?.time ?? ""}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    appointments[0]?.status === "Upcoming"
                      ? [styles.upcomingBadge, { backgroundColor: theme.isDark ? '#FFB74D' : '#FFECB3' }]
                      : appointments[0]?.status === "Completed"
                      ? [styles.completedBadge, { backgroundColor: theme.isDark ? '#388E3C' : '#C8E6C9' }]
                      : [styles.canceledBadge, { backgroundColor: theme.isDark ? '#D32F2F' : '#FFCDD2' }],
                  ]}
                >
                  <Text style={[
                    styles.statusText, 
                    { 
                      color: appointments[0]?.status === "Upcoming" 
                        ? theme.isDark ? '#FFF' : '#5D4037'
                        : appointments[0]?.status === "Completed"
                        ? theme.isDark ? '#FFF' : '#1B5E20'
                        : theme.isDark ? '#FFF' : '#C62828'
                    }
                  ]}>
                    {appointments[0]?.status ?? ""}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              {/* Technical Requirements Section */}
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                Technical Requirements
              </Text>

              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                System Requirements
              </Text>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  Stable internet connection (min 1 Mbps)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  Speakers or headphones
                </Text>
              </View>

              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                Privacy & Security
              </Text>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  End to end encrypted video calls
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  HIPAA/PIPEDA compliant platform
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  No recordings without consent
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  Secure data transmission
                </Text>
              </View>

              {/* Join Meeting Button (only for upcoming appointments) */}
              {appointments[0] && appointments[0].status === "Upcoming" && (
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: theme.colors.primary }]}
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

/**
 * Stylesheet for VideoScreen component
 * Now includes dynamic font scaling via scaledFontSize parameter
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
    zIndex: 10,
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: scaledFontSize(22),
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: scaledFontSize(16),
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
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  menuProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: scaledFontSize(14),
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
  },
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    marginLeft: 15,
  },
  scrollContent: {
    flex: 1,
  },
  appointmentCard: {
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
    fontSize: scaledFontSize(15),
    fontWeight: "600",
  },
  date: {
    fontSize: scaledFontSize(13),
  },
  time: {
    fontSize: scaledFontSize(13),
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  upcomingBadge: {
    // backgroundColor applied via inline style
  },
  completedBadge: {
    // backgroundColor applied via inline style
  },
  canceledBadge: {
    // backgroundColor applied via inline style
  },
  statusText: {
    fontWeight: "600",
    fontSize: scaledFontSize(14),
  },
  joinButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
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
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
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
    marginTop: 8,
    marginRight: 12,
  },
  requirementText: {
    fontSize: scaledFontSize(16),
    flex: 1,
    lineHeight: 24,
  },
});