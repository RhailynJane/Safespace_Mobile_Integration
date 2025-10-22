/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { useTheme } from "../../../contexts/ThemeContext";

const { width } = Dimensions.get("window");


/* Mock user/profile data for frontend development and UI testing */
const mockUser = {
  displayName: "Demo User",
  email: "demo@gmail.com",
};

const mockProfile = {
  firstName: "Demo",
  lastName: "User",
};

/* Sample appointment data (static/mock) */
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
 * VideoCallScreen
 * - Uses CurvedBackground for an elegant background.
 * - No backend or auth dependencies — uses mock data.
 * - Contains selectable audio options and actions to join/cancel the meeting.
 */
export default function VideoCallScreen() {
  const { theme } = useTheme();
  // Local UI state for audio selection
  const [audioOption, setAudioOption] = useState<"phone" | "none">("phone");

  // Active bottom navigation tab
  const [activeTab, setActiveTab] = useState<string>("home");

  // Use the mock data instead of auth/context
  const user = mockUser;
  const profile = mockProfile;

  // Helper: produce a friendly display name from available mock data
  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  // Handler: start meeting - navigates to the meeting route
  const handleStartMeeting = () => {
    // Replace navigation with your meeting screen path as needed
    router.replace("../video-consultations/video-call-meeting");
  };

  const currentAppointment = appointments[0];

  // Bottom navigation tabs configuration (UI only)
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Handler for tab presses
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  return (
   <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Safespace Meeting" showBack={true} />

        {/* Main meeting content */}
        <View style={styles.meetingContent}>
          <Text style={styles.meetingWith}>
            Meeting with {currentAppointment?.supportWorker ?? ""}
          </Text>

          {/* Avatar + user name */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {/* Simple icon avatar — replace with Image component if you want to show actual avatar */}
              <Ionicons name="person" size={50} color="#FFFFFF" />
            </View>

            <View style={styles.profileTextContainer}>
              <Text style={styles.avatarName}>{getDisplayName()}</Text>
            </View>
          </View>
        </View>

        {/* Audio Options (UI only) */}
        <View style={styles.audioOptions}>
          <Text style={styles.audioTitle}>Audio Options</Text>

          {/* Phone Audio Option */}
          <TouchableOpacity
            style={[
              styles.audioOption,
              audioOption === "phone" && styles.audioOptionSelected,
            ]}
            onPress={() => setAudioOption("phone")}
            accessibilityRole="button"
          >
            <Ionicons
              name={audioOption === "phone" ? "radio-button-on" : "radio-button-off"}
              size={24}
              color={audioOption === "phone" ? "#4CAF50" : "#757575"}
            />
            <View style={styles.audioOptionText}>
              <Text style={styles.audioOptionTitle}>Phone Audio</Text>
              <Text style={styles.audioOptionDesc}>Call in with your phone</Text>
            </View>
          </TouchableOpacity>

          {/* Join Without Audio Option */}
          <TouchableOpacity
            style={[
              styles.audioOption,
              audioOption === "none" && styles.audioOptionSelected,
            ]}
            onPress={() => setAudioOption("none")}
            accessibilityRole="button"
          >
            <Ionicons
              name={audioOption === "none" ? "radio-button-on" : "radio-button-off"}
              size={24}
              color={audioOption === "none" ? "#4CAF50" : "#757575"}
            />
            <View style={styles.audioOptionText}>
              <Text style={styles.audioOptionTitle}>Don&apos;t Use Audio</Text>
              <Text style={styles.audioOptionDesc}>Join without audio</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.meetingActions}>
          {/* Cancel simply navigates back */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {/* Join Now triggers navigation to the meeting flow */}
          <TouchableOpacity
            style={styles.joinNowButton}
            onPress={handleStartMeeting}
            accessibilityRole="button"
          >
            <Text style={styles.joinNowButtonText}>Join Now</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom navigation (UI only) */}
        <BottomNavigation tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    </CurvedBackground>
  );
}

/* Styles for the VideoCallScreen */
const styles = StyleSheet.create({
  // container added to match usage in JSX (SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]})
  container: {
    flex: 1,
    backgroundColor: "transparent", 
    justifyContent: "space-between",
  },
  meetingContainer: {
    flex: 1,
    backgroundColor: "transparent", 
    justifyContent: "space-between",
  },
  meetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224,224,224,0.5)",
  },
  backButton: {
    padding: 4,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
  },
  meetingContent: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  meetingWith: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 30,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 5,
  },
  avatarStatus: {
    fontSize: 14,
    color: "#757575",
  },
  profileTextContainer: {
    alignItems: "center",
  },
  audioOptions: {
    width: "100%",
    maxWidth: 360,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
    marginLeft: (width - Math.min(width, 360)) / 2,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 15,
  },
  audioOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "transparent",
  },
  audioOptionSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  audioOptionText: {
    marginLeft: 15,
    flex: 1,
  },
  audioOptionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  audioOptionDesc: {
    fontSize: 10,
    color: "#757575",
  },
  meetingActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(224,224,224,0.5)",
    marginBottom: 100,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 360,
    marginLeft: (width - Math.min(width, 360)) / 2,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    color: "#757575",
    fontSize: 13,
    fontWeight: "600",
  },
  joinNowButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    alignItems: "center",
    marginLeft: 10,
  },
  joinNowButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
