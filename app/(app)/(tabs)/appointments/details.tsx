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
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Pressable,
  ActivityIndicator,
  Image,
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
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useBottomNavTabs } from "../../../../utils/hooks/useBottomNavTabs";

/**
 * BookAppointment Component
 *
 * Screen for booking appointments with support workers. Allows users to:
 * - Select session type (Video Call, Phone Call, In Person)
 * - Choose available dates and times
 * - View support worker details
 * - Navigate to confirmation screen
 * Features a multi-step process with visual indicators and elegant curved background.
 */

interface SupportWorker {
  id: string | number;
  name: string;
  title: string;
  avatar: string;
  specialties: string[];
  backendWorkerId?: number; // optional: FK-friendly id from backend (e.g., worker_id or user_id)
  email?: string;
}

export default function BookAppointment() {
  const { theme, scaledFontSize } = useTheme();
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedType, setSelectedType] = useState("Video Call");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [supportWorker, setSupportWorker] = useState<SupportWorker | null>(null);

  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // Use shared Convex client from provider
  const convex = useConvex();

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Get support worker ID from navigation params
  const { supportWorkerId, reschedule, appointmentId } = useLocalSearchParams();

  // Mountain Time helpers (America/Denver)
  const getNowInMountain = () => {
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
      month: get('month'), // 1-12
      day: get('day'),
      hour: get('hour'), // 00-23
      minute: get('minute'),
    };
  };

  const parseTimeTo24h = (time: string) => {
    // Expects formats like "9:00 AM" | "10:30 PM"
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
  };

  const isPastInMountain = (isoDate: string, timeLabel: string) => {
    const now = getNowInMountain();
    const [yStr, mStr, dStr] = isoDate.split('-');
    const y: number = Number(yStr || '0');
    const m: number = Number(mStr || '0');
    const d: number = Number(dStr || '0');
    if (!y || !m || !d) return true; // invalid date treated as past/invalid
    // Compare date first
    if (y < now.year) return true;
    if (y > now.year) return false;
    if (m < now.month) return true;
    if (m > now.month) return false;
    if (d < now.day) return true;
    if (d > now.day) return false;
    // Same day in Mountain time, compare time
    const { hour, minute } = parseTimeTo24h(timeLabel);
    if (hour < now.hour) return true;
    if (hour > now.hour) return false;
    return minute <= now.minute; // equal minute means now or past -> treat as past/unavailable
  };

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
   * Fetch support worker details from Convex
   */
  const fetchSupportWorker = useCallback(async () => {
    if (!supportWorkerId) return;
    try {
      setLoading(true);
      const worker = await convex.query(api.supportWorkers.getSupportWorker, { workerId: String(supportWorkerId) });
      if (!worker) {
        showStatusModal('error', 'Not found', 'Support worker not found');
        setSupportWorker(null);
        return;
      }
      setSupportWorker({
        id: worker.id,
        name: worker.name,
        title: worker.title,
        avatar: worker.avatar,
        specialties: worker.specialties || [],
        backendWorkerId: typeof worker.id === 'number' ? worker.id : undefined,
        // Email not present in derived worker doc currently
        email: undefined,
      });
    } catch (error) {
      console.error('Error fetching support worker from Convex:', error);
      showStatusModal('error', 'Error', 'Unable to fetch support worker. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [supportWorkerId, convex, showStatusModal]);

  // Fetch support worker on mount and when id changes
  useEffect(() => {
    fetchSupportWorker();
  }, [fetchSupportWorker]);

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
  // Bottom navigation tabs with feature access filtering
  const tabs = useBottomNavTabs();

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

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </CurvedBackground>
    );
  }

  // Show error if support worker not found
  if (!supportWorker) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Book Appointment" showBack={true} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Support worker not found
          </Text>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  // Available session types
  const SESSION_TYPES = ["Video Call", "Phone Call", "In Person"];

  // Generate dates for the current week (starting from today in Mountain Time)
  const generateCurrentWeekDates = () => {
    const dates = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Get current date in Mountain Time
    const now = new Date();
    const mountainParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    
    const get = (type: string) => Number(mountainParts.find(p => p.type === type)?.value || 0);
    const mountainYear = get('year');
    const mountainMonth = get('month') - 1; // JavaScript months are 0-indexed
    const mountainDay = get('day');
    
    // Create today's date in Mountain Time
    const today = new Date(mountainYear, mountainMonth, mountainDay);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = daysOfWeek[date.getDay()];
      const monthName = months[date.getMonth()];
      const dayNumber = date.getDate();
      const year = date.getFullYear();
      
      // Store both display format and ISO format
      const displayDate = `${dayName}, ${monthName} ${dayNumber}, ${year}`;
      // Format as YYYY-MM-DD in Mountain Time (no UTC conversion)
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      
      dates.push({
        display: displayDate,
        iso: isoDate
      });
    }
    
    return dates;
  };

  const AVAILABLE_DATES = generateCurrentWeekDates();

  const AVAILABLE_TIMES = [
    "9:00 AM",
    "10:30 AM",
    "2:00 PM",
    "3:30 PM",
    "5:00 PM",
  ];

  /**
   * Handles navigation to confirmation screen with selected appointment details
   */
  const handleContinue = () => {
    if (!supportWorker) {
      showStatusModal('error', 'Error', 'Please select a support worker');
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      showStatusModal('error', 'Error', 'Please select date and time');
      return;
    }

    // Prevent booking in the past relative to Mountain Time
    if (isPastInMountain(selectedDate, selectedTime)) {
      showStatusModal('error', 'Time not available', 'Selected time is in the past for Mountain Time. Please choose a later time.');
      return;
    }

    // Find the display format for the selected date
    const selectedDateObj = AVAILABLE_DATES.find(d => d.iso === selectedDate);
    const displayDate = selectedDateObj?.display || selectedDate;

    console.log('🚀 Navigating to confirm with:', {
      supportWorkerId: supportWorker.id,
      backendWorkerId: supportWorker.backendWorkerId,
      selectedDate: selectedDate,        // ISO: "2025-11-05"
      selectedDateDisplay: displayDate,  // Display: "Tuesday, November 5, 2025"
      selectedType,
      selectedTime,
      supportWorkerEmail: supportWorker.email,
    });
    
    router.push({
      pathname: "/appointments/confirm",
      params: {
        supportWorkerId: supportWorker.id,
        supportWorkerName: supportWorker.name,
        backendWorkerId: supportWorker.backendWorkerId ?? '',
        supportWorkerEmail: supportWorker.email ?? '',
        selectedType,
        selectedDate: selectedDate || "",           // Pass ISO for DB
        selectedDateDisplay: displayDate || "",     // Pass display for UI
        selectedTime: selectedTime || "",
        // Reschedule context passthrough if present
        reschedule: reschedule ? '1' : undefined,
        appointmentId: appointmentId ? String(appointmentId) : undefined,
      },
    });
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title=" Book Appointments" showBack={true} />

          <ScrollView 
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
          {/* Page Title */}
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>
            Book Your Session
          </Text>

          {/* Support Worker Card with Avatar and Name */}
          <View style={[styles.supportWorkerCard, { backgroundColor: '#FAFAFA' }]}>
            <View style={styles.supportWorkerHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: '#757575' }]}>
                <Image
                  source={{ uri: supportWorker.avatar }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.supportWorkerInfo}>
                <Text style={[styles.supportWorkerName, { color: theme.colors.text }]}>
                  {supportWorker.name}
                </Text>
                <Text style={[styles.supportWorkerTitle, { color: theme.colors.textSecondary }]}>
                  {supportWorker.title}
                </Text>
              </View>
            </View>
          </View>

          {/* Session Type Selection */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Session Type</Text>
          <View style={styles.sessionTypeContainer}>
            {SESSION_TYPES.map((type) => {
              // Determine icon based on session type
              let iconName;
              switch (type) {
                case "Video Call":
                  iconName = "videocam";
                  break;
                case "Phone Call":
                  iconName = "call";
                  break;
                case "In Person":
                  iconName = "person";
                  break;
                default:
                  iconName = "help";
              }

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.sessionTypeButton,
                    { 
                      backgroundColor: selectedType === type ? '#E3F2FD' : '#F5F5F5'
                    },
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <View style={[
                    styles.sessionTypeIconCircle,
                    { backgroundColor: selectedType === type ? '#4CAF50' : '#9E9E9E' }
                  ]}>
                    <Ionicons
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text
                    style={[
                      styles.sessionTypeText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date and Time Selection */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Date</Text>

        {/* Available Dates Card */}
        <View style={[styles.dateCard, { backgroundColor: '#FAFAFA' }]}>
          <View style={styles.datesContainer}>
            {AVAILABLE_DATES.map((dateObj) => (
              <TouchableOpacity
                key={dateObj.iso}
                style={[
                  styles.dateItem,
                  { backgroundColor: selectedDate === dateObj.iso ? '#E8F5E9' : '#F5F5F5' },
                ]}
                onPress={() => {
                  setSelectedDate(dateObj.iso || null);  // Store ISO: "2025-11-05"
                  setSelectedTime(null);
                }}
              >
                <View style={[
                  styles.dateIconCircle,
                  { backgroundColor: selectedDate === dateObj.iso ? '#4CAF50' : '#9E9E9E' }
                ]}>
                  <Ionicons
                    name="calendar"
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                <Text
                  style={[
                    styles.dateText,
                    { color: theme.colors.text },
                  ]}
                >
                  {dateObj.display}  {/* Show: "Tuesday, November 5, 2025" */}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

          {/* Available Times Card (only shown when date is selected) */}
          {selectedDate ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Time</Text>
              <View style={[styles.timeCard, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.timesContainer}>
                  {AVAILABLE_TIMES.map((time) => {
                    const disabled = isPastInMountain(selectedDate, time);
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeItem,
                          { backgroundColor: selectedTime === time && !disabled ? '#4CAF50' : '#F5F5F5' },
                          disabled && styles.timeItemDisabled,
                        ]}
                        onPress={() => !disabled && setSelectedTime(time)}
                        disabled={disabled}
                        accessibilityState={{ disabled }}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            { color: disabled ? theme.colors.textSecondary : (selectedTime === time ? '#FFFFFF' : theme.colors.text) },
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {
                // All times disabled today
                AVAILABLE_TIMES.every(t => isPastInMountain(selectedDate, t)) && (
                  <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                    No times left today in Mountain Time. Please pick another date.
                  </Text>
                )
              }
            </>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Time</Text>
              <View style={[styles.timeCard, { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                  Please select a date first
                </Text>
              </View>
            </>
          )}

          {/* Continue Button (disabled until both date and time are selected) */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: (!selectedDate || !selectedTime) ? '#E0E0E0' : '#4CAF50' },
            ]}
            onPress={handleContinue}
            disabled={!selectedDate || !selectedTime}
          >
            <View style={styles.buttonContent}>
              <Text style={[styles.continueButtonText, { color: (!selectedDate || !selectedTime) ? '#9E9E9E' : '#FFFFFF' }]}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={(!selectedDate || !selectedTime) ? '#9E9E9E' : '#FFFFFF'} />
            </View>
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
                      color={item.disabled ? theme.colors.iconDisabled : theme.colors.primary}
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
  errorText: {
    fontSize: scaledFontSize(18),
    color: "#666",
    textAlign: "center",
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  supportWorkerCard: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: '#757575',
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
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sideMenu: {
    width: "75%",
    backgroundColor: "transparent",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  menuProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
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
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    color: "#333",
    marginLeft: 15,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
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
    borderColor: "#4CAF50",
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  pageTitle: {
    fontSize: scaledFontSize(24),
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 16,
    textAlign: "center",
  },
  supportWorkerNameHeading: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  supportWorkerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  supportWorkerInfo: {
    flex: 1,
  },
  supportWorkerName: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  supportWorkerTitle: {
    fontSize: scaledFontSize(14),
    color: "#666",
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    marginTop: 16,
    marginLeft: 16,
  },
  subSectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  sessionTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 24,
    gap: 8,
  },
  sessionTypeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sessionTypeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: '#4CAF50',
  },
  sessionTypeText: {
    fontSize: scaledFontSize(14),
    color: "#495057",
    textAlign: "center",
  },
  sessionTypeTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  dateCard: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  timeCard: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  datesContainer: {
    gap: 10,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 12,
  },
  dateIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: '#4CAF50',
  },
  dateText: {
    fontSize: scaledFontSize(14),
    color: "#495057",
    flex: 1,
  },
  dateTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  timeItem: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "48%",
    minWidth: 140,
  },
  timeItemDisabled: {
    opacity: 0.4,
  },
  timeText: {
    fontSize: scaledFontSize(14),
    color: "#495057",
  },
  timeTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  placeholderText: {
    fontSize: scaledFontSize(14),
    color: "#6C757D",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
    marginHorizontal: 15,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 50,
    marginBottom: 100,
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
  continueButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemTextDisabled: {
    color: "#CCCCCC",
  },
  signOutText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
});
