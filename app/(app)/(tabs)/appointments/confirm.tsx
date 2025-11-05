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

/**
 * ConfirmAppointment Component
 *
 * Appointment confirmation screen that allows users to review booking details,
 * add optional notes for the support worker, and confirm their appointment.
 * Features a multi-step progress indicator and elegant curved background.
 */

interface SupportWorker {
  id: number;
  name: string;
  title: string;
  avatar: string;
  specialties: string[];
}

export default function ConfirmAppointment() {
  const { theme, scaledFontSize } = useTheme();
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointmentNotes, setAppointmentNotes] = useState<string>("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [supportWorker, setSupportWorker] = useState<SupportWorker | null>(null);

  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Get params from navigation
  const { supportWorkerId, selectedType, selectedDate, selectedTime } = useLocalSearchParams();

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
   * Fetch support worker details from API
   */
  const fetchSupportWorker = async () => {
    try {
      setLoading(true);
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/support-workers/${supportWorkerId}`);
      const result = await response.json();

      if (result.success) {
        const worker = result.data;
        setSupportWorker({
          id: worker.id,
          name: `${worker.first_name} ${worker.last_name}`,
          title: "Support Worker",
          avatar: worker.avatar_url || "https://via.placeholder.com/150",
          specialties: worker.specialization 
            ? worker.specialization.split(',').map((s: string) => s.trim())
            : [],
        });
      } else {
        showStatusModal('error', 'Error', 'Failed to load support worker details');
      }
    } catch (error) {
      console.error('Error fetching support worker:', error);
      showStatusModal('error', 'Error', 'Unable to fetch support worker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch support worker on mount
  useEffect(() => {
    if (supportWorkerId) {
      fetchSupportWorker();
    }
  }, [supportWorkerId]);

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
   * Handles navigation to confirmation success screen
   * Passes appointment details as navigation parameters
   */
  const handleConfirmBooking = () => {
    if (!supportWorker) return;
    
    router.replace({
      pathname: "/appointments/confirmation",
      params: {
        supportWorkerId: supportWorker.id,
        supportWorkerName: supportWorker.name,
        selectedType: selectedType || "Video Call",
        selectedDate: selectedDate || "",
        selectedTime: selectedTime || "",
      },
    });
  };

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
          <AppHeader title="Confirm Appointment" showBack={true} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Support worker not found
          </Text>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Confirm Appointment" showBack={true} />

        <ScrollView style={styles.scrollContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Schedule a session with a support worker
          </Text>

          {/* Step Indicator - Shows progress through booking process */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepRow}>
              {/* Step 1 - Inactive */}
              <View style={[styles.stepCircle, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>1</Text>
              </View>
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

              {/* Step 2 - Inactive */}
              <View style={[styles.stepCircle, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>2</Text>
              </View>
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

              {/* Step 3 - Active (Current Step) */}
              <View style={[styles.stepCircle, styles.stepCircleActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                <Text style={[styles.stepNumber, styles.stepNumberActive]}>
                  3
                </Text>
              </View>
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

              {/* Step 4 - Inactive */}
              <View style={[styles.stepCircle, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>4</Text>
              </View>
            </View>
          </View>

          {/* Booking Details Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Booking Details</Text>
            <Text style={[styles.subSectionTitle, { color: theme.colors.text }]}>Appointment Summary</Text>

            <View style={styles.summaryContainer}>
              {/* Support Worker Details */}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>Support Worker:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.textSecondary }]}>
                  {supportWorker.name}
                </Text>
              </View>

              {/* Appointment Date */}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>Date:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.textSecondary }]}>
                  {selectedDate || 'Not selected'}
                </Text>
              </View>

              {/* Appointment Time */}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>Time:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.textSecondary }]}>
                  {selectedTime || 'Not selected'}
                </Text>
              </View>

              {/* Session Type */}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>Session Type:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.textSecondary }]}>
                  {selectedType || 'Video Call'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Optional Notes Section */}
            <Text style={[styles.subSectionTitle, { color: theme.colors.text }]}>
              Notes for Support Worker (Optional)
            </Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
              multiline
              numberOfLines={4}
              placeholder="Share any specific concerns or topics you'd like to discuss..."
              placeholderTextColor={theme.colors.textDisabled}
              value={appointmentNotes}
              onChangeText={setAppointmentNotes}
            />

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {/* Back Button */}
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
                onPress={() => router.back()}
              >
                <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>Back</Text>
              </TouchableOpacity>

              {/* Confirm Booking Button */}
              <TouchableOpacity
                style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleConfirmBooking}
              >
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
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
    borderColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  stepCircleActive: {
    backgroundColor: "#4CAF50",
  },
  stepNumber: {
    fontSize: scaledFontSize(16),
    color: "#4CAF50",
    fontWeight: "600",
  },
  stepNumberActive: {
    color: "white",
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: "#000000",
    marginHorizontal: 8,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: "#f1f5f9",
  },
  cardTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  subSectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: scaledFontSize(14),
    color: "#000000",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: scaledFontSize(14),
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#000000",
    marginVertical: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    padding: 16,
    textAlignVertical: "top",
    marginBottom: 20,
    minHeight: 100,
    fontSize: scaledFontSize(14),
    backgroundColor: "white",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    alignItems: "center",
    backgroundColor: "white",
  },
  backButtonText: {
    color: "#4CAF50",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  bookButton: {
    flex: 2,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#FFFFFF",
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
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    color: "#333",
    marginLeft: 15,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
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