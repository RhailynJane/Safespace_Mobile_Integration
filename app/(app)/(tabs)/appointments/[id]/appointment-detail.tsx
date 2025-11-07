/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
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
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from 'expo-linking';
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../../../contexts/ThemeContext";
import StatusModal from "../../../../../components/StatusModal";
import { ConvexReactClient } from "convex/react";
import { useConvexAppointments } from "../../../../../utils/hooks/useConvexAppointments";


interface Appointment {
  id: number;
  supportWorker: string;
  supportWorkerId?: number;
  date: string;
  time: string;
  type: string;
  status: string;
  meetingLink?: string;
  notes?: string;
  cancellationReason?: string;
}

/**
 * AppointmentDetail Component
 * 
 * Detailed view of a single appointment that allows users to:
 * - View appointment details (date, time, support worker, type, status)
 * - Join video sessions
 * - Reschedule appointments
 * - Cancel appointments
 * Features modals for confirmation actions and elegant curved background.
 */
export default function AppointmentList() {
  const { theme, scaledFontSize } = useTheme();
  
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const { id } = useLocalSearchParams();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  
  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // Initialize Convex client with Clerk auth
  const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);
  
  useEffect(() => {
    if (!convexClient && process.env.EXPO_PUBLIC_CONVEX_URL) {
      const client = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL, {
        unsavedChangesWarning: false,
      });

      const fetchToken = async () => {
        if (getToken) {
          const token = await getToken({ template: 'convex' });
          return token ?? undefined;
        }
        return undefined;
      };
      
      client.setAuth(fetchToken);
      setConvexClient(client);
    }
  }, [convexClient, getToken]);

  // Convex appointments hook
  const {
    appointments: convexAppointments,
    loading: convexLoading,
    loadAppointments,
    updateAppointmentStatus,
    deleteAppointment,
    isUsingConvex,
  } = useConvexAppointments(user?.id, convexClient);

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);



  // Find the appointment based on the ID from the URL

  // (effect moved below after function declarations)

const showStatusModal = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
  setStatusModalType(type);
  setStatusModalTitle(title);
  setStatusModalMessage(message);
  setStatusModalVisible(true);
}, []);

const fetchAppointments = useCallback(async () => {
  try {
    setLoading(true);
    console.log('📅 Fetching appointment detail for ID:', id, 'User:', user?.id);
    
    // Use Convex data if available
    if (isUsingConvex && convexAppointments.length > 0) {
      console.log('✅ Using Convex appointments data');
      const foundAppointment = convexAppointments.find((apt: any) => apt.id.toString() === id);
      if (foundAppointment) {
        setAppointment(foundAppointment as any);
      } else {
        showStatusModal('error', 'Not Found', 'Appointment not found.');
      }
      setLoading(false);
      return;
    }
    
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

          const now = new Date();
          const isUpcoming = appointmentDate >= now;

          return {
            id: apt.id,
            supportWorker: apt.supportWorker || 'Support Worker',
            supportWorkerId: apt.supportWorkerId || apt.support_worker_id,
            date: formattedDate,
            time: apt.time || '',
            type: apt.type || 'Video',
            meetingLink: apt.meetingLink || apt.meeting_link, // Handle both formats
            notes: apt.notes,
            status: apt.status === 'cancelled' ? 'Cancelled' :
                    apt.status === 'completed' ? 'Completed' :
                    isUpcoming ? 'Upcoming' : 'Past'
          };
        });

        const foundAppointment = transformedAppointments.find(
          (apt: Appointment) => apt.id === parseInt(id as string)
        );
        
        if (foundAppointment) {
          setAppointment(foundAppointment);
          console.log('✅ Appointment found:', foundAppointment);
        } else {
          console.warn('⚠️ Appointment with ID', id, 'not found');
          setAppointment(null);
          showStatusModal('error', 'Not Found', 'Appointment not found');
        }
      } else {
        console.warn('⚠️ No appointments found or error:', result);
        setAppointment(null);
      }
    } catch (error) {
      console.error('❌ Error fetching appointment:', error);
      showStatusModal('error', 'Error', 'Unable to fetch appointment. Please try again.');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id, showStatusModal, isUsingConvex, convexAppointments]);

  // Find the appointment based on the ID from the URL
  useEffect(() => {
    if (user?.id && id) {
      // Refresh Convex data if using Convex
      if (isUsingConvex) {
        loadAppointments();
      } else {
        fetchAppointments();
      }
    }
  }, [user?.id, id, isUsingConvex, loadAppointments, fetchAppointments]);
  /**
   * Show status modal with given parameters
   */
  // showStatusModal moved above and memoized

  /**
   * Enhanced logout function with Clerk integration
   */
  const handleLogout = async () => {
    console.log('AppointmentDetail logout initiated...');
    
    if (isSigningOut) {
      console.log('Already signing out, returning...');
      return;
    }
    
    try {
      setIsSigningOut(true);
      
      // Close the side menu first
      setSideMenuVisible(false);
      
      // Clear local storage
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared');
      
      // Sign out from Clerk
      if (signOut) {
        await signOut();
        console.log('Clerk signOut completed');
      }
      
      // Navigate to login screen
      router.replace("/(auth)/login");
      console.log('Navigation to login completed');
      
    } catch (error) {
      console.error("Logout error:", error);
      showStatusModal('error', 'Logout Failed', 'Unable to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * Confirmation dialog for sign out
   */
  const confirmSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log('Sign out cancelled')
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: handleLogout
        }
      ]
    );
  };

  /**
   * Handles navigation to video consultation screen
   */
  const handleJoinSession = () => {
    if (!appointment) return;
    // Route to the pre-join Video Consultation screen
    router.push({
      pathname: "/(app)/video-consultations/video-call",
      params: {
        appointmentId: String(appointment.id),
        supportWorkerName: appointment.supportWorker,
        date: appointment.date,
        time: appointment.time,
        meetingLink: appointment.meetingLink || '',
      },
    });
  };

  /**
   * Opens reschedule modal
   */
  const handleReschedule = () => {
    if (!appointment?.supportWorkerId) {
      // If we don't have the worker id, fall back to the booking flow
      router.push(`/appointments/book`);
      return;
    }
    // Navigate to details screen in reschedule mode; user selects new date/time there
    router.push({
      pathname: '/appointments/details',
      params: {
        supportWorkerId: String(appointment.supportWorkerId),
        reschedule: '1',
        appointmentId: String(appointment.id),
      },
    });
  };

  /**
   * Opens cancellation confirmation modal
   */
  const handleCancel = () => {
    setCancelModalVisible(true);
  };

  /**
   * Confirms appointment cancellation
   * Uses optimistic UI: updates immediately, then syncs with server
   */
  const confirmCancel = async () => {
    if (!appointment) return;
    
    // Save previous state for rollback
    const previousAppointment = { ...appointment };
    
    try {
      // Optimistic update: immediately show cancelled state
      setAppointment({ ...appointment, status: 'cancelled', cancellationReason: 'Cancelled by user' });
      setCancelModalVisible(false);
      setLoading(true);
      
      // Try Convex first if available
      if (isUsingConvex && deleteAppointment) {
        try {
          await deleteAppointment(id as string);
          showStatusModal('success', 'Appointment Cancelled', 'Your appointment has been successfully cancelled.');
          setTimeout(() => router.back(), 1200);
          return;
        } catch (convexError) {
          console.warn('Convex cancel failed, falling back to REST:', convexError);
        }
      }
      
      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: 'Cancelled by user' }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showStatusModal('success', 'Appointment Cancelled', 'Your appointment has been successfully cancelled.');
        setTimeout(() => router.back(), 1200);
      } else {
        // Rollback on error
        setAppointment(previousAppointment);
        setCancelModalVisible(true);
        showStatusModal('error', 'Cancel Failed', result.error || 'Unable to cancel appointment.');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      // Rollback on error
      setAppointment(previousAppointment);
      setCancelModalVisible(true);
      showStatusModal('error', 'Cancel Failed', 'Unable to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirms appointment rescheduling
   * Validates time slot selection and simulates API call
   */
  const confirmReschedule = () => {
    if (!selectedTimeSlot) {
      showStatusModal('error', 'Selection Required', 'Please select a time slot to reschedule your appointment.');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setRescheduleModalVisible(false);
      showStatusModal('success', 'Appointment Rescheduled', 'Your appointment has been successfully rescheduled.');
      setSelectedTimeSlot(null);
      setTimeout(() => router.back(), 1500);
    }, 1500);
  };

  // Show loading indicator during operations
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </CurvedBackground>
    );
  }

    // Show error if appointment not found
  if (!appointment) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#4CAF50" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Appointment Details</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color="#FF6B6B" />
            <Text style={[styles.errorText, { color: theme.colors.text }]}>Appointment not found</Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

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
      router.replace("/(tabs)/home");
    } else {
      router.push(`/(tabs)/${tabId}`);
    }
  };

  /**
   * Gets display name from Clerk user data
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

  /**
   * Gets user email from Clerk
   * @returns User's email address or fallback text
   */
  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email available"
    );
  };

  // Side menu navigation items
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        setSideMenuVisible(false);
        router.replace("/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(tabs)/profile");
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
        router.push("/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(tabs)/appointments");
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

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Appointment Details" showBack={true} />

          <ScrollView 
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
          {/* Appointment Card */}
          <View style={[styles.appointmentCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.supportWorkerName, { color: theme.colors.text }]}>
              {appointment.supportWorker}
            </Text>

            {/* Appointment Details */}
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.icon} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{appointment.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={theme.colors.icon} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{appointment.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="videocam-outline" size={20} color={theme.colors.icon} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{appointment.type} Session</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={theme.colors.icon}
              />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                Status: {appointment.status}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Join Session Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleJoinSession}
            >
              <Ionicons name="videocam" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Join Session</Text>
            </TouchableOpacity>

            {/* Reschedule Button */}
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
              onPress={handleReschedule}
            >
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>Reschedule</Text>
            </TouchableOpacity>

            {/* Cancel Appointment Button */}
            <TouchableOpacity
              style={[styles.tertiaryButton, { borderColor: theme.colors.error }]}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.error} />
              <Text style={[styles.tertiaryButtonText, { color: theme.colors.error }]}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel Confirmation Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={cancelModalVisible}
            onRequestClose={() => setCancelModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setCancelModalVisible(false)}
            >
              <View style={styles.blurContainer}>
                <View style={[styles.confirmationModalContent, { backgroundColor: theme.colors.surface }]}>
                  <View style={[styles.modalIconContainer, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons name="close-circle" size={48} color={theme.colors.error} />
                  </View>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Cancel Appointment?</Text>
                  <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
                    Are you sure you want to cancel your session with{" "}
                    {appointment.supportWorker} on {appointment.date}?
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancelButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={() => setCancelModalVisible(false)}
                    >
                      <Text style={[styles.modalCancelButtonText, { color: theme.colors.textSecondary }]}>
                        Keep Appointment
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalConfirmButton, { backgroundColor: theme.colors.error }]}
                      onPress={confirmCancel}
                    >
                      <Text style={styles.modalConfirmButtonText}>
                        Yes, Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Pressable>
          </Modal>

          {/* Reschedule Modal removed: rescheduling handled by navigating to details screen */}
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
                      color={item.disabled ? theme.colors.iconDisabled : theme.colors.primary}
                    />
                    <Text style={[
                      styles.sideMenuItemText,
                      { color: theme.colors.text },
                      item.disabled && styles.sideMenuItemTextDisabled,
                      item.title === "Sign Out" && { color: theme.colors.error },
                    ]}>
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
    backgroundColor: "white",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  profileName: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: scaledFontSize(14),
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
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    color: "#333",
    marginLeft: 15,
  },
  sideMenuItemTextDisabled: {
    color: "#CCCCCC",
  },
  signOutText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: scaledFontSize(18),
    color: "#FF6B6B",
    marginTop: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportWorkerName: {
    fontSize: scaledFontSize(17),
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: scaledFontSize(13),
    color: "#666",
    marginLeft: 12,
  },
  actions: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    marginLeft: 8,
  },
  tertiaryButton: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F44336",
  },
  tertiaryButtonText: {
    color: "#F44336",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  modalText: {
    fontSize: scaledFontSize(16),
    color: "#666",
    marginBottom: 24,
    lineHeight: 24,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalCancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalCancelButtonText: {
    color: "#666",
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    textAlign: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  modalConfirmButton: {
    backgroundColor: "#F44336",
  },
  modalConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    textAlign: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  blurContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  rescheduleOptions: {
    width: "100%",
    marginBottom: 20,
  },
  rescheduleHint: {
    fontSize: scaledFontSize(14),
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  timeSlot: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  timeSlotText: {
    fontSize: scaledFontSize(14),
    color: "#2c3e50",
    fontWeight: "500",
  },
  selectedTimeSlot: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  selectedTimeSlotText: {
    color: "#2E7D32",
    fontWeight: "600",
  },
});
