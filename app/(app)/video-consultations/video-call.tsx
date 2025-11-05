/**
 * LLM Prompt: Add concise inline comments to this React Native component.
 */
import React, { useMemo, useState } from "react";
import {
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

import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { useTheme } from "../../../contexts/ThemeContext";

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

  // Styles with dynamic text scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Use Clerk user for display name instead of demo
  const { user } = useUser();
  const getDisplayName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
    if (email) return email.split("@")[0];
    return "User";
  };

  // Start meeting: navigate to the in-call screen, forward context
  const handleStartMeeting = () => {
    // If appointment is in the future (MST), show confirmation modal
    if (shouldConfirmFutureJoin(date, time)) {
      setConfirmVisible(true);
      return;
    }
    pushToMeeting();
  };

  const pushToMeeting = () => {
    router.push({
      pathname: "/(app)/video-consultations/video-call-meeting",
      params: { supportWorkerName, appointmentId, audioOption, meetingLink, date, time },
    });
  };

  // Determine if appointment time (date + time) is in the future relative to now in MST
  const shouldConfirmFutureJoin = (dateStr?: string, timeStr?: string) => {
    if (!dateStr || !timeStr) return false; // no guard if missing
    // Build MST now numeric
    const mst = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Denver",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const nowParts = mst.formatToParts(new Date());
    const nowYear = parseInt(nowParts.find(p => p.type === "year")?.value || "0");
    const nowMonth = parseInt(nowParts.find(p => p.type === "month")?.value || "0");
    const nowDay = parseInt(nowParts.find(p => p.type === "day")?.value || "0");
    const nowHour = parseInt(nowParts.find(p => p.type === "hour")?.value || "0");
    const nowMinute = parseInt(nowParts.find(p => p.type === "minute")?.value || "0");
    const nowNumeric = nowYear * 100000000 + nowMonth * 1000000 + nowDay * 10000 + nowHour * 100 + nowMinute;

    // Parse date string into Y/M/D (tolerate weekday prefix)
    const d = new Date(String(dateStr));
    if (isNaN(d.getTime())) return false; // if unparseable, don’t block
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-based
    const day = d.getDate();

    // Parse time string (supports HH:mm, HH:mm:ss, or 12h with AM/PM)
    const { h, m } = parseTime(timeStr);
    const aptNumeric = year * 100000000 + month * 1000000 + day * 10000 + h * 100 + m;
    return aptNumeric > nowNumeric;
  };

  const parseTime = (t: string) => {
    try {
      const s = t.trim();
      const ampm = /am|pm/i.test(s) ? s.match(/am|pm/i)![0].toLowerCase() : null;
      const timePart = s.replace(/am|pm/ig, "").trim();
      const parts = timePart.split(":");
      let hh = parseInt(parts[0] || "0", 10);
      const mm = parseInt(parts[1] || "0", 10);
      if (ampm) {
        if (ampm === "pm" && hh < 12) hh += 12;
        if (ampm === "am" && hh === 12) hh = 0;
      }
      return { h: hh, m: mm };
    } catch {
      return { h: 0, m: 0 };
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
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
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
            onPress={() => router.back()}
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
                  onPress={() => { setConfirmVisible(false); pushToMeeting(); }}
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