/**
 * LLM Prompt: Add concise comments to this React Native component.
 * Reference: chat.deepseek.com
 */
import { useState, useMemo, useEffect } from "react";
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

interface Appointment {
  id: number;
  supportWorker: string;
  supportWorkerId: number;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  meetingLink?: string;
  notes?: string;
  specialization?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AppointmentList() {
  const { theme, scaledFontSize } = useTheme();
  
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeAppointmentsTab, setActiveAppointmentsTab] = useState<"upcoming" | "past">("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut } = useAuth();
  const { user } = useUser();

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

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
   * Fetch appointments from API
   */
  const fetchAppointments = async () => {
    if (!user?.id) {
      console.log('No user ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📅 Fetching appointments for user:', user.id);
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/appointments?clerkUserId=${user.id}`);
      const result = await response.json();

      console.log('📅 Appointments API response:', result);

      if (result.success) {
        // Categorize appointments as upcoming or past based on date
        const now = new Date();
        const categorizedAppointments = result.appointments.map((apt: any) => {
          const appointmentDate = new Date(apt.date);
          const isUpcoming = appointmentDate >= now;
          
          return {
            id: apt.id,
            supportWorker: apt.supportWorker,
            supportWorkerId: apt.supportWorkerId,
            date: apt.date,
            time: apt.time,
            duration: apt.duration,
            type: apt.type,
            status: isUpcoming ? 'upcoming' : 'past',
            meetingLink: apt.meetingLink,
            notes: apt.notes,
            specialization: apt.specialization,
            avatarUrl: apt.avatarUrl,
            createdAt: apt.createdAt,
            updatedAt: apt.updatedAt,
          };
        });

        setAppointments(categorizedAppointments);
        console.log('✅ Loaded', categorizedAppointments.length, 'appointments');
      } else {
        console.log('❌ Failed to fetch appointments');
        showStatusModal('error', 'Error', 'Failed to load appointments');
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      showStatusModal('error', 'Error', 'Unable to fetch appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointments on mount
  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    }
  }, [user?.id]);

  /**
   * Format date string to readable format
   */
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Format time string to readable format
   */
  const formatTime = (timeString: string) => {
    try {
      // If already in format like "10:30 AM", return as is
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }
      
      // Otherwise parse and format
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  /**
   * Get icon name for session type
   */
  const getSessionIcon = (type: string): "videocam" | "call" | "person" | "calendar" => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('video')) return 'videocam';
    if (lowerType.includes('phone')) return 'call';
    if (lowerType.includes('person')) return 'person';
    return 'calendar';
  };

  // Bottom navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

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
      { text: "Sign Out", style: "destructive", onPress: handleLogout },
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
        router.push("/(app)/(tabs)/community-forum");
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

  /**
   * Handles navigation to appointment details screen
   * @param appointmentId - ID of the selected appointment
   */
  const handleAppointmentPress = (appointmentId: number) => {
    router.push(
      `/(app)/(tabs)/appointments/${appointmentId}/appointment-detail`
    );
  };

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading appointments...
        </Text>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="My Appointments" showBack={true} />

        {/* Appointments Tabs - Switch between Upcoming and Past appointments */}
        <View style={[styles.appointmentsTabs, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeAppointmentsTab === "upcoming" && [
                styles.activeTab,
                { borderBottomColor: theme.colors.primary }
              ],
            ]}
            onPress={() => setActiveAppointmentsTab("upcoming")}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeAppointmentsTab === "upcoming" && [
                  styles.activeTabText,
                  { color: theme.colors.primary }
                ],
              ]}
            >
              Upcoming ({appointments.filter((a) => a.status === "upcoming").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeAppointmentsTab === "past" && [
                styles.activeTab,
                { borderBottomColor: theme.colors.primary }
              ],
            ]}
            onPress={() => setActiveAppointmentsTab("past")}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeAppointmentsTab === "past" && [
                  styles.activeTabText,
                  { color: theme.colors.primary }
                ],
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
                          {formatDate(appointment.date)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.icon} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          {formatTime(appointment.time)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.sessionType, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Ionicons name={getSessionIcon(appointment.type)} size={14} color={theme.colors.primary} />
                      <Text style={[styles.sessionTypeText, { color: theme.colors.primary }]}>
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
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  Schedule your first appointment with a support worker
                </Text>
                <TouchableOpacity
                  style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => router.push("/appointments/book")}
                >
                  <Text style={styles.emptyStateButtonText}>Book Appointment</Text>
                </TouchableOpacity>
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
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{formatDate(appointment.date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.icon} />
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{formatTime(appointment.time)}</Text>
                    </View>
                  </View>
                  <View style={[styles.sessionType, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name={getSessionIcon(appointment.type)} size={14} color={theme.colors.primary} />
                    <Text style={[styles.sessionTypeText, { color: theme.colors.primary }]}>
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
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.scheduleButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push("/appointments/book")}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
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
  loadingText: {
    fontSize: scaledFontSize(16),
    marginTop: 16,
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
  },
  title: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
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
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: "center",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  appointmentsTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: scaledFontSize(16),
  },
  activeTabText: {
    fontWeight: "600",
  },
  appointmentsContainer: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  supportWorker: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
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
    marginLeft: 8,
  },
  sessionType: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  sessionTypeText: {
    fontSize: scaledFontSize(14),
    marginLeft: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: scaledFontSize(16),
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: scaledFontSize(14),
    marginTop: 8,
    textAlign: "center",
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(14),
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  scheduleButton: {
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
    // Color handled in JSX
  },
  signOutText: {
    fontWeight: "600",
  },
});