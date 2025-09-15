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
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";

/**
 * AppointmentList Component
 * 
 * Screen that displays a list of user's appointments, categorized as:
 * - Upcoming appointments (future scheduled sessions)
 * - Past appointments (completed sessions)
 * Allows users to view appointment details and schedule new appointments.
 * Features an elegant curved background and intuitive interface.
 */
export default function AppointmentList() {
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [activeAppointmentsTab, setActiveAppointmentsTab] = useState<
    "upcoming" | "past"
  >("upcoming");

  // Mock user data 
 const mockUser = {
    displayName: "Demo User",
    email: "demo@gmail.com",
  };
  
  const mockProfile = {
    firstName: "Demo",
    lastName: "User",
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
    {
      id: 2,
      supportWorker: "Michael Chen",
      date: "September 15, 2025",
      time: "2:00 PM",
      type: "Phone",
      status: "past",
    },
  ];

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </CurvedBackground>
    );
  }

  /**
   * Handles navigation to appointment details screen
   * @param appointmentId - ID of the selected appointment
   */
  const handleAppointmentPress = (appointmentId: number) => {
    router.push(
      `/(app)/(tabs)/appointments/${appointmentId}/appointment-detail`
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>My Appointments</Text>
          
          <TouchableOpacity onPress={() => setSideMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* Appointments Tabs - Switch between Upcoming and Past appointments */}
        <View style={styles.appointmentsTabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeAppointmentsTab === "upcoming" && styles.activeTab,
            ]}
            onPress={() => setActiveAppointmentsTab("upcoming")}
          >
            <Text
              style={[
                styles.tabText,
                activeAppointmentsTab === "upcoming" && styles.activeTabText,
              ]}
            >
              Upcoming (
              {appointments.filter((a) => a.status === "upcoming").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeAppointmentsTab === "past" && styles.activeTab,
            ]}
            onPress={() => setActiveAppointmentsTab("past")}
          >
            <Text
              style={[
                styles.tabText,
                activeAppointmentsTab === "past" && styles.activeTabText,
              ]}
            >
              Past ({appointments.filter((a) => a.status === "past").length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appointments List */}
        <ScrollView style={styles.appointmentsContainer}>
          {activeAppointmentsTab === "upcoming" ? (
            appointments.filter((a) => a.status === "upcoming").length > 0 ? (
              appointments
                .filter((a) => a.status === "upcoming")
                .map((appointment) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={styles.appointmentCard}
                    onPress={() => handleAppointmentPress(appointment.id)}
                  >
                    <Text style={styles.supportWorker}>
                      {appointment.supportWorker}
                    </Text>
                    <View style={styles.appointmentDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#666"
                        />
                        <Text style={styles.detailText}>
                          {appointment.date}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {appointment.time}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.sessionType}>
                      <Ionicons name="videocam" size={14} color="#4CAF50" />
                      <Text style={styles.sessionTypeText}>
                        {appointment.type} Session
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#CCC" />
                <Text style={styles.emptyStateText}>
                  No upcoming appointments
                </Text>
              </View>
            )
          ) : appointments.filter((a) => a.status === "past").length > 0 ? (
            appointments
              .filter((a) => a.status === "past")
              .map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentCard}
                  onPress={() => handleAppointmentPress(appointment.id)}
                >
                  <Text style={styles.supportWorker}>
                    {appointment.supportWorker}
                  </Text>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#666"
                      />
                      <Text style={styles.detailText}>{appointment.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{appointment.time}</Text>
                    </View>
                  </View>
                  <View style={styles.sessionType}>
                    <Ionicons name="videocam" size={14} color="#4CAF50" />
                    <Text style={styles.sessionTypeText}>
                      {appointment.type} Session
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No past appointments</Text>
            </View>
          )}
        </ScrollView>

        {/* Schedule New Appointment Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => router.push("/appointments/book")}
          >
            <Ionicons name="add" size={24} color="#FFF" />
            <Text style={styles.scheduleButtonText}>
              Schedule New Appointment
            </Text>
          </TouchableOpacity>
        </View>

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  appointmentsTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  appointmentsContainer: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: "#F2F7F2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  supportWorker: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  sessionType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#cfe2f3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  sessionTypeText: {
    fontSize: 14,
    color: "#2c3e50",
    marginLeft: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  scheduleButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 30,
    marginRight: 25,
    marginLeft: 25,
  },
  scheduleButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});