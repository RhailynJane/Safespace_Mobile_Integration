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
import { useConvex } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

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

  // Shared Convex instance
  const convex = useConvex();

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

      // Create appointment via Convex
      try {
        await convex.mutation(api.appointments.createAppointment, {
          userId: user.id,
          supportWorker: supportWorkerName,
          supportWorkerId: parseInt(supportWorkerId) || undefined,
          date: selectedDate,
          time: selectedTime,
          type: sessionType,
          notes: 'Booked via mobile app',
        });
        setAppointmentCreated(true);
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
  }, [user?.id, supportWorkerId, supportWorkerName, appointmentCreated, selectedType, selectedDate, selectedTime, showStatusModal, convex]);

  // Create appointment when page loads
  useEffect(() => {
    if (user?.id && supportWorkerId && !appointmentCreated) {
      createAppointment();
    }
  }, [user?.id, supportWorkerId, appointmentCreated, createAppointment]);

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

            <Text style={[styles.confirmationTitle, { color: theme.colors.primary }]}>Appointment Booked!</Text>
            <Text style={[styles.confirmationMessage, { color: theme.colors.textSecondary }]}>
              Your appointment has been successfully scheduled.
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
                  {selectedDate}
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