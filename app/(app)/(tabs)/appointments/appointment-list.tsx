/**
 * DARK MODE COMPATIBLE VERSION - With Mock Data
 */
import { useState, useMemo, useEffect, useCallback } from "react";
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

interface Appointment {
  id: number;
  supportWorker: string;
  date: string;
  time: string;
  type: string;
  status: string;
  meetingLink?: string;
  notes?: string;
}

export default function AppointmentList() {
  const { theme, scaledFontSize } = useTheme();
  
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Create dynamic styles with theme colors
  const styles = useMemo(() => createStyles(scaledFontSize, theme.colors), [scaledFontSize, theme.colors]);

  // Bottom navigation tabs
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // (useEffect moved below after fetchAppointments is declared)

  // Mock data for appointments
// Show status modal helper
const showStatusModal = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
  setStatusModalType(type);
  setStatusModalTitle(title);
  setStatusModalMessage(message);
  setStatusModalVisible(true);
}, []);

const fetchAppointments = useCallback(async () => {
  try {
    setLoading(true);
    console.log('📅 Fetching appointments for user:', user?.id);
    
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_URL}/api/appointments?clerkUserId=${user?.id}`);
    const result = await response.json();

    console.log('📥 Appointments response:', result);

    if (result.success && result.appointments) {
      // Transform backend data to frontend format
      const transformedAppointments = result.appointments.map((apt: any) => {
        const appointmentDate = new Date(apt.date);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        // Determine if upcoming or past based on BOTH date AND time in MST
        // Parse UTC date and extract date components (ignore timezone offset)
        const utcDate = new Date(apt.date);
        const year = utcDate.getUTCFullYear();
        const month = utcDate.getUTCMonth();
        const day = utcDate.getUTCDate();
        
        // Get current date/time in MST using Intl.DateTimeFormat
        const mstFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Denver',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const mstParts = mstFormatter.formatToParts(new Date());
        const nowMSTYear = parseInt(mstParts.find(p => p.type === 'year')?.value || '0');
        const nowMSTMonth = parseInt(mstParts.find(p => p.type === 'month')?.value || '0') - 1;
        const nowMSTDay = parseInt(mstParts.find(p => p.type === 'day')?.value || '0');
        const nowMSTHour = parseInt(mstParts.find(p => p.type === 'hour')?.value || '0');
        const nowMSTMinute = parseInt(mstParts.find(p => p.type === 'minute')?.value || '0');
        
        // Parse appointment time
        const timeStr = apt.time || '00:00:00';
        const [aptHours, aptMinutes] = timeStr.split(':').map(Number);
        
        // Compare as numeric values: YYYYMMDDHHMM
        const nowMSTNumeric = nowMSTYear * 100000000 + (nowMSTMonth + 1) * 1000000 + nowMSTDay * 10000 + nowMSTHour * 100 + nowMSTMinute;
        const aptMSTNumeric = year * 100000000 + (month + 1) * 1000000 + day * 10000 + aptHours * 100 + aptMinutes;
        
        const isUpcoming = aptMSTNumeric > nowMSTNumeric;

        return {
          id: apt.id,
          supportWorker: apt.supportWorker || 'Support Worker',
          date: formattedDate,
          time: apt.time || '',
          type: apt.type || 'Video',
          // ⚡ KEY FIX: Transform status to "upcoming" or "past" based on date+time
          status: apt.status === 'cancelled' ? 'cancelled' :
                  apt.status === 'completed' ? 'past' :
                  isUpcoming ? 'upcoming' : 'past'
        };
      });

      setAppointments(transformedAppointments);
      console.log('✅ Appointments loaded:', transformedAppointments.length);
    } else {
      console.warn('⚠️ No appointments found or error:', result);
      setAppointments([]);
    }
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    showStatusModal('error', 'Error', 'Unable to fetch appointments. Please try again.');
    setAppointments([]);
  } finally {
    setLoading(false);
  }
}, [user?.id, showStatusModal]);
  

// Run fetch when user id is ready
useEffect(() => {
  if (user?.id) fetchAppointments();
  }, [user?.id, fetchAppointments]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

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

  const confirmSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: handleLogout },
    ]);
  };

  const sideMenuItems = [
    { icon: "home", title: "Dashboard", onPress: () => { setSideMenuVisible(false); router.replace("/(app)/(tabs)/home"); } },
    { icon: "person", title: "Profile", onPress: () => { setSideMenuVisible(false); router.push("/(app)/(tabs)/profile"); } },
    { icon: "bar-chart", title: "Self-Assessment", onPress: () => { setSideMenuVisible(false); router.push("/self-assessment"); } },
    { icon: "happy", title: "Mood Tracking", onPress: () => { setSideMenuVisible(false); router.push("/mood-tracking"); } },
    { icon: "journal", title: "Journaling", onPress: () => { setSideMenuVisible(false); router.push("/journal"); } },
    { icon: "library", title: "Resources", onPress: () => { setSideMenuVisible(false); router.push("/resources"); } },
    { icon: "help-circle", title: "Crisis Support", onPress: () => { setSideMenuVisible(false); router.push("/crisis-support"); } },
    { icon: "chatbubble", title: "Messages", onPress: () => { setSideMenuVisible(false); router.push("/(app)/(tabs)/messages"); } },
    { icon: "calendar", title: "Appointments", onPress: () => { setSideMenuVisible(false); router.push("/(app)/(tabs)/appointments"); } },
    { icon: "people", title: "Community Forum", onPress: () => { setSideMenuVisible(false); router.push("/community-forum"); } },
    { icon: "videocam", title: "Video Consultations", onPress: () => { setSideMenuVisible(false); router.push("/video-consultations"); } },
    { icon: "log-out", title: "Sign Out", onPress: confirmSignOut, disabled: isSigningOut },
  ];

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

  const handleAppointmentPress = (appointmentId: number) => {
    router.push(`/(app)/(tabs)/appointments/${appointmentId}/appointment-detail`);
  };

  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="My Appointments" showBack={true} />

        {/* Appointments Tabs */}
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
              Upcoming ({appointments.filter((a) => a.status === "upcoming").length})
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
          <ScrollView 
            style={styles.appointmentsContainer}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
          {activeAppointmentsTab === "upcoming" ? (
            appointments.filter((a) => a.status === "upcoming").length > 0 ? (
              appointments
                .filter((a) => a.status === "upcoming")
                .map((appointment) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={styles.appointmentCard}
                    onPress={() => handleAppointmentPress(appointment.id)}
                  >
                    <Text style={styles.supportWorker}>
                      {appointment.supportWorker}
                    </Text>
                    <View style={styles.appointmentDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.icon} />
                        <Text style={styles.detailText}>{appointment.date}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.icon} />
                        <Text style={styles.detailText}>{appointment.time}</Text>
                      </View>
                    </View>
                    <View style={styles.sessionType}>
                      <Ionicons name="videocam" size={14} color={theme.colors.primary} />
                      <Text style={styles.sessionTypeText}>{appointment.type} Session</Text>
                    </View>
                  </TouchableOpacity>
                ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={theme.colors.iconDisabled} />
                <Text style={styles.emptyStateText}>No upcoming appointments</Text>
              </View>
            )
          ) : appointments.filter((a) => a.status === "past").length > 0 ? (
            appointments
              .filter((a) => a.status === "past")
              .map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentCard}
                  onPress={() => handleAppointmentPress(appointment.id)}
                >
                  <Text style={styles.supportWorker}>
                    {appointment.supportWorker}
                  </Text>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.icon} />
                      <Text style={styles.detailText}>{appointment.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.icon} />
                      <Text style={styles.detailText}>{appointment.time}</Text>
                    </View>
                  </View>
                  <View style={styles.sessionType}>
                    <Ionicons name="videocam" size={14} color={theme.colors.primary} />
                    <Text style={styles.sessionTypeText}>{appointment.type} Session</Text>
                  </View>
                </TouchableOpacity>
              ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.iconDisabled} />
              <Text style={styles.emptyStateText}>No past appointments</Text>
            </View>
          )}
        </ScrollView>

        {/* Schedule New Appointment Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => router.push("/appointments/book")}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.scheduleButtonText}>Schedule New Appointment</Text>
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
            <View style={styles.sideMenu}>
              <View style={styles.sideMenuHeader}>
                <Text style={styles.profileName}>{getDisplayName()}</Text>
                <Text style={styles.profileEmail}>{getUserEmail()}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sideMenuItem,
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
                        item.disabled && styles.sideMenuItemTextDisabled,
                        item.title === "Sign Out" && styles.signOutText,
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

const createStyles = (scaledFontSize: (size: number) => number, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: colors.surface,
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: "center",
  },
  profileName: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: scaledFontSize(14),
    color: colors.textSecondary,
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
    borderBottomColor: colors.borderLight,
  },
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    color: colors.text,
    marginLeft: 15,
  },
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemTextDisabled: {
    color: colors.textDisabled,
  },
  signOutText: {
    color: colors.error,
    fontWeight: "600",
  },
  appointmentsTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: scaledFontSize(16),
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "600",
  },
  appointmentsContainer: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  supportWorker: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: colors.text,
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
    color: colors.textSecondary,
    marginLeft: 8,
  },
  sessionType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + '20', // 20% opacity
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  sessionTypeText: {
    fontSize: scaledFontSize(14),
    color: colors.primary,
    marginLeft: 6,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: scaledFontSize(16),
    color: colors.text,
    marginTop: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scheduleButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 30,
    marginHorizontal: 25,
  },
  scheduleButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    marginLeft: 8,
  },
});
