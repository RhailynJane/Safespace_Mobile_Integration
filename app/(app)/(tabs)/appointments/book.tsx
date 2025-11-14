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
  Alert,
} from "react-native";
import { Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../../contexts/ThemeContext";
import activityApi from "../../../../utils/activityApi";
import StatusModal from "../../../../components/StatusModal";
// CMHA flow: user is auto-assigned to an available support worker.
// This screen focuses on selecting date, time and session type (no worker browsing).

/**
 * BookAppointment Component
 *
 * Initial screen for booking appointments that allows users to:
 * - Browse available support workers
 * - Search for specific support workers
 * - View support worker specialties and profiles
 * - Select a support worker to proceed with booking
 * Features an elegant curved background and intuitive interface.
 */

export default function BookAppointment() {
  const { theme, scaledFontSize } = useTheme();
  const windowWidth = Dimensions.get("window").width;
  const COLUMNS = 4;
  const H_MARGIN = 6; // must match styles.timeSlot margin horizontal
  const PAD_H = 12; // must match styles.timeGrid paddingHorizontal
  const slotWidth = Math.floor((windowWidth - PAD_H * 2 - H_MARGIN * 2 * COLUMNS) / COLUMNS);
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [isSigningOut, setIsSigningOut] = useState(false);
  // Booking selections
  const [selectedType, setSelectedType] = useState<'video' | 'in_person'>('video');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Get reschedule params if rescheduling
  const params = useLocalSearchParams();
  const isReschedule = params.reschedule === '1' || params.reschedule === 'true';
  const appointmentId = params.appointmentId as string | undefined;

  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

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

  // Build next 14 days for quick selection. If all slots for today are past (after 4:30 PM), skip today.
  const days = useMemo(() => {
    const list: { iso: string; label: string; weekday: string }[] = [];
    const now = new Date();
    const includeToday = now.getHours() < 16 || (now.getHours() === 16 && now.getMinutes() < 30);
    const startOffset = includeToday ? 0 : 1;
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i + startOffset);
      const iso = d.toISOString().split('T')[0]!;
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const label = d.getDate().toString();
      list.push({ iso, label, weekday });
    }
    return list;
  }, []);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ];

  const parseTimeTo24h = (time: string) => {
    const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return { hour: 0, minute: 0 };
    let hour = Number(m[1]);
    const minute = Number(m[2]);
    const ampm = (m[3] || 'AM').toUpperCase();
    if (ampm === 'AM') { if (hour === 12) hour = 0; } else { if (hour !== 12) hour += 12; }
    return { hour, minute };
  };

  const isPastSlot = (isoDate: string, label: string) => {
    const now = new Date();
    const [y, m, d] = isoDate.split('-').map(Number);
    if (!y || !m || !d) return true;
    const slot = new Date(y, m - 1, d);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (slot.getTime() > today.getTime()) return false;
    if (slot.getTime() < today.getTime()) return true;
    const { hour, minute } = parseTimeTo24h(label);
    if (hour < now.getHours()) return true;
    if (hour > now.getHours()) return false;
    return minute <= now.getMinutes();
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;
    const typeLabel = selectedType === 'in_person' ? 'in-person' : 'video';
    router.push({
      pathname: '/appointments/confirm',
      params: {
        selectedDate: selectedDate,
        selectedTime: selectedTime,
        selectedType: typeLabel,
        supportWorkerName: 'Auto-assigned by CMHA',
        reschedule: isReschedule ? '1' : undefined,
        appointmentId: isReschedule ? appointmentId : undefined,
      },
    } as any);
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

      // Record logout activity
      if (user?.id) {
        try {
          await activityApi.recordLogout(user.id);
        } catch (_e) {
          // Continue with logout even if tracking fails
        }
      }

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

  // Show loading indicator if any background work
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
        <AppHeader title="Book Appointment" showBack={true} />

        <ScrollView 
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title */}
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>
            Book Your Session
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Choose a date and time. A support worker will be assigned automatically.
          </Text>

          {/* Session type */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Session Type</Text>
          <View style={styles.sessionTypeRow}>
            {[{ key: 'video', icon: 'videocam', label: 'Video', color: '#9C27B0' }, { key: 'in_person', icon: 'pin', label: 'In person', color: '#4CAF50' }].map((opt: any) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sessionTypeCard,
                  { backgroundColor: selectedType === opt.key ? opt.color : '#F5F5F5' }
                ]}
                onPress={() => setSelectedType(opt.key)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.sessionIconCircle,
                  { backgroundColor: selectedType === opt.key ? 'rgba(255,255,255,0.3)' : '#FFF' }
                ]}>
                  <Ionicons name={opt.icon as any} size={24} color={selectedType === opt.key ? '#FFF' : opt.color} />
                </View>
                <Text style={[styles.sessionTypeLabel, { color: selectedType === opt.key ? '#FFF' : '#333' }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Day selector */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {days.map((d) => (
              <TouchableOpacity
                key={d.iso}
                style={[
                  styles.dayCard,
                  selectedDate === d.iso && styles.dayCardSelected
                ]}
                onPress={() => { setSelectedDate(d.iso); setSelectedTime(null); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayWeekday, selectedDate === d.iso && styles.dayWeekdaySelected]}>{d.weekday}</Text>
                <Text style={[styles.dayNumber, selectedDate === d.iso && styles.dayNumberSelected]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time slots */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Time</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((t) => {
              const disabled = !selectedDate || isPastSlot(selectedDate, t);
              const active = selectedTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  disabled={disabled}
                  onPress={() => setSelectedTime(t)}
                  style={[
                    styles.timeSlot,
                    { width: slotWidth },
                    active && styles.timeSlotActive,
                    disabled && styles.timeSlotDisabled
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.timeSlotText,
                    active && styles.timeSlotTextActive,
                    disabled && styles.timeSlotTextDisabled
                  ]} numberOfLines={2}>{t.replace(' ', '\n')}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedDate && selectedTime && (
            <View style={styles.selectionSummary}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.selectionText}>
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, {selectedTime} • {selectedType === 'in_person' ? 'In person' : 'Video'}
              </Text>
            </View>
          )}

          {/* Continue button */}
          <TouchableOpacity
            disabled={!selectedDate || !selectedTime}
            onPress={handleContinue}
            style={[
              styles.continueButton,
              (!selectedDate || !selectedTime) && styles.continueButtonDisabled
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue to Confirmation</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
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
                    key={item.title}
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
  menuProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
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
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
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
  title: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
    marginTop: 16,
  },
  pageTitle: {
    fontSize: scaledFontSize(24),
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: scaledFontSize(14),
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
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
  stepCircleActive: {
  },
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
  sessionTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  sessionTypeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sessionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTypeLabel: {
    fontSize: scaledFontSize(14),
    fontWeight: '700',
  },
  sessionTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#00000000',
  },
  sessionTypeChipText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  dayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardSelected: {
    backgroundColor: '#FF9800',
  },
  dayWeekday: {
    fontSize: scaledFontSize(12),
    color: '#999',
    marginBottom: 4,
  },
  dayWeekdaySelected: {
    color: '#FFF',
  },
  dayNumber: {
    fontSize: scaledFontSize(18),
    fontWeight: '700',
    color: '#333',
  },
  dayNumberSelected: {
    color: '#FFF',
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    minWidth: 64,
  },
  dayChipWeekday: {
    fontSize: scaledFontSize(12),
  },
  dayChipLabel: {
    fontSize: scaledFontSize(16),
    fontWeight: '700',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  timeSlot: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  timeSlotActive: {
    backgroundColor: '#4CAF50',
  },
  timeSlotDisabled: {
    opacity: 0.4,
  },
  timeSlotText: {
    fontSize: scaledFontSize(13),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: scaledFontSize(16),
  },
  timeSlotTextActive: {
    color: '#FFF',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  selectionText: {
    fontSize: scaledFontSize(14),
    color: '#2E7D32',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#C8E6C9',
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: scaledFontSize(16),
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
});