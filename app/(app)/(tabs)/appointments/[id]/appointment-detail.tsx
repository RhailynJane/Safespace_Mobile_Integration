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
import { mapAppointmentStatus } from "../../../../../utils/appointmentStatus";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../../../contexts/ThemeContext";
import StatusModal from "../../../../../components/StatusModal";
import { useConvex } from "convex/react";
import { api } from "../../../../../convex/_generated/api";


interface Appointment {
  id: string;
  supportWorker: string;
  supportWorkerId?: number;
  date: string;
  originalDate?: string; // Store original date for calculations
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
  const { signOut } = useAuth();
  const { user } = useUser();
  // Shared Convex instance
  const convex = useConvex();

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize, theme), [scaledFontSize, theme]);



  // Find the appointment based on the ID from the URL

  // (effect moved below after function declarations)

const showStatusModal = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
  setStatusModalType(type);
  setStatusModalTitle(title);
  setStatusModalMessage(message);
  setStatusModalVisible(true);
}, []);

const fetchAppointment = useCallback(async () => {
  if (!id || id === "undefined") {
    console.warn('⚠️ Appointment ID is missing or undefined:', id);
    showStatusModal('error', 'Invalid ID', 'Appointment ID is missing. Please go back and try again.');
    return;
  }
  try {
    setLoading(true);
    console.log('📅 Fetching single appointment via Convex. ID:', id, 'Type:', typeof id);
    const result = await convex.query(api.appointments.getAppointment, { appointmentId: String(id) });
    if (!result) {
      showStatusModal('error', 'Not Found', 'Appointment not found.');
      setAppointment(null);
      return;
    }
    // Ensure support worker name is populated; enrich from supportWorkers if missing
    let supportWorkerName: string = result.supportWorker || '';
    if (!supportWorkerName && result.supportWorkerId) {
      try {
        const worker = await convex.query(api.supportWorkers.getSupportWorker, { workerId: String(result.supportWorkerId) });
        if (worker?.name) supportWorkerName = worker.name;
      } catch (e) {
        // ignore enrichment errors and fall back to default placeholder
      }
    }
    // Adapt status labels via utility
    const mappedStatus = mapAppointmentStatus(result.status as any, result.date, result.time);
    // Parse the date string (YYYY-MM-DD) without timezone conversion
    const [year, month, day] = result.date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const readableDate = localDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    setAppointment({
      id: result.id as any,
      supportWorker: supportWorkerName || 'Support Worker',
      supportWorkerId: result.supportWorkerId,
      date: readableDate,
      originalDate: result.date, // Store original date for calculations
      time: result.time || '',
      type: result.type || 'Video',
      meetingLink: result.meetingLink,
      notes: result.notes,
      status: mappedStatus,
      cancellationReason: result.cancellationReason,
    });
  } catch (e) {
    console.error('❌ Error fetching appointment:', e);
    showStatusModal('error', 'Error', 'Unable to fetch appointment. Please try again.');
    setAppointment(null);
  } finally {
    setLoading(false);
  }
}, [id, convex, showStatusModal]);

  // Find the appointment based on the ID from the URL
  useEffect(() => {
    if (user?.id && id) {
      fetchAppointment();
    }
  }, [user?.id, id, fetchAppointment]);
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
  // State for join restriction popup
  const [joinRestrictionMsg, setJoinRestrictionMsg] = useState<string | null>(null);

  // Handler for join session with restriction
  const handleJoinSession = () => {
    if (!appointment) return;
    // Parse date/time using originalDate (YYYY-MM-DD format from backend)
    const dateToUse = appointment.originalDate || appointment.date;
    const aptDateTime = new Date(`${dateToUse}T${appointment.time}`);
    if (isNaN(aptDateTime.getTime())) {
      console.error('Failed to parse appointment date/time:', dateToUse, appointment.time);
      // If parsing fails, allow join anyway
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
      return;
    }
    const now = new Date();
    const minutesUntilAppointment = (aptDateTime.getTime() - now.getTime()) / (1000 * 60);
    console.log('Join restriction check:', { minutesUntilAppointment, aptDateTime: aptDateTime.toISOString(), now: now.toISOString() });
    if (minutesUntilAppointment > 60) {
      // Format date/time as MM-DD-YYYY HH:SS
      const formatted = `${String(aptDateTime.getMonth()+1).padStart(2,'0')}-${String(aptDateTime.getDate()).padStart(2,'0')}-${aptDateTime.getFullYear()} ${String(aptDateTime.getHours()).padStart(2,'0')}:${String(aptDateTime.getMinutes()).padStart(2,'0')}`;
      console.log('Join too early, showing restriction message');
      setJoinRestrictionMsg(`The date is in ${formatted}. You can join 1 hour before the scheduled appt.`);
      return;
    }
    setJoinRestrictionMsg(null);
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
    // Navigate to book screen in reschedule mode; user selects new date/time there
    router.push({
      pathname: '/appointments/book',
      params: {
        reschedule: '1',
        appointmentId: String(appointment?.id),
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
      // Optimistic update
      setAppointment({ ...appointment, status: 'cancelled', cancellationReason: 'Cancelled by user' });
      setCancelModalVisible(false);
      setLoading(true);
      try {
        await convex.mutation(api.appointments.cancelAppointment, {
          appointmentId: id as any,
          cancellationReason: 'Cancelled by user',
        });
        showStatusModal('success', 'Appointment Cancelled', 'Your appointment has been successfully cancelled.');
        setTimeout(() => router.back(), 1200);
      } catch (convexErr: any) {
        console.error('Cancel error (Convex):', convexErr);
        setAppointment(previousAppointment);
        setCancelModalVisible(true);
        showStatusModal('error', 'Cancel Failed', convexErr?.message || 'Unable to cancel appointment.');
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

  // Show loading while fetching appointment
  if (loading || !appointment) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Appointment Details" showBack={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading appointment...</Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Appointment Details" showBack={true} />

          <ScrollView 
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
          >
          {/* Page Title */}
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Session Details</Text>

          {/* Support Worker Card */}
          <View style={[styles.workerCard, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#444' : '#E0E0E0' }]}>
            <View style={styles.workerIconCircle}>
              <Ionicons name="person" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.workerInfo}>
              <Text style={[styles.workerName, { color: theme.colors.text }]}>
                {appointment.supportWorker}
              </Text>
              <Text style={[styles.workerRole, { color: theme.colors.textSecondary }]}>CMHA Support Worker</Text>
            </View>
          </View>

          {/* Appointment Details Card */}
          <View style={[styles.detailsCard, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#444' : '#E0E0E0' }]}>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Date</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{appointment.date}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time-outline" size={20} color="#FF9800" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Time</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{appointment.time}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="videocam" size={20} color="#9C27B0" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Session Type</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{appointment.type}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color="#2196F3"
                />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Status</Text>
                <Text style={[styles.detailValue, styles.statusBadge, {
                  backgroundColor: appointment.status.toLowerCase() === 'upcoming' ? '#E8F5E9' : (theme.isDark ? '#2A2A2A' : '#F5F5F5'),
                  color: appointment.status.toLowerCase() === 'upcoming' ? '#2E7D32' : theme.colors.textSecondary
                }]}>
                  {appointment.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons - Only show for upcoming appointments */}
          {appointment.status.toLowerCase() !== 'past' && appointment.status.toLowerCase() !== 'cancelled' && (
            <View style={styles.actions}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
            
              {/* Join Session Button */}
              <TouchableOpacity
                style={styles.actionButtonJoin}
                onPress={handleJoinSession}
                activeOpacity={0.8}
              >
                <View style={styles.actionButtonContent}>
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="videocam" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionButtonTitle}>Join Video Session</Text>
                    <Text style={styles.actionButtonSubtitle}>Start your appointment</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Show join restriction popup if needed */}
              {joinRestrictionMsg && (
                <Modal
                  visible={!!joinRestrictionMsg}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setJoinRestrictionMsg(null)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={[styles.confirmationModalContent, { backgroundColor: theme.colors.surface }] }>
                      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Join Video Session</Text>
                      <Text style={[styles.modalText, { color: theme.colors.error || '#FF5252' }]}>{joinRestrictionMsg}</Text>
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalCancelButton]}
                          onPress={() => setJoinRestrictionMsg(null)}
                        >
                          <Text style={styles.modalCancelButtonText}>OK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              )}

              {/* Reschedule and Cancel Row */}
              <View style={styles.actionButtonRow}>
                {/* Reschedule Button */}
                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={handleReschedule}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar" size={20} color="#FF9800" />
                  <Text style={styles.actionButtonSecondaryText}>Reschedule</Text>
                </TouchableOpacity>

                {/* Cancel Appointment Button */}
                <TouchableOpacity
                  style={styles.actionButtonCancel}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={20} color="#F44336" />
                  <Text style={styles.actionButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
                    {appointment?.supportWorker} on {appointment?.date}?
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

const createStyles = (scaledFontSize: (size: number) => number, theme: any) => StyleSheet.create({
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
    marginTop: 16,
    fontSize: scaledFontSize(16),
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
  pageTitle: {
    fontSize: scaledFontSize(22),
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  workerCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
  },
  workerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#757575',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: scaledFontSize(17),
    fontWeight: '700',
    marginBottom: 2,
  },
  workerRole: {
    fontSize: scaledFontSize(13),
  },
  detailsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: scaledFontSize(11),
    marginBottom: 2,
  },
  detailValue: {
    fontSize: scaledFontSize(15),
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: '700',
    marginBottom: 12,
  },
  actions: {
    marginBottom: 20,
  },
  actionButtonJoin: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionButtonSubtitle: {
    fontSize: scaledFontSize(12),
    color: '#FFFFFF',
    opacity: 0.9,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonSecondaryText: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    color: '#FF9800',
  },
  actionButtonCancel: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonCancelText: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    color: '#F44336',
  },
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: 'center',
    alignItems: 'center',
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
  blurContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: scaledFontSize(22),
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: scaledFontSize(15),
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: scaledFontSize(15),
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#F44336',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: scaledFontSize(15),
    fontWeight: '600',
  },
});
