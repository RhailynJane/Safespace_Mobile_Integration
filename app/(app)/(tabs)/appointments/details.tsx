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
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import { useAuth } from "../../../../context/AuthContext";
import { useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../../../components/AppHeader";
import CurvedBackground from "../../../../components/CurvedBackground";

export default function BookAppointment() {
  const { user, profile, logout } = useAuth();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [searchQuery, setSearchQuery] = useState("");

  const { supportWorkerId } = useLocalSearchParams();

  // Mock data for support workers
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

  const [selectedType, setSelectedType] = useState("Video Call");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  if (!supportWorker) {
    return <Text>Support worker not found</Text>;
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
        await logout();
      },
    },
  ];

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </CurvedBackground>
    );
  }

  const SESSION_TYPES = ["Video Call", "Phone Call", "In Person"];

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

  const handleContinue = () => {
    // Navigate to confirmation, passing all selected data as parameters
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
    <SafeAreaView style={styles.container}>
      <CurvedBackground>
        <View style={styles.contentContainer}>
          {/* Header */}
          <AppHeader title="Appointments" showBack={true} />

          <ScrollView style={styles.container}>
            <Text style={styles.title}>
              Schedule a session with a support worker
            </Text>

            {/* Step Indicator */}
            <View style={styles.stepsContainer}>
              <View style={styles.stepRow}>
                {/* Step 1 - Inactive */}
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepConnector} />

                {/* Step 2 - Active */}
                <View style={[styles.stepCircle, styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, styles.stepNumberActive]}>
                    2
                  </Text>
                </View>
                <View style={styles.stepConnector} />

                {/* Step 3 - Inactive */}
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.stepConnector} />

                {/* Step 4 - Inactive */}
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>4</Text>
                </View>
              </View>
            </View>

            {/* Support Worker Card with Avatar and Name */}
            <View style={styles.supportWorkerCard}>
              <View style={styles.supportWorkerHeader}>
                <Image
                  source={{ uri: supportWorker.avatar }}
                  style={styles.avatar}
                />
                <View style={styles.supportWorkerInfo}>
                  <Text style={styles.supportWorkerName}>
                    {supportWorker.name}
                  </Text>
                  <Text style={styles.supportWorkerTitle}>
                    {supportWorker.title}
                  </Text>
                </View>
              </View>
            </View>

            {/* Session Type Selection */}
            <Text style={styles.sectionTitle}>Select Session Type</Text>
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
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Ionicons
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={selectedType === type ? "#4CAF50" : "#666"}
                      style={styles.sessionTypeIcon}
                    />
                    <Text
                      style={[
                        styles.sessionTypeText,
                        selectedType === type && styles.sessionTypeTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date and Time Selection */}
            <Text style={styles.sectionTitle}>Select Date and Time</Text>

            {/* Available Dates Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Available Dates</Text>
              <View style={styles.datesContainer}>
                {AVAILABLE_DATES.map((date) => (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateItem,
                      selectedDate === date && styles.dateItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedDate(date);
                      setSelectedTime(null); // Reset time when date changes
                    }}
                  >
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={selectedDate === date ? "#4CAF50" : "#666"}
                      style={styles.dateIcon}
                    />
                    <Text
                      style={[
                        styles.dateText,
                        selectedDate === date && styles.dateTextSelected,
                      ]}
                    >
                      {date}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedDate ? (
              <>
                {/* Available Times Card */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Available Times</Text>
                  <View style={styles.timesContainer}>
                    {AVAILABLE_TIMES.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeItem,
                          selectedTime === time && styles.timeItemSelected,
                        ]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Ionicons
                          name="time"
                          size={16}
                          color={selectedTime === time ? "#4CAF50" : "#666"}
                          style={styles.timeIcon}
                        />
                        <Text
                          style={[
                            styles.timeText,
                            selectedTime === time && styles.timeTextSelected,
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
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Available Times</Text>
                <View style={styles.timesContainer}></View>
                <Text style={styles.placeholderText}>
                  Please select available date first
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.continueButton,
                (!selectedDate || !selectedTime) &&
                  styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!selectedDate || !selectedTime}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Side Menu */}
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
                  <Text style={styles.profileEmail}>{user?.email}</Text>
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

          <BottomNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </View>
      </CurvedBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
});
