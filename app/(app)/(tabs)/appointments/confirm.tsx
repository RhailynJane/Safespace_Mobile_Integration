/**
 * COMPLETE FIXED VERSION - Now creates appointments in database!
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
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";
import { useConvex, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Constants from 'expo-constants';
// Removed legacy ConvexReactClient and custom hook usage

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy load notifications module to avoid importing in Expo Go
let Notifications: any = null;

async function getNotificationsModule() {
  if (isExpoGo) {
    return null;
  }
  if (!Notifications) {
    Notifications = await import('expo-notifications');
  }
  return Notifications;
}

export default function ConfirmAppointment() {
  const { theme, scaledFontSize } = useTheme();
  
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [appointmentCreated, setAppointmentCreated] = useState(false);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);

  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut } = useAuth();
  const { user } = useUser();

  // Shared Convex client from provider
  const convex = useConvex();

  // Determine user's organization (prefer Convex users table, fallback to Clerk metadata)
  const myOrgFromConvex = useQuery(api.users.getMyOrg, {});
  const orgId = useMemo(() => {
    if (typeof myOrgFromConvex === 'string' && myOrgFromConvex.length > 0) return myOrgFromConvex;
    const meta = (user?.publicMetadata as any) || {};
    return meta.orgId || 'cmha-calgary';
  }, [myOrgFromConvex, user?.publicMetadata]);
  const isSAIT = orgId === 'sait';
  const orgShortLabel = isSAIT ? 'SAIT' : 'CMHA';
  const roleLabel = isSAIT ? 'Peer Support' : 'Support Worker';

  // Create dynamic styles
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Get params from navigation
  const params = useLocalSearchParams();
  
  const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
  };
  
  const supportWorkerId = getParam(params.supportWorkerId);
  const supportWorkerName = getParam(params.supportWorkerName);
  const selectedType = getParam(params.selectedType);
  const selectedDate = getParam(params.selectedDate);
  const selectedTime = getParam(params.selectedTime);
  const selectedDateDisplay = getParam((params as any).selectedDateDisplay);
  const backendWorkerIdParam = getParam((params as any).backendWorkerId);
  const supportWorkerEmail = getParam((params as any).supportWorkerEmail);
  const isReschedule = getParam((params as any).reschedule) === '1' || getParam((params as any).reschedule) === 'true';
  const rescheduleAppointmentId = getParam((params as any).appointmentId);

  // Mountain Time helpers (America/Denver)
  const getNowInMountain = useCallback(() => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value || 0);
    return {
      year: get('year'),
      month: get('month'),
      day: get('day'),
      hour: get('hour'),
      minute: get('minute'),
    };
  }, []);

  const parseTimeTo24h = useCallback((time: string) => {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return { hour: 0, minute: 0 };
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = (match[3] || 'AM').toUpperCase();
    if (ampm === 'AM') {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }
    return { hour, minute };
  }, []);

  const toHHMMSS = useCallback((timeLabel: string) => {
    const { hour, minute } = parseTimeTo24h(timeLabel);
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return `${hh}:${mm}:00`;
  }, [parseTimeTo24h]);

  const isPastInMountain = useCallback((isoDate: string, timeLabel: string) => {
    const now = getNowInMountain();
    const [yStr, mStr, dStr] = isoDate.split('-');
    const y: number = Number(yStr || '0');
    const m: number = Number(mStr || '0');
    const d: number = Number(dStr || '0');
    if (!y || !m || !d) return true;
    if (y < now.year) return true;
    if (y > now.year) return false;
    if (m < now.month) return true;
    if (m > now.month) return false;
    if (d < now.day) return true;
    if (d > now.day) return false;
    const { hour, minute } = parseTimeTo24h(timeLabel);
    if (hour < now.hour) return true;
    if (hour > now.hour) return false;
    return minute <= now.minute;
  }, [getNowInMountain, parseTimeTo24h]);

  /**
   * Schedule appointment reminder notification
   */
  const scheduleAppointmentReminder = useCallback(async (
    appointmentDate: string,
    appointmentTimeLabel: string,
    workerName: string
  ) => {
    // Skip in Expo Go
    if (isExpoGo) {
      console.log('⚠️ Appointment reminders not available in Expo Go');
      return;
    }

    // Check user settings to see if appointment reminders are enabled
    if (!user?.id) return;
    
    try {
  // Updated to consolidated getSettings API
  const settings = await convex.query(api.settings.getSettings, { clerkId: user.id });
      if (!settings) {
        console.log('⚠️ No settings found; skipping reminder scheduling');
        return;
      }
      if (!settings.appointmentReminderEnabled) {
        console.log('📅 Appointment reminders are disabled in settings');
        return;
      }

      const advanceMinutes = settings.appointmentReminderAdvanceMinutes || 60;
      
      // Parse appointment datetime
  const { hour, minute } = parseTimeTo24h(appointmentTimeLabel);
        const dateParts = appointmentDate.split('-').map(Number);
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
      
        // Validate date parts
        if (!year || !month || !day) {
          console.log('⚠️ Invalid appointment date format');
          return;
        }
      
      // Create appointment datetime
      const appointmentDateTime = new Date(year, month - 1, day, hour, minute);
      
      // Calculate reminder time (advance minutes before appointment)
      const reminderDateTime = new Date(appointmentDateTime.getTime() - (advanceMinutes * 60 * 1000));
      
      // Don't schedule if reminder time is in the past
      const now = new Date();
      if (reminderDateTime <= now) {
        console.log('⚠️ Reminder time is in the past, skipping schedule');
        return;
      }

      const Notifications = await getNotificationsModule();
      if (!Notifications) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Appointment Reminder',
          body: `Your appointment with ${workerName} is in ${advanceMinutes} minutes`,
          data: {
            type: 'appointment',
            appointmentDate,
            appointmentTime: appointmentTimeLabel,
            workerName,
          },
        },
        trigger: reminderDateTime,
      });

      console.log(`✅ Scheduled appointment reminder for ${reminderDateTime.toLocaleString()}`);
    } catch (error) {
      console.error('❌ Failed to schedule appointment reminder:', error);
      throw error;
    }
  }, [user?.id, parseTimeTo24h, convex]);

  /**
   * Show status modal
   */
  const showStatusModal = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModalType(type);
    setStatusModalTitle(title);
    setStatusModalMessage(message);
    setStatusModalVisible(true);
  }, []);

  /**
   * Create the appointment in the database
   */
  const createAppointment = useCallback(async () => {
    if (!user?.id || appointmentCreated) {
      return;
    }

    try {
      setLoading(true);
      console.log('📅 Creating appointment in database...');

      // Map UI session type labels to backend type values
      const sessionTypeMap: { [key: string]: string } = {
        'video call': 'video',
        'video': 'video',
        'phone call': 'phone',
        'phone': 'phone',
        'in-person': 'in_person',
        'in person': 'in_person'
      };
      
      const normalizedType = selectedType.toLowerCase();
      const sessionType = sessionTypeMap[normalizedType] || 'video';

      const chosenIdRaw = backendWorkerIdParam || supportWorkerId;
      const workerIdInt = chosenIdRaw ? parseInt(chosenIdRaw) : NaN;
      const normalizedTime = toHHMMSS(selectedTime); // HH:MM:SS
      try {
        const result = await convex.mutation(api.appointments.createAppointment, {
          userId: user.id,
          supportWorker: supportWorkerName || `Auto-assigned by ${orgShortLabel}`,
          supportWorkerId: Number.isFinite(workerIdInt) ? workerIdInt : undefined,
          date: selectedDate,
          time: normalizedTime.slice(0,5), // HH:MM
          type: sessionType,
          notes: 'Booked via mobile app',
        });
        console.log('✅ Convex appointment created:', result);
        setAppointmentCreated(true);
        setAppointmentId(workerIdInt);
        try {
          await scheduleAppointmentReminder(selectedDate, selectedTime, supportWorkerName || `Auto-assigned by ${orgShortLabel}`);
        } catch (reminderError) {
          console.warn('⚠️ Failed to schedule appointment reminder:', reminderError);
        }
      } catch (convexError: any) {
        console.error('❌ Convex appointment creation failed:', convexError);
        showStatusModal('error', 'Booking Failed', convexError?.message || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      showStatusModal('error', 'Booking Failed', 'Unable to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
    }, [user?.id, supportWorkerId, supportWorkerName, backendWorkerIdParam, appointmentCreated, selectedType, selectedDate, selectedTime, showStatusModal, toHHMMSS, scheduleAppointmentReminder, convex, orgShortLabel]);

    /**
     * Reschedule an existing appointment
     */
    const rescheduleAppointment = useCallback(async () => {
      if (!user?.id || !rescheduleAppointmentId) return;
      try {
        setLoading(true);
        const normalizedTime = toHHMMSS(selectedTime);
        try {
          await convex.mutation(api.appointments.rescheduleAppointment, {
            appointmentId: rescheduleAppointmentId as any,
            newDate: selectedDate,
            newTime: normalizedTime.slice(0,5),
            reason: `Rescheduled via app by user ${user.id}`,
          });
          setAppointmentCreated(true);
          setAppointmentId(parseInt(rescheduleAppointmentId));
          try {
            await scheduleAppointmentReminder(selectedDate, selectedTime, supportWorkerName);
          } catch (e) {
            console.warn('⚠️ Failed to schedule reminder after reschedule:', e);
          }
        } catch (err: any) {
          showStatusModal('error', 'Reschedule Failed', err?.message || 'Unable to reschedule appointment.');
        }
      } catch (e) {
        console.error('Reschedule error:', e);
        showStatusModal('error', 'Reschedule Failed', 'Unable to reschedule appointment. Please try again.');
      } finally {
        setLoading(false);
      }
    }, [user?.id, rescheduleAppointmentId, selectedDate, selectedTime, toHHMMSS, scheduleAppointmentReminder, supportWorkerName, showStatusModal, convex]);

  // Create appointment when page loads
  useEffect(() => {
    if (!user?.id || appointmentCreated) return;
    // Validate Mountain Time before proceeding
    if (selectedDate && selectedTime && isPastInMountain(selectedDate, selectedTime)) {
      showStatusModal('error', 'Time not available', 'Selected time is in the past for Mountain Time. Please choose a later time.');
      // Redirect back to details to pick another time
      setTimeout(() => {
        if (supportWorkerId) {
          router.replace(`/appointments/details?supportWorkerId=${supportWorkerId}`);
        } else {
          router.back();
        }
      }, 400);
      return;
    }
    if (isReschedule && rescheduleAppointmentId) {
      // Reschedule existing appointment
      rescheduleAppointment();
    } else {
      // Create a new appointment (auto-assign support worker)
      createAppointment();
    }
  }, [user?.id, appointmentCreated, isReschedule, rescheduleAppointmentId, supportWorkerId, selectedDate, selectedTime, isPastInMountain, showStatusModal, rescheduleAppointment, createAppointment]);

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

  // Check if we have the required data
  if (!selectedDate || !selectedTime) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <AppHeader title="Confirmation" showBack={true} />
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.text }]}>
              Missing appointment details. Please try booking again.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.replace("/appointments/book")}
            >
              <Text style={styles.buttonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

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

  // Show loading while creating appointment
  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Booking your appointment...
            </Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <AppHeader title="Appointment Confirmation" showBack={true} />

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >


          {/* Confirmation Card */}
          <View style={[styles.confirmationCard, { backgroundColor: theme.colors.surface }]}>
            {/* Success Icon */}
            <View style={[styles.successIconCircle, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={56} color="#FFFFFF" />
            </View>

            <Text style={[styles.confirmationTitle, { color: theme.colors.text }]}>
              {isReschedule ? 'Appointment Rescheduled!' : 'Appointment Booked!'}
            </Text>
            <Text style={[styles.confirmationMessage, { color: theme.colors.textSecondary }]}>
              {isReschedule ? 'Your appointment time has been updated.' : 'Your appointment has been successfully scheduled.'}
            </Text>

            <View style={[styles.appointmentDetails, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F5F5F5' }]}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <View style={[styles.detailIconCircle, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="person" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{roleLabel}</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {supportWorkerName || `Auto-assigned by ${orgShortLabel}`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <View style={[styles.detailIconCircle, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="calendar" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Date</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {selectedDateDisplay || selectedDate}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <View style={[styles.detailIconCircle, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="time" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Time</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {selectedTime}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <View style={[styles.detailIconCircle, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="videocam" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Session Type</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {selectedType}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => router.replace("/(app)/(tabs)/appointments/appointment-list")}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>View My Appointments</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF', borderColor: '#4CAF50', borderWidth: 1 }]}
              onPress={() => router.replace("/appointments/book")}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="add-circle" size={20} color="#4CAF50" />
                <Text style={[styles.secondaryButtonText, { color: '#4CAF50' }]}>
                  Book Another Appointment
                </Text>
              </View>
            </TouchableOpacity>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: scaledFontSize(18),
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
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
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemTextDisabled: {},
  signOutText: {
    fontWeight: "600",
  },
  pageTitle: {
    fontSize: scaledFontSize(24),
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    marginTop: 16,
  },
  confirmationCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: scaledFontSize(24),
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmationMessage: {
    fontSize: scaledFontSize(16),
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  appointmentDetails: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: scaledFontSize(12),
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
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
});
