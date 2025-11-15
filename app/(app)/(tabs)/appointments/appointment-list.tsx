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
import { useConvex, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { mapAppointmentStatus } from "../../../../utils/appointmentStatus";

interface Appointment {
  id: string;
  supportWorker: string;
  supportWorkerId?: string | number;
  date: string;
  time: string;
  type: string;
  status: 'upcoming' | 'past' | 'cancelled';
  meetingLink?: string;
  notes?: string;
}

export default function AppointmentList() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  
  // Determine user's organization
  const myOrgFromConvex = useQuery(api.users.getMyOrg, {});
  const orgId = useMemo(() => {
    if (typeof myOrgFromConvex === 'string' && myOrgFromConvex.length > 0) return myOrgFromConvex;
    const meta = (user?.publicMetadata as any) || {};
    return meta.orgId || 'cmha-calgary';
  }, [myOrgFromConvex, user?.publicMetadata]);
  const isSAIT = orgId === 'sait';
  const orgShortLabel = isSAIT ? 'SAIT' : 'CMHA';
  
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
  const { signOut, getToken } = useAuth();

  const convex = useConvex();

  // Use reactive queries for real-time updates
  const upcomingData = useQuery(
    api.appointments.getUpcomingAppointments,
    user?.id ? { userId: user.id } : "skip"
  );
  const pastData = useQuery(
    api.appointments.getPastAppointments,
    user?.id ? { userId: user.id } : "skip"
  );

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
  if (!user?.id || !upcomingData || !pastData) return;
  try {
    setLoading(true);
    console.log('📅 Processing appointments from Convex for user:', user.id);
    const upcoming = upcomingData;
    const past = pastData;

    // Helper to rewrite any persisted auto-assigned label to current org
    const normalizeAutoAssigned = (name: string | undefined) => {
      if (!name) return name;
      return name.startsWith('Auto-assigned by ') ? `Auto-assigned by ${orgShortLabel}` : name;
    };

    // Build support worker enrichment map for items missing names
    const collectIds = (list: any[]) =>
      list
        .filter((apt) => !apt.supportWorker && apt.supportWorkerId)
        .map((apt) => String(apt.supportWorkerId));

    const idsToFetch = Array.from(new Set([
      ...collectIds(upcoming as any[]),
      ...collectIds(past as any[]),
    ]));

    const nameMap: Record<string, string> = {};
    if (idsToFetch.length > 0) {
      const results = await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            const worker = await convex.query(api.supportWorkers.getSupportWorker, { workerId: id });
            return { id, name: worker?.name as string | undefined };
          } catch (e) {
            return { id, name: undefined };
          }
        })
      );
      results.forEach(({ id, name }) => {
        if (name) nameMap[id] = name;
      });
    }

    // Map to UI type and format date neatly (preserve Mountain Time, don't convert)
    const formatDate = (iso: string) => {
      // Parse as YYYY-MM-DD without timezone conversion
      const [year, month, day] = iso.split('-').map(Number);
      if (!year || !month || !day) return iso;
      
      // Create date in local time (not UTC)
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    };

    // Helper to check if appointment is in the past (Mountain Time)
    const isPastAppointment = (apt: any) => {
      // Only completed/no_show, or scheduled/confirmed with date/time in the past
      if (["completed", "no_show"].includes(apt.status)) return true;
      if (["scheduled", "confirmed"].includes(apt.status)) {
        try {
          // Parse date components (YYYY-MM-DD) and time (HH:MM)
          const [year, month, day] = apt.date.split('-').map(Number);
          const [hours, minutes] = (apt.time || '00:00').split(':').map(Number);
          
          // Get current time in Mountain Time using formatToParts
          const nowParts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Denver',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).formatToParts(new Date());
          
          const getPart = (type: string) => {
            const part = nowParts.find(p => p.type === type);
            return part ? parseInt(part.value, 10) : 0;
          };
          
          const nowYear = getPart('year');
          const nowMonth = getPart('month');
          const nowDay = getPart('day');
          const nowHour = getPart('hour');
          const nowMinute = getPart('minute');
          
          // Compare date/time components
          if (year < nowYear) return true;
          if (year > nowYear) return false;
          if (month < nowMonth) return true;
          if (month > nowMonth) return false;
          if (day < nowDay) return true;
          if (day > nowDay) return false;
          if (hours < nowHour) return true;
          if (hours > nowHour) return false;
          return minutes < nowMinute;
        } catch {
          return false;
        }
      }
      return false;
    };

    // Upcoming: scheduled/confirmed and date/time in future
    const mappedUpcoming: Appointment[] = (upcoming as any[])
      .filter((apt: any) => ["scheduled", "confirmed"].includes(apt.status))
      .filter((apt: any) => {
        try {
          // Parse date components (YYYY-MM-DD) and time (HH:MM)
          const [year, month, day] = apt.date.split('-').map(Number);
          const [hours, minutes] = (apt.time || '00:00').split(':').map(Number);
          
          // Get current time in Mountain Time using formatToParts
          const nowParts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Denver',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).formatToParts(new Date());
          
          const getPart = (type: string) => {
            const part = nowParts.find(p => p.type === type);
            return part ? parseInt(part.value, 10) : 0;
          };
          
          const nowYear = getPart('year');
          const nowMonth = getPart('month');
          const nowDay = getPart('day');
          const nowHour = getPart('hour');
          const nowMinute = getPart('minute');
          
          // Compare date/time components - return true if appointment is in future
          if (year > nowYear) return true;
          if (year < nowYear) return false;
          if (month > nowMonth) return true;
          if (month < nowMonth) return false;
          if (day > nowDay) return true;
          if (day < nowDay) return false;
          if (hours > nowHour) return true;
          if (hours < nowHour) return false;
          return minutes >= nowMinute;
        } catch {
          return true;
        }
      })
      .map((apt: any) => ({
        id: String(apt.id),
        supportWorker: normalizeAutoAssigned(apt.supportWorker) || nameMap[String(apt.supportWorkerId)] || `Auto-assigned by ${orgShortLabel}`,
        supportWorkerId: apt.supportWorkerId,
        date: formatDate(apt.date),
        time: apt.time || '',
        type: (apt.type || 'video').toString().replace('_', ' '),
        status: 'upcoming',
        meetingLink: apt.meetingLink,
        notes: apt.notes,
      }));

    // Past: completed/no_show, or scheduled/confirmed with date/time in past
    // DO NOT include cancelled appointments
    const mappedPast: Appointment[] = ([...upcoming, ...past] as any[])
      .filter(isPastAppointment)
      .filter((apt: any) => apt.status !== 'cancelled') // Exclude cancelled
      .map((apt: any) => ({
        id: String(apt.id),
        supportWorker: normalizeAutoAssigned(apt.supportWorker) || nameMap[String(apt.supportWorkerId)] || `Auto-assigned by ${orgShortLabel}`,
        supportWorkerId: apt.supportWorkerId,
        date: formatDate(apt.date),
        time: apt.time || '',
        type: (apt.type || 'video').toString().replace('_', ' '),
        status: 'past',
        meetingLink: apt.meetingLink,
        notes: apt.notes,
      }));

    const combined = [...mappedUpcoming, ...mappedPast];
    setAppointments(combined);
    console.log('✅ Appointments loaded:', combined.length);
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    showStatusModal('error', 'Error', 'Unable to fetch appointments. Please try again.');
    setAppointments([]);
  } finally {
    setLoading(false);
  }
}, [user?.id, upcomingData, pastData, convex, showStatusModal, orgShortLabel]);
  

// Run fetch when user id is ready or when data changes
useEffect(() => {
  if (user?.id && (upcomingData !== undefined || pastData !== undefined)) {
    fetchAppointments();
  }
}, [user?.id, upcomingData, pastData, fetchAppointments]);

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

  const handleAppointmentPress = (appointmentId: string) => {
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
                    style={[styles.appointmentCard, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#444' : '#E0E0E0' }]}
                    onPress={() => handleAppointmentPress(appointment.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.workerIconCircle}>
                        <Ionicons name="person" size={20} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.supportWorker, { color: theme.colors.text }]}>
                        {appointment.supportWorker}
                      </Text>
                    </View>
                    <View style={styles.appointmentDetails}>
                      <View style={styles.detailRow}>
                        <View style={[styles.detailIconCircle, { backgroundColor: theme.isDark ? '#4A5F4F' : '#E8F5E9' }]}>
                          <Ionicons name="calendar-outline" size={16} color={theme.isDark ? '#81C784' : '#4CAF50'} />
                        </View>
                        <Text style={[styles.detailText, { color: theme.colors.text }]}>{appointment.date}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <View style={[styles.detailIconCircle, { backgroundColor: theme.isDark ? '#5F4E3F' : '#FFF3E0' }]}>
                          <Ionicons name="time-outline" size={16} color={theme.isDark ? '#FFB74D' : '#FF9800'} />
                        </View>
                        <Text style={[styles.detailText, { color: theme.colors.text }]}>{appointment.time}</Text>
                      </View>
                      <View style={[styles.sessionTypeBadge, { backgroundColor: theme.isDark ? '#3A2A3F' : '#F3E5F5' }]}>
                        <Ionicons name="videocam" size={14} color={theme.isDark ? '#CE93D8' : '#9C27B0'} />
                        <Text style={[styles.sessionTypeText, { color: theme.isDark ? '#CE93D8' : '#9C27B0' }]}>{appointment.type}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={56} color={theme.isDark ? '#444' : '#E0E0E0'} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.textSecondary }]}>No upcoming appointments</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>Book a session to get started</Text>
              </View>
            )
          ) : appointments.filter((a) => a.status === "past").length > 0 ? (
            appointments
              .filter((a) => a.status === "past")
              .map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={[styles.appointmentCard, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#555' : '#D0D0D0', opacity: 0.85 }]}
                  onPress={() => handleAppointmentPress(appointment.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.workerIconCircle, { backgroundColor: theme.isDark ? '#555' : '#9E9E9E' }]}>
                      <Ionicons name="person" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.supportWorker, { color: theme.colors.text, opacity: 0.9 }]}>
                      {appointment.supportWorker}
                    </Text>
                  </View>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                      <View style={[styles.detailIconCircle, { backgroundColor: theme.isDark ? '#4A5F4F' : '#E8F5E9' }]}>
                        <Ionicons name="calendar-outline" size={16} color={theme.isDark ? '#66BB6A' : '#4CAF50'} />
                      </View>
                      <Text style={[styles.detailText, { color: theme.colors.text, opacity: 0.9 }]}>{appointment.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={[styles.detailIconCircle, { backgroundColor: theme.isDark ? '#5F4E3F' : '#FFF3E0' }]}>
                        <Ionicons name="time-outline" size={16} color={theme.isDark ? '#FFA726' : '#FF9800'} />
                      </View>
                      <Text style={[styles.detailText, { color: theme.colors.text, opacity: 0.9 }]}>{appointment.time}</Text>
                    </View>
                    <View style={[styles.sessionTypeBadge, { backgroundColor: theme.isDark ? '#3A2A3F' : '#F3E5F5' }]}>
                      <Ionicons name="videocam" size={14} color={theme.isDark ? '#BA68C8' : '#9C27B0'} />
                      <Text style={[styles.sessionTypeText, { color: theme.isDark ? '#BA68C8' : '#9C27B0' }]}>{appointment.type}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={56} color="#E0E0E0" />
              <Text style={styles.emptyStateTitle}>No past appointments</Text>
              <Text style={styles.emptyStateSubtitle}>Your history will appear here</Text>
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  supportWorker: {
    fontSize: scaledFontSize(17),
    fontWeight: "700",
    flex: 1,
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: scaledFontSize(14),
    fontWeight: '500',
  },
  sessionTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  sessionTypeText: {
    fontSize: scaledFontSize(13),
    marginLeft: 6,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  emptyStateTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: colors.textSecondary,
  },
  emptyStateSubtitle: {
    fontSize: scaledFontSize(14),
    textAlign: 'center',
    color: colors.textSecondary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scheduleButton: {
    backgroundColor: '#4CAF50',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  scheduleButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    marginLeft: 8,
  },
});
