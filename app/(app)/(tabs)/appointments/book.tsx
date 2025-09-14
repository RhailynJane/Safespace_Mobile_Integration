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
import { AppHeader } from "../../../../components/AppHeader";
import CurvedBackground from "../../../../components/CurvedBackground";

export default function BookAppointment() {
  const { user, profile, logout } = useAuth();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectSupportWorker = (supportWorkerId: number) => {
    // Navigate to the details screen, passing the ID as a parameter
    router.push(`/appointments/details?supportWorkerId=${supportWorkerId}`);
  };

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

  const filteredSupportWorkers = supportWorkers.filter((sw) =>
    sw.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      supportWorker: "Eric Young",
      date: "October 06, 2025",
      time: "10:30 AM",
      type: "Video",
      status: "upcoming",
    },
  ];

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
                {/* Step 1 - Active */}
                <View style={[styles.stepCircle, styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, styles.stepNumberActive]}>
                    1
                  </Text>
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

                {/* Step 4 - Inactive */}
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>4</Text>
                </View>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search support worker..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredSupportWorkers.map((supportWorker) => (
              <TouchableOpacity
                key={supportWorker.id}
                style={styles.supportWorkerCard}
                onPress={() => handleSelectSupportWorker(supportWorker.id)}
              >
                {/* Add avatar image here */}
                <View style={styles.avatarContainer}>
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

                <View style={styles.specialtiesContainer}>
                  {supportWorker.specialties.map((specialty, index) => (
                    <Text key={index} style={styles.specialtyText}>
                      {specialty}
                    </Text>
                  ))}
                </View>
                <Text style={styles.selectText}>Select Support Worker</Text>
              </TouchableOpacity>
            ))}
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
  supportWorkerCard: {
    backgroundColor: "#f0f8ff",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sideMenu: {
    width: "75%",
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#4CAF50",
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
  supportWorkerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  supportWorkerNameHeading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  supportWorkerTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 0,
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  specialtyText: {
    backgroundColor: "#d0cad8ff",
    color: "#00000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 12,
  },
  selectText: {
    color: "#00000",
    fontWeight: "600",
    textAlign: "center",
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
});
