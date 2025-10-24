/**
 * LLM Prompt: Add concise comments to this React Native component.
 * Reference: chat.deepseek.com
 */
import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";

/**
 * AppointmentList Component
 *
 * Screen that displays a list of user's appointments, categorized as:
 * - Upcoming appointments (future scheduled sessions)
 * - Past appointments (completed sessions)
 * Allows users to view appointment details and schedule new appointments.
 * Features an elegant curved background and intuitive interface.
 */
export default function AppointmentList() {
  const { theme, scaledFontSize } = useTheme();
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeAppointmentsTab, setActiveAppointmentsTab] = useState<
    "upcoming" | "past"
  >("upcoming");

  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Bottom navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Show status modal with given parameters
   */
  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModalType(type);
    setStatusModalTitle(title);
    setStatusModalMessage(message);
    setStatusModalVisible(true);
  };

  /**
   * Handles bottom tab navigation
   * @param tabId - ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Enhanced logout function with Clerk integration
   */
  const handleLogout = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      setSideMenuVisible(false);

      await AsyncStorage.clear();
      if (signOut) {
        await signOut();
      }

      router.replace("/(auth)/login");
    } catch (error) {
      showStatusModal('error', 'Logout Failed', 'Unable to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * Confirmation dialog for sign out
   */
  const confirmSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => { handleLogout(); } },
    ]);
  };

  // Side menu navigation items
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
        router.push("/journal");
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
      onPress: confirmSignOut,
      disabled: isSigningOut,
    },
  ];

  /**
   * Gets display name from available user data
   * @returns String with user's display name or fallback
   */
  const getDisplayName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.split("@")[0];
    }
    return "User";
  };

  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email available"
    );
  };

  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      supportWorker: "Eric Young",
      date: "October 07, 2025",
      time: "10:30 AM",
      type: "Video",
      status: "upcoming",
    },
    {
      id: 2,
      supportWorker: "Michael Chen",
      date: "September 15, 2025",
      time: "2:00 PM",
      type: "Phone",
      status: "past",
    },
  ];

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </CurvedBackground>
    );
  }

  /**
   * Handles navigation to appointment details screen
   * @param appointmentId - ID of the selected appointment
   */
  const handleAppointmentPress = (appointmentId: number) => {
    router.push(
      `/(app)/(tabs)/appointments/${appointmentId}/appointment-detail`
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="My Appointments" showBack={true} />

        {/* Appointments Tabs - Switch between Upcoming and Past appointments */}
        <View style={styles.appointmentsTabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeAppointmentsTab === "upcoming" && styles.activeTab,
            ]}
            onPress={() => setActiveAppointmentsTab("upcoming")}
          >
            <Text
              style={[
                styles.tabText,
                activeAppointmentsTab === "upcoming" && styles.activeTabText,
              ]}
            >
              Upcoming (
              {appointments.filter((a) => a.status === "upcoming").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeAppointmentsTab === "past" && styles.activeTab,
            ]}
            onPress={() => setActiveAppointmentsTab("past")}
          >
            <Text
              style={[
                styles.tabText,
                activeAppointmentsTab === "past" && styles.activeTabText,
              ]}
            >
              Past ({appointments.filter((a) => a.status === "past").length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appointments List */}
        <ScrollView style={styles.appointmentsContainer}>
          {activeAppointmentsTab === "upcoming" ? (
            appointments.filter((a) => a.status === "upcoming").length > 0 ? (
              appointments
                .filter((a) => a.status === "upcoming")
                .map((appointment) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={[styles.appointmentCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]}
                    onPress={() => handleAppointmentPress(appointment.id)}
                  >
                    <Text style={[styles.supportWorker, { color: theme.colors.text }]}>
                      {appointment.supportWorker}
                    </Text>
                    <View style={styles.appointmentDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                    color={theme.colors.icon}
                        />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          {appointment.date}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                          <Ionicons name="time-outline" size={16} color={theme.colors.icon} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          {appointment.time}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.sessionType}>
                        <Ionicons name="videocam" size={14} color={theme.colors.primary} />
                      <Text style={[styles.sessionTypeText, { color: theme.colors.textSecondary }]}>
                        {appointment.type} Session
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
            ) : (
              <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={theme.colors.iconDisabled} />
                <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
                  No upcoming appointments
                </Text>
              </View>
            )
          ) : appointments.filter((a) => a.status === "past").length > 0 ? (
            appointments
              .filter((a) => a.status === "past")
              .map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={[styles.appointmentCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]}
                  onPress={() => handleAppointmentPress(appointment.id)}
                >
                  <Text style={[styles.supportWorker, { color: theme.colors.text }]}>
                    {appointment.supportWorker}
                  </Text>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                  color={theme.colors.icon}
                      />
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{appointment.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.icon} />
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{appointment.time}</Text>
                    </View>
                  </View>
                  <View style={styles.sessionType}>
                      <Ionicons name="videocam" size={14} color={theme.colors.primary} />
                    <Text style={[styles.sessionTypeText, { color: theme.colors.textSecondary }]}>
                      {appointment.type} Session
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
          ) : (
            <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={theme.colors.iconDisabled} />
              <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No past appointments</Text>
            </View>
          )}
        </ScrollView>

        {/* Schedule New Appointment Button */}
        <View style={styles.footer}>
          <TouchableOpacity
              style={[styles.scheduleButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push("/appointments/book")}
          >
              <Ionicons name="add" size={24} color={theme.colors.text} />
            <Text style={styles.scheduleButtonText}>
              Schedule New Appointment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Side Menu Modal */}
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
            <View style={[styles.sideMenu, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.sideMenuHeader, { borderBottomColor: theme.colors.borderLight }]}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>{getDisplayName()}</Text>
                <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>{getUserEmail()}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sideMenuItem,
                      { borderBottomColor: theme.colors.borderLight },
                      item.disabled && styles.sideMenuItemDisabled,
                    ]}
                    onPress={item.onPress}
                    disabled={item.disabled}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                 color={item.disabled ? theme.colors.iconDisabled : (item.title === "Sign Out" ? theme.colors.error : theme.colors.icon)}
                    />
                    <Text
                      style={[
                        styles.sideMenuItemText,
                        { color: theme.colors.text },
                        item.disabled && styles.sideMenuItemTextDisabled,
                        item.title === "Sign Out" && { color: theme.colors.error },
                      ]}
                    >
                      {item.title}
                      {item.title === "Sign Out" && isSigningOut && "..."}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Status Modal */}
        <StatusModal
          visible={statusModalVisible}
          type={statusModalType}
          title={statusModalTitle}
          message={statusModalMessage}
          onClose={() => setStatusModalVisible(false)}
        />

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

const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flex: 1,
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
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    color: "#2E7D32",
  },
  title: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
    marginTop: 16,
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
    // backgroundColor moved to theme.colors.surface via inline override
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    // borderBottomColor moved to theme.colors.borderLight via inline override
    alignItems: "center",
  },
  profileName: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    // color moved to theme.colors.text via inline override
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: scaledFontSize(14),
    // color moved to theme.colors.textSecondary via inline override
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
    // borderBottomColor moved to theme.colors.borderLight via inline override
  },
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    // color moved to theme.colors.text via inline override
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: scaledFontSize(16),
    color: "#333",
  },
  appointmentsTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: scaledFontSize(16),
    color: "#666",
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  appointmentsContainer: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    // backgroundColor moved to theme.colors.surface via inline override
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    // borderLeftColor moved to theme.colors.primary via inline override
  },
  supportWorker: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    // color moved to theme.colors.text via inline override
    marginBottom: 12,
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: scaledFontSize(14),
    // color moved to theme.colors.textSecondary via inline override
    marginLeft: 8,
  },
  sessionType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#cfe2f3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  sessionTypeText: {
    fontSize: scaledFontSize(14),
    // color moved to theme.colors.textSecondary via inline override
    marginLeft: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: scaledFontSize(16),
    // color moved to theme.colors.text via inline override
    marginTop: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  scheduleButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 30,
    marginRight: 25,
    marginLeft: 25,
  },
  scheduleButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    marginLeft: 8,
  },
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemTextDisabled: {
    // color handled by iconDisabled in inline override
  },
  signOutText: {
    // color handled by theme.colors.error in inline override
    fontWeight: "600",
  },
});