/**
 * LLM Prompt: Add concise comments to this React Native component.
 * Reference: chat.deepseek.com
 */
import { useState, useMemo, useEffect, useCallback } from "react";
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
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { mapAppointmentStatus } from "../../../../utils/appointmentStatus";
import { Alert } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";
// Removed legacy Convex client + hybrid hook; using direct Convex queries

const { width } = Dimensions.get("window");

interface Appointment {
  id: number;
  supportWorker: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

/**
 * AppointmentsScreen Component
 *
 * Main appointments screen that allows users to book new appointments
 * or view their scheduled appointments. Features an intuitive interface
 * with clear navigation options and an elegant curved background.
 */
export default function AppointmentsScreen() {
  const { theme, scaledFontSize } = useTheme();
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [activeView, setActiveView] = useState("main");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const convex = useConvex();

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  /**
   * Show status modal with given parameters
   */
  const showStatusModal = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModalType(type);
    setStatusModalTitle(title);
    setStatusModalMessage(message);
    setStatusModalVisible(true);
  }, []);

  /**
   * Fetch appointments using the same source and mapping as the list screen
   * to keep Upcoming count and Next Session perfectly in sync.
   */
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      console.log('📅 Fetching upcoming/past appointments for dashboard...');

      const [upcoming, past] = await Promise.all([
        convex.query(api.appointments.getUpcomingAppointments, { userId: user.id }),
        convex.query(api.appointments.getPastAppointments, { userId: user.id }),
      ]);

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
            } catch {
              return { id, name: undefined };
            }
          })
        );
        results.forEach(({ id, name }) => {
          if (name) nameMap[id] = name;
        });
      }

      // Format date to match the list view
      const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
      };

      // Upcoming count from same source as list
      const upcomingCountVal = (upcoming as any[]).length;
      setUpcomingCount(upcomingCountVal);

      // Completed count mirrors the list logic (exclude cancelled)
      const completedCountVal = (past as any[])
        .map((apt: any) => mapAppointmentStatus(apt.status as any, apt.date, apt.time).toLowerCase())
        .filter((s) => s === 'past').length;
      setCompletedCount(completedCountVal);

      // Next session = first upcoming item (backend should already sort soonest-first)
      const nextRaw = (upcoming as any[])[0];
      if (nextRaw) {
        const mappedNext: Appointment = {
          id: 0 as any,
          supportWorker: nextRaw.supportWorker || nameMap[String(nextRaw.supportWorkerId)] || 'Auto-assigned by CMHA',
          date: formatDate(nextRaw.date),
          time: nextRaw.time || '',
          type: (nextRaw.type || 'video').toString().replace('_', ' '),
          status: 'upcoming',
        };
        setNextAppointment(mappedNext as any);
      } else {
        setNextAppointment(null);
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      showStatusModal('error', 'Error', 'Unable to fetch appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showStatusModal, convex]);

  // Run fetch on mount and when dependencies change
  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    }
  }, [user?.id, fetchAppointments]);

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
   * Handles navigation to book appointment screen
   */
  const handleBookAppointment = () => {
    router.push("/(app)/(tabs)/appointments/book");
  };

  /**
   * Handles navigation to view scheduled appointments
   */
  const handleViewScheduled = () => {
    router.push("/(app)/(tabs)/appointments/appointment-list");
  };

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Appointments" showBack={true} />

        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Title */}
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>
            My Appointments
          </Text>

          {/* Quick Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardUpcoming]}>
              <Ionicons name="time-outline" size={28} color="#FF9800" />
              <Text style={styles.statNumber}>{upcomingCount}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={[styles.statCard, styles.statCardCompleted]}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#4CAF50" />
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          {/* Main Action Card */}
          <TouchableOpacity
            style={styles.mainActionCard}
            onPress={handleBookAppointment}
            activeOpacity={0.9}
          >
            <View style={styles.mainActionContent}>
              <View style={styles.mainActionTextContainer}>
                <Text style={styles.mainActionTitle}>Book New Session</Text>
                <Text style={styles.mainActionSubtitle}>
                  Connect with a support worker at CMHA
                </Text>
              </View>
              <View style={styles.mainActionIconContainer}>
                <Ionicons name="add-circle" size={48} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Upcoming Session Card */}
          {nextAppointment ? (
            <View style={styles.upcomingSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Next Session
              </Text>
              <View style={styles.nextSessionCard}>
                <View style={styles.nextSessionHeader}>
                  <View style={styles.nextSessionIconCircle}>
                    <Ionicons name="person" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.nextSessionInfo}>
                    <Text style={styles.nextSessionWorker}>
                      {nextAppointment.supportWorker}
                    </Text>
                    <Text style={styles.nextSessionRole}>Support Worker</Text>
                  </View>
                </View>
                <View style={styles.nextSessionDetails}>
                  <View style={styles.nextSessionDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.nextSessionDetailText}>
                      {nextAppointment.date}
                    </Text>
                  </View>
                  <View style={styles.nextSessionDetailRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.nextSessionDetailText}>
                      {nextAppointment.time}
                    </Text>
                  </View>
                  <View style={styles.nextSessionDetailRow}>
                    <Ionicons name="videocam" size={16} color="#666" />
                    <Text style={styles.nextSessionDetailText}>
                      {nextAppointment.type} Session
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : upcomingCount === 0 ? (
            <View style={styles.emptyStateCard}>
              <Ionicons name="calendar-outline" size={56} color="#E0E0E0" />
              <Text style={styles.emptyStateTitle}>No upcoming sessions</Text>
              <Text style={styles.emptyStateSubtitle}>
                Book your first session to get started
              </Text>
            </View>
          ) : null}

          {/* View All Button */}
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={handleViewScheduled}
          >
            <Text style={styles.viewAllButtonText}>View All Appointments</Text>
            <Ionicons name="arrow-forward" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </ScrollView>

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
                      color={item.disabled ? theme.colors.iconDisabled : theme.colors.icon}
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
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: scaledFontSize(28),
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardUpcoming: {
    backgroundColor: '#FAFAFA',
  },
  statCardCompleted: {
    backgroundColor: '#FAFAFA',
  },
  statNumber: {
    fontSize: scaledFontSize(32),
    fontWeight: '700',
    marginVertical: 8,
    color: '#000',
  },
  statLabel: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    color: '#666',
  },
  mainActionCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  mainActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainActionTextContainer: {
    flex: 1,
  },
  mainActionTitle: {
    fontSize: scaledFontSize(22),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  mainActionSubtitle: {
    fontSize: scaledFontSize(14),
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  mainActionIconContainer: {
    marginLeft: 16,
  },
  upcomingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '700',
    marginBottom: 12,
  },
  nextSessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextSessionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextSessionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nextSessionWorker: {
    fontSize: scaledFontSize(16),
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  nextSessionRole: {
    fontSize: scaledFontSize(13),
    color: '#666',
  },
  nextSessionDetails: {
    gap: 10,
  },
  nextSessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextSessionDetailText: {
    fontSize: scaledFontSize(14),
    marginLeft: 10,
    color: '#333',
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: scaledFontSize(14),
    color: '#999',
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  viewAllButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 8,
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
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemTextDisabled: {
    color: "#CCCCCC",
  },
});
