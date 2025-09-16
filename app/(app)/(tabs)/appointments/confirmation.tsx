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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";

/**
 * ConfirmAppointment Component
 *
 * Final confirmation screen that shows after successfully booking an appointment.
 * Displays appointment details, confirmation message, and navigation options
 * to view appointments or book another. Features an elegant curved background.
 */
export default function ConfirmAppointment() {
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [activeView, setActiveView] = useState("confirmation");

  // Get support worker ID from navigation params
  const { supportWorkerId } = useLocalSearchParams();

  // Mock data for support workers (replaces backend data)
  const supportWorkers = [
    {
      id: 1,
      name: "Eric Young",
      title: "Support worker",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      specialties: ["Anxiety", "Depression", "Trauma"],
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "Support worker",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
      specialties: ["Anxiety", "Depression", "Trauma"],
    },
  ];

  // Find the support worker based on the ID from the URL
  const supportWorker = supportWorkers.find(
    (sw) => sw.id === Number(supportWorkerId)
  );

  // Mock user data (replaces backend auth context)
  const mockUser = {
    displayName: "Demo User",
    email: "demo@gmail.com",
  };

  const mockProfile = {
    firstName: "Demo",
    lastName: "User",
  };

  // Show error if support worker not found
  if (!supportWorker) {
    return (
      <CurvedBackground>
        <SafeAreaView style={styles.container}>
          <Text style={styles.errorText}>Support worker not found</Text>
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

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </CurvedBackground>
    );
  }

  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      supportWorker: "Eric Young",
      date: "October 07, 2025",
      time: "10:30 AM",
      type: "Video",
      status: "upcoming",
    },
  ];

  const appointment = appointments.length > 0 ? appointments[0] : null;

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Appointment Confirmation" showBack={true} />

        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.title}>
            Schedule a session with a support worker
          </Text>

          {/* Step Indicator - Shows progress through booking process */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepRow}>
              {/* Step 1 - Inactive */}
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepConnector} />

              {/* Step 2 - Inactive */}
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepConnector} />

              {/* Step 3 - Inactive */}
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepConnector} />

              {/* Step 4 - Active (Final Step) */}
              <View style={[styles.stepCircle, styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, styles.stepNumberActive]}>
                  4
                </Text>
              </View>
            </View>
          </View>

          {/* Confirmation Card */}
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationTitle}>Appointment Booked</Text>
            <Text style={styles.confirmationMessage}>
              Your appointment has been successfully scheduled.
            </Text>

            <View style={styles.appointmentDetails}>
              {/* Support Worker Details */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Support Worker:</Text>
                <Text style={styles.detailValue}>
                  {appointment ? appointment.supportWorker : ""}
                </Text>
              </View>

              {/* Appointment Date */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {appointment ? `${appointment.date}` : ""}
                </Text>
              </View>

              {/* Appointment Time */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>
                  {appointment ? `${appointment.time}` : ""}
                </Text>
              </View>

              {/* Session Type */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Session Type:</Text>
                <Text style={styles.detailValue}>
                  {appointment ? appointment.type : ""}
                </Text>
              </View>

              {/* Primary Action Button - View Appointments */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace("/appointments/appointment-list")}
              >
                <Text style={styles.buttonText}>Check Appointments</Text>
              </TouchableOpacity>

              {/* Secondary Action Button - Book Another Appointment */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace("/appointments/book")}
              >
                <Text style={styles.secondaryButtonText}>
                  Book Another Appointment
                </Text>
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
  errorText: {
    fontSize: 18,
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
    fontSize: 16,
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
  confirmationCard: {
    backgroundColor: "#f1f5f9",
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
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmationMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  appointmentDetails: {
    width: "100%",
    backgroundColor: "#F8F9FA",
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
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
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
    fontSize: 16,
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
});
