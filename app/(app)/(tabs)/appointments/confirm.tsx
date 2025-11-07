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
import settingsAPI from "../../../../utils/settingsApi";
import Constants from 'expo-constants';
import { ConvexReactClient } from "convex/react";
import { useConvexAppointments } from "../../../../utils/hooks/useConvexAppointments";

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
  const { signOut, getToken } = useAuth();
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
    createAppointment: createConvexAppointment,
    updateAppointmentStatus,
    isUsingConvex,
  } = useConvexAppointments(user?.id, convexClient);

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
    appointmentTime: string,
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
      const settings = await settingsAPI.fetchSettings(user.id);
      if (!settings.appointmentReminderEnabled) {
        console.log('📅 Appointment reminders are disabled in settings');
        return;
      }

      const advanceMinutes = settings.appointmentReminderAdvanceMinutes || 60;
      
      // Parse appointment datetime
      const { hour, minute } = parseTimeTo24h(appointmentTime);
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
            appointmentTime,
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
    }, [user?.id, parseTimeTo24h]);

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
    if (!user?.id || !supportWorkerId || appointmentCreated) {
      return;
    }

    try {
      setLoading(true);
      console.log('📅 Creating appointment in database...');

      // Convert session type to match backend format
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

      // Normalize time to HH:MM:SS for DB compatibility
      const normalizedTime = toHHMMSS(selectedTime);

      // Convex-first: Try to create appointment via Convex
      if (isUsingConvex && createConvexAppointment) {
        try {
          console.log('📤 Creating appointment via Convex...');
          const chosenIdRaw = backendWorkerIdParam || supportWorkerId;
          const workerIdInt = parseInt(chosenIdRaw);
          if (!Number.isFinite(workerIdInt)) {
            throw new Error(`Invalid support worker id: ${chosenIdRaw}`);
          }
          
          // Format data to match hook's expected parameter structure
          const convexAppointmentData = {
            supportWorker: supportWorkerName,
            date: selectedDate,
            time: normalizedTime,
            type: sessionType,
            notes: 'Booked via mobile app',
          };

          const result = await createConvexAppointment(convexAppointmentData);
          console.log('✅ Convex appointment created:', result);
          
          setAppointmentCreated(true);
          // For Convex, we don't get back an ID immediately, but the appointment is created
          
          // Schedule appointment reminder notification 1 hour before
          try {
            await scheduleAppointmentReminder(selectedDate, selectedTime, supportWorkerName);
          } catch (reminderError) {
            console.warn('⚠️ Failed to schedule appointment reminder:', reminderError);
          }
          
          return; // Success - exit early
        } catch (convexError) {
          console.warn('⚠️ Convex appointment creation failed, falling back to REST:', convexError);
          // Continue to REST API fallback
        }
      }

      // REST API fallback
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

      // Be backward-compatible with different backend schemas
      const chosenIdRaw = backendWorkerIdParam || supportWorkerId;
      const workerIdInt = parseInt(chosenIdRaw);
      if (!Number.isFinite(workerIdInt)) {
        throw new Error(`Invalid support worker id: ${chosenIdRaw}`);
      }
      const appointmentData: any = {
        clerkUserId: user.id,
        supportWorkerId: workerIdInt,                    // camelCase
        support_worker_id: workerIdInt,                  // snake_case (Prisma schema)
        workerId: workerIdInt,                           // legacy schema
        worker_id: workerIdInt,                          // legacy snake_case
        supportWorkerName, // helpful on older DBs without support_worker_id column
        supportWorkerEmail: supportWorkerEmail || undefined,
        support_worker_email: supportWorkerEmail || undefined,
        appointmentDate: selectedDate,
        appointment_date: selectedDate,                  // snake_case alternative
        appointmentTime: normalizedTime,
        appointment_time: normalizedTime,                // snake_case alternative
        time: normalizedTime,                            // some backends expect 'time'
        sessionType: sessionType,
        session_type: sessionType,                       // snake_case alternative
        notes: 'Booked via mobile app',
        duration: 60
      };

      console.log('📤 Sending appointment data:', appointmentData);

      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();
      console.log('📥 Create appointment response:', result);

      if (result.success || response.ok) {
        setAppointmentCreated(true);
        setAppointmentId(result.appointment?.id);
        console.log('✅ Appointment created successfully!');
        
        // Schedule appointment reminder notification 1 hour before
        try {
          await scheduleAppointmentReminder(selectedDate, selectedTime, supportWorkerName);
        } catch (reminderError) {
          console.warn('⚠️ Failed to schedule appointment reminder:', reminderError);
          // Don't fail the whole appointment if reminder scheduling fails
        }
      } else {
        console.error('❌ Failed to create appointment:', result);
        const details = (result && result.details) ? String(result.details) : '';
        if (details.includes('appointments_worker_id_fkey')) {
          showStatusModal(
            'error',
            'Support worker unavailable',
            'This support worker isn\'t configured on the server yet (missing worker record). Please select a different support worker for now.'
          );
        } else {
          showStatusModal('error', 'Booking Failed', result.error || 'Failed to create appointment');
        }
      }
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      showStatusModal('error', 'Booking Failed', 'Unable to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
    }, [user?.id, supportWorkerId, supportWorkerName, backendWorkerIdParam, supportWorkerEmail, appointmentCreated, selectedType, selectedDate, selectedTime, showStatusModal, toHHMMSS, scheduleAppointmentReminder, isUsingConvex, createConvexAppointment]);

    /**
     * Reschedule an existing appointment
     */
    const rescheduleAppointment = useCallback(async () => {
      if (!user?.id || !rescheduleAppointmentId) return;
      try {
        setLoading(true);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
        const normalizedTime = toHHMMSS(selectedTime);
        const payload = {
          newDate: selectedDate,
          newTime: normalizedTime,
          reason: `Rescheduled via app by user ${user.id}`,
        };
        const response = await fetch(`${API_URL}/api/appointments/${rescheduleAppointmentId}/reschedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setAppointmentCreated(true);
          setAppointmentId(result.appointment?.id || Number(rescheduleAppointmentId));
          // Re-schedule reminder for the new time
          try {
            await scheduleAppointmentReminder(selectedDate, selectedTime, supportWorkerName);
          } catch (e) {
            console.warn('⚠️ Failed to schedule reminder after reschedule:', e);
          }
        } else {
          showStatusModal('error', 'Reschedule Failed', result.error || 'Unable to reschedule appointment.');
        }
      } catch (e) {
        console.error('Reschedule error:', e);
        showStatusModal('error', 'Reschedule Failed', 'Unable to reschedule appointment. Please try again.');
      } finally {
        setLoading(false);
      }
    }, [user?.id, rescheduleAppointmentId, selectedDate, selectedTime, toHHMMSS, scheduleAppointmentReminder, supportWorkerName, showStatusModal]);

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
    } else if (supportWorkerId) {
      // Create a new appointment
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
  if (!supportWorkerName || !selectedDate || !selectedTime) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Booking your appointment...
        </Text>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Appointment Confirmation" showBack={true} />

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Schedule a session with a support worker
          </Text>

          {/* Step Indicator */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>1</Text>
              </View>
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

              <View style={[styles.stepCircle, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>2</Text>
              </View>
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

              <View style={[styles.stepCircle, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>3</Text>
              </View>
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

              <View style={[styles.stepCircle, styles.stepCircleActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                <Text style={[styles.stepNumber, styles.stepNumberActive]}>4</Text>
              </View>
            </View>
          </View>

          {/* Confirmation Card */}
          <View style={[styles.confirmationCard, { backgroundColor: theme.colors.surface }]}>
            {/* Success Icon */}
            <View style={[styles.successIcon, { backgroundColor: theme.colors.successLight || '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={64} color={theme.colors.success || '#4CAF50'} />
            </View>

            <Text style={[styles.confirmationTitle, { color: theme.colors.primary }]}>
              {isReschedule ? 'Appointment Rescheduled!' : 'Appointment Booked!'}
            </Text>
            <Text style={[styles.confirmationMessage, { color: theme.colors.textSecondary }]}>
              {isReschedule ? 'Your appointment time has been updated.' : 'Your appointment has been successfully scheduled.'}
            </Text>

            <View style={[styles.appointmentDetails, { backgroundColor: theme.colors.background }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Support Worker:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {supportWorkerName}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Date:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {selectedDateDisplay || selectedDate}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Time:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {selectedTime}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Session Type:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {selectedType}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.replace("/appointments/appointment-list")}
            >
              <Text style={styles.buttonText}>View My Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
              onPress={() => router.replace("/appointments/book")}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                Book Another Appointment
              </Text>
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
  title: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
    marginTop: 16,
  },
  stepsContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {},
  stepNumber: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  stepNumberActive: {
    color: "white",
  },
  stepConnector: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  confirmationCard: {
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 15,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  detailValue: {
    fontSize: scaledFontSize(16),
    fontWeight: "500",
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
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
