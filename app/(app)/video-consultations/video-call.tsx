/**
 * LLM Prompt: Add concise inline comments to this React Native component.
 */
import React, { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { useTheme } from "../../../contexts/ThemeContext";
import { useConvexVideoSession } from "../../../utils/hooks/useConvexVideoSession";

const { width } = Dimensions.get("window");

export default function VideoCallScreen() {
  // Params passed from appointment-detail
  const params = useLocalSearchParams();
  const supportWorkerName = (params.supportWorkerName as string) || "Support Worker";
  const appointmentId = (params.appointmentId as string) || "";
  const date = (params.date as string) || "";
  const time = (params.time as string) || "";
  const meetingLink = (params.meetingLink as string) || "";

  const { theme, scaledFontSize } = useTheme();

  // Local UI state
  const [audioOption, setAudioOption] = useState<"phone" | "none">("phone");
  const [activeTab, setActiveTab] = useState<string>("home");
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Video session tracking hook
  const { startSession, sessionId } = useConvexVideoSession(null);

  // Styles with dynamic text scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Use Clerk user for display name instead of demo
  const { user } = useUser();
  
  // Get Convex profile for profile image
  const convexProfile = useQuery(
    api.profiles.getFullProfile as any,
    user?.id ? { clerkId: user.id } : (undefined as any)
  ) as any;
  const getDisplayName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
    if (email) return email.split("@")[0];
    return "User";
  };

  // Start meeting: navigate to the in-call screen, forward context
  const handleStartMeeting = async () => {
    // Check if appointment is too early or in the future
    const joinCheck = canJoinMeeting(date, time);
    if (joinCheck === 'too-early') {
      Alert.alert('Too Early', 'You can only join the meeting starting 1 hour before the scheduled time.');
      return;
    }
    if (joinCheck === 'too-late') {
      setConfirmVisible(true);
      return;
    }
    await pushToMeeting();
  };

  const pushToMeeting = async () => {
    // Start session tracking in Convex
    const sessionArgs: any = {
      supportWorkerName,
      supportWorkerId: undefined,
      audioOption,
    };
    
    // Only include appointmentId if it's actually defined and not the string "undefined"
    if (appointmentId && appointmentId !== "undefined") {
      sessionArgs.appointmentId = appointmentId;
    }
    
    const newSessionId = await startSession(sessionArgs);

    router.push({
      pathname: "/(app)/video-consultations/video-call-meeting",
      params: { 
        supportWorkerName, 
        appointmentId: appointmentId || '', 
        audioOption, 
        meetingLink: meetingLink || '', 
        date: date || '', 
        time: time || '',
        sessionId: newSessionId || '', // Pass session ID to meeting screen
      },
    });
  };

  // Determine if user can join the meeting
  // Returns: 'allowed' | 'too-early' (>60 min before) | 'too-late' (significantly past, needs confirmation)
  const canJoinMeeting = (dateStr?: string, timeStr?: string): 'allowed' | 'too-early' | 'too-late' => {
    if (!dateStr || !timeStr) return 'allowed'; // No restrictions if date/time missing
    
    try {
      // Parse appointment date/time
      const aptDateTime = new Date(`${dateStr}T${timeStr}`);
      if (isNaN(aptDateTime.getTime())) return 'allowed'; // Invalid format, allow
      
      const now = new Date();
      const minutesUntilAppointment = (aptDateTime.getTime() - now.getTime()) / (1000 * 60);
      
      // Too early: more than 60 minutes before scheduled time
      if (minutesUntilAppointment > 60) return 'too-early';
      
      // Too late: more than 60 minutes after scheduled time (show confirmation)
      if (minutesUntilAppointment < -60) return 'too-late';
      
      // Within acceptable range: 60 minutes before to 60 minutes after
      return 'allowed';
    } catch {
      return 'allowed'; // On error, allow joining
    }
  };

  // Bottom navigation tabs config (UI only)
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

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Safespace Meeting" showBack={true} />

        {/* Main meeting content */}
        <View style={styles.meetingContent}>
          <Text style={[styles.meetingWith, { color: theme.colors.textSecondary }]}>
            Meeting with {supportWorkerName}
          </Text>

          {/* Avatar + user name */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {(convexProfile?.profileImageUrl || user?.imageUrl) ? (
                <Image source={{ uri: convexProfile?.profileImageUrl || user?.imageUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={50} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={[styles.avatarName, { color: theme.colors.text }]}>
                {getDisplayName()}
              </Text>
              {(date || time) && (
                <Text style={[styles.avatarStatus, { color: theme.colors.textSecondary }]}>
                  {date} {time}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Audio Options */}
        <View style={styles.audioOptions}>
          <Text style={[styles.audioTitle, { color: theme.colors.text }]}>Audio Options</Text>

          {/* Phone Audio */}
          <TouchableOpacity
            style={[
              styles.audioOption,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight },
              audioOption === "phone" && [
                styles.audioOptionSelected,
                { borderColor: theme.colors.primary, backgroundColor: theme.isDark ? "rgba(76, 175, 80, 0.2)" : "#F1F8E9" },
              ],
            ]}
            onPress={() => setAudioOption("phone")}
            accessibilityRole="button"
          >
            <Ionicons
              name={audioOption === "phone" ? "radio-button-on" : "radio-button-off"}
              size={24}
              color={audioOption === "phone" ? theme.colors.primary : theme.colors.icon}
            />
            <View style={styles.audioOptionText}>
              <Text style={[styles.audioOptionTitle, { color: theme.colors.text }]}>Phone Audio</Text>
              <Text style={[styles.audioOptionDesc, { color: theme.colors.textSecondary }]}>Call in with your phone</Text>
            </View>
          </TouchableOpacity>

          {/* No Audio */}
          <TouchableOpacity
            style={[
              styles.audioOption,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight },
              audioOption === "none" && [
                styles.audioOptionSelected,
                { borderColor: theme.colors.primary, backgroundColor: theme.isDark ? "rgba(76, 175, 80, 0.2)" : "#F1F8E9" },
              ],
            ]}
            onPress={() => setAudioOption("none")}
            accessibilityRole="button"
          >
            <Ionicons
              name={audioOption === "none" ? "radio-button-on" : "radio-button-off"}
              size={24}
              color={audioOption === "none" ? theme.colors.primary : theme.colors.icon}
            />
            <View style={styles.audioOptionText}>
              <Text style={[styles.audioOptionTitle, { color: theme.colors.text }]}>Don&apos;t Use Audio</Text>
              <Text style={[styles.audioOptionDesc, { color: theme.colors.textSecondary }]}>Join without audio</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Actions */}
  <View style={styles.meetingActions}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.colors.borderLight, backgroundColor: theme.colors.surface }]}
            onPress={() => router.replace("/(app)/video-consultations")}
            accessibilityRole="button"
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.joinNowButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleStartMeeting}
            accessibilityRole="button"
          >
            <Text style={styles.joinNowButtonText}>Join Now</Text>
          </TouchableOpacity>
        </View>

        {/* Join confirmation for future appointments */}
        <Modal
          visible={confirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }] }>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Join early?</Text>
              <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
                The meeting is scheduled for {date} at {time}. Your support worker will join at the scheduled time.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: theme.colors.borderLight, backgroundColor: theme.colors.surface }]}
                  onPress={() => { setConfirmVisible(false); router.back(); }}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Join later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalPrimaryButton, { backgroundColor: theme.colors.primary }]}
                  onPress={async () => { setConfirmVisible(false); await pushToMeeting(); }}
                >
                  <Text style={styles.modalPrimaryText}>Join now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bottom Nav (UI only) */}
        <BottomNavigation tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Styles
const createStyles = (scaledFontSize: (size: number) => number) =>
  StyleSheet.create({
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
      fontSize: scaledFontSize(18),
      fontWeight: "600",
      color: "#2E7D32",
    },
    meetingContent: {
      flex: 1,
      padding: 20,
      alignItems: "center",
    },
    meetingWith: {
      fontSize: scaledFontSize(16),
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
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarName: {
      fontSize: scaledFontSize(18),
      fontWeight: "600",
      marginBottom: 5,
    },
    avatarStatus: {
      fontSize: scaledFontSize(14),
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
      fontSize: scaledFontSize(14),
      fontWeight: "600",
      marginBottom: 15,
    },
    audioOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 15,
    },
    audioOptionSelected: {},
    audioOptionText: {
      marginLeft: 15,
      flex: 1,
    },
    audioOptionTitle: {
      fontSize: scaledFontSize(13),
      fontWeight: "600",
      marginBottom: 4,
    },
    audioOptionDesc: {
      fontSize: scaledFontSize(10),
    },
    meetingActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: "rgba(224,224,224,0.5)",
      marginBottom: 140, // increase space above bottom nav
      paddingHorizontal: 20,
      width: "100%",
      maxWidth: 360,
      marginLeft: (width - Math.min(width, 360)) / 2,
    },
    cancelButton: {
      flex: 1,
      padding: 16,
      borderWidth: 1,
      borderRadius: 20,
      alignItems: "center",
      marginRight: 10,
    },
    cancelButtonText: {
      fontSize: scaledFontSize(13),
      fontWeight: "600",
    },
    joinNowButton: {
      flex: 1,
      padding: 15,
      borderRadius: 20,
      alignItems: "center",
      marginLeft: 10,
    },
    joinNowButtonText: {
      color: "#FFFFFF",
      fontSize: scaledFontSize(13),
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 12,
      padding: 16,
    },
    modalTitle: {
      fontSize: scaledFontSize(18),
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: scaledFontSize(14),
      textAlign: 'center',
      marginBottom: 16,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: scaledFontSize(14),
      fontWeight: '600',
    },
    modalPrimaryButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalPrimaryText: {
      color: '#fff',
      fontSize: scaledFontSize(14),
      fontWeight: '700',
    },
  });
