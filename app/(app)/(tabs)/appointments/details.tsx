/**
 * LLM Prompt: Add concise comments to this React Native component.
 * Reference: chat.deepseek.com
 */
import { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
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
export default function BookAppointment() {
  const { theme } = useTheme();
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedType, setSelectedType] = useState("Video Call");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  // Clerk authentication hooks
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

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

  // Show error if support worker not found
  if (!supportWorker) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
      Alert.alert("Logout Failed", "Unable to sign out. Please try again.");
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

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </CurvedBackground>
    );
  }

  // Available session types
  const SESSION_TYPES = ["Video Call", "Phone Call", "In Person"];

  // Mock available dates and times
  const AVAILABLE_DATES = [
    "Monday, October 7, 2025",
    "Wednesday, October 9, 2025",
    "Friday, October 11, 2025",
    "Monday, October 14, 2025",
  ];

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
    router.push({
      pathname: "/appointments/confirm",
      params: {
        supportWorkerId: supportWorker.id,
        selectedType,
        selectedDate: selectedDate || "",
        selectedTime: selectedTime || "",
      },
    });
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title=" Book Appointments" showBack={true} />

        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

              {/* Step 2 - Active */}
              <View style={[styles.stepCircle, styles.stepCircleActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                <Text style={[styles.stepNumber, styles.stepNumberActive]}>
                  2
                </Text>
              </View>
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

              {/* Step 3 - Inactive */}
              <View style={[styles.stepCircle, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>3</Text>
              </View>
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

              {/* Step 4 - Inactive */}
              <View style={[styles.stepCircle, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>4</Text>
              </View>
            </View>
          </View>

          {/* Support Worker Card with Avatar and Name */}
          <View style={[styles.supportWorkerCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.supportWorkerHeader}>
              <Image
                source={{ uri: supportWorker.avatar }}
                style={styles.avatar}
              />
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
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Session Type</Text>
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
                    selectedType === type && styles.sessionTypeButtonSelected,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight },
                    selectedType === type && { borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Ionicons
                    name={iconName as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={selectedType === type ? theme.colors.primary : theme.colors.icon}
                    style={styles.sessionTypeIcon}
                  />
                  <Text
                    style={[
                      styles.sessionTypeText,
                      { color: theme.colors.text },
                      selectedType === type && { color: theme.colors.primary },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date and Time Selection */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Date and Time</Text>

          {/* Available Dates Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Available Dates</Text>
            <View style={styles.datesContainer}>
              {AVAILABLE_DATES.map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateItem,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight },
                    selectedDate === date && { borderColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedTime(null); // Reset time when date changes
                  }}
                >
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={selectedDate === date ? theme.colors.primary : theme.colors.icon}
                    style={styles.dateIcon}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      { color: theme.colors.text },
                      selectedDate === date && { color: theme.colors.primary },
                    ]}
                  >
                    {date}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Available Times Card (only shown when date is selected) */}
          {selectedDate ? (
            <>
              <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Available Times</Text>
                <View style={styles.timesContainer}>
                  {AVAILABLE_TIMES.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeItem,
                        { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight },
                        selectedTime === time && { borderColor: theme.colors.primary },
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Ionicons
                        name="time"
                        size={16}
                        color={selectedTime === time ? theme.colors.primary : theme.colors.icon}
                        style={styles.timeIcon}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          { color: theme.colors.text },
                          selectedTime === time && { color: theme.colors.primary },
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Available Times</Text>
              <View style={styles.timesContainer}></View>
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                Please select available date first
              </Text>
            </View>
          )}

          {/* Continue Button (disabled until both date and time are selected) */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: theme.colors.primary },
              (!selectedDate || !selectedTime) && { backgroundColor: theme.colors.borderLight },
            ]}
            onPress={handleContinue}
            disabled={!selectedDate || !selectedTime}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
    backgroundColor: "#b7d7b8ff",
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
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
  supportWorkerNameHeading: {
    fontSize: 20,
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
    marginRight: 12,
  },
  supportWorkerInfo: {
    flex: 1,
  },
  supportWorkerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  supportWorkerTitle: {
    fontSize: 14,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 16,
  },
  subSectionTitle: {
    fontSize: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    alignItems: "center",
    marginHorizontal: 4,
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
  },
  sessionTypeButtonSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  sessionTypeIcon: {
    marginBottom: 8,
  },
  sessionTypeText: {
    fontSize: 14,
    color: "#495057",
    textAlign: "center",
  },
  sessionTypeTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  datesContainer: {
    gap: 10,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  dateItemSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 14,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    width: "48%",
    minWidth: 140,
  },
  timeItemSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
    color: "#495057",
  },
  timeTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  placeholderText: {
    fontSize: 14,
    color: "#6C757D",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
    marginHorizontal: 15,
  },
  continueButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 16,
    marginRight: 50,
    marginLeft: 50,
    marginBottom: 100,
  },
  continueButtonDisabled: {
    backgroundColor: "#C8E6C9",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
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
