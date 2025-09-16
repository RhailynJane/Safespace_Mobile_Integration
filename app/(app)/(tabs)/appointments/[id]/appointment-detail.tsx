import { useState } from "react";
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
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";

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
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const { id } = useLocalSearchParams();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Mock user data 
  const mockUser = {
    displayName: "Demo User",
    email: "demo@gmail.com",
  };
  
  const mockProfile = {
    firstName: "Demo",
    lastName: "User",
  };

  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      supportWorker: "Eric Young",
      date: "October 07, 2025",
      time: "10:30 AM",
      type: "Video",
      status: "Upcoming",
      meetingLink: "https://meet.google.com/knr-pkav-xpt",
    },
  ];

  // Find the appointment based on the ID from the URL
  const appointment = appointments.find((appt) => appt.id === Number(id));

  // Show error if appointment not found
  if (!appointment) {
    return (
      <CurvedBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#4CAF50" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Appointment Details</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>Appointment not found</Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  /**
   * Handles navigation to video consultation screen
   */
  const handleJoinSession = () => {
    router.push("/video-consultations");
  };

  /**
   * Opens reschedule modal
   */
  const handleReschedule = () => {
    setRescheduleModalVisible(true);
  };

  /**
   * Opens cancellation confirmation modal
   */
  const handleCancel = () => {
    setCancelModalVisible(true);
  };

  /**
   * Confirms appointment cancellation
   * Simulates API call with timeout
   */
  const confirmCancel = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCancelModalVisible(false);
      Alert.alert("Success", "Your appointment has been cancelled");
      router.back();
    }, 1500);
  };

  /**
   * Confirms appointment rescheduling
   * Validates time slot selection and simulates API call
   */
  const confirmReschedule = () => {
    if (!selectedTimeSlot) {
      Alert.alert(
        "Selection Required",
        "Please select a time slot to reschedule your appointment."
      );
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setRescheduleModalVisible(false);
      Alert.alert("Success", "Your appointment has been rescheduled");
      setSelectedTimeSlot(null);
      router.back();
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
        router.push("/journaling");
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
      onPress: async () => {
        setSideMenuVisible(false);
        // Mock logout functionality
        console.log("User signed out");
      },
    },
  ];

  /**
   * Gets display name from available user data
   * @returns String with user's display name or fallback
   */
  const getDisplayName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    if (mockUser?.email) return mockUser.email.split("@")[0];
    return "User";
  };

  return (
  <CurvedBackground>
      <SafeAreaView style={styles.container}>
          <AppHeader title="Appointment Details" showBack={true} />

        <ScrollView style={styles.content}>
          {/* Appointment Card */}
          <View style={styles.appointmentCard}>
            <Text style={styles.supportWorkerName}>
              {appointment.supportWorker}
            </Text>

            {/* Appointment Details */}
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{appointment.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{appointment.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="videocam-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{appointment.type} Session</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#666"
              />
              <Text style={styles.detailText}>
                Status: {appointment.status}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Join Session Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleJoinSession}
            >
              <Ionicons name="videocam" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Join Session</Text>
            </TouchableOpacity>

            {/* Reschedule Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReschedule}
            >
              <Ionicons name="calendar" size={20} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Reschedule</Text>
            </TouchableOpacity>

            {/* Cancel Appointment Button */}
            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle" size={20} color="#F44336" />
              <Text style={styles.tertiaryButtonText}>Cancel Appointment</Text>
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
                <View style={styles.confirmationModalContent}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="close-circle" size={48} color="#F44336" />
                  </View>
                  <Text style={styles.modalTitle}>Cancel Appointment?</Text>
                  <Text style={styles.modalText}>
                    Are you sure you want to cancel your session with{" "}
                    {appointment.supportWorker} on {appointment.date}?
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancelButton]}
                      onPress={() => setCancelModalVisible(false)}
                    >
                      <Text style={styles.modalCancelButtonText}>
                        Keep Appointment
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalConfirmButton]}
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

          {/* Reschedule Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={rescheduleModalVisible}
            onRequestClose={() => setRescheduleModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setRescheduleModalVisible(false)}
            >
              <View style={styles.blurContainer}>
                <View style={styles.confirmationModalContent}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="calendar" size={48} color="#4CAF50" />
                  </View>
                  <Text style={styles.modalTitle}>Reschedule Appointment</Text>
                  <Text style={styles.modalText}>
                    Select a new date and time for your session with{" "}
                    {appointment.supportWorker}.
                  </Text>

                  {/* Available Time Slots */}
                  <View style={styles.rescheduleOptions}>
                    <Text style={styles.rescheduleHint}>
                      Available time slots:
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.timeSlot,
                        selectedTimeSlot === "slot1" && styles.selectedTimeSlot,
                      ]}
                      onPress={() => setSelectedTimeSlot("slot1")}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTimeSlot === "slot1" &&
                            styles.selectedTimeSlotText,
                        ]}
                      >
                        October 08, 2025 at 2:00 PM
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.timeSlot,
                        selectedTimeSlot === "slot2" && styles.selectedTimeSlot,
                      ]}
                      onPress={() => setSelectedTimeSlot("slot2")}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTimeSlot === "slot2" &&
                            styles.selectedTimeSlotText,
                        ]}
                      >
                        October 09, 2025 at 11:00 AM
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.timeSlot,
                        selectedTimeSlot === "slot3" && styles.selectedTimeSlot,
                      ]}
                      onPress={() => setSelectedTimeSlot("slot3")}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTimeSlot === "slot3" &&
                            styles.selectedTimeSlotText,
                        ]}
                      >
                        October 10, 2025 at 4:30 PM
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancelButton]}
                      onPress={() => setRescheduleModalVisible(false)}
                    >
                      <Text style={styles.modalCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalConfirmButton]}
                      onPress={confirmReschedule}
                    >
                      <Text style={styles.modalConfirmButtonText}>
                        Confirm Reschedule
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Pressable>
          </Modal>
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
            <View style={styles.sideMenu}>
              <View style={styles.sideMenuHeader}>
                <Text style={styles.profileName}>{getDisplayName()}</Text>
                <Text style={styles.profileEmail}>{mockUser?.email}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sideMenuItem}
                    onPress={item.onPress}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.sideMenuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
  },
  title: {
    fontSize: 15,
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
    backgroundColor: "transparent",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
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
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
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
    fontSize: 18,
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
    fontSize: 17,
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
    fontSize: 13,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
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
    fontSize: 14,
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
    fontSize: 14,
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
