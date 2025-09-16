import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";

const { width } = Dimensions.get("window");

/**
 * CrisisScreen Component
 *
 * Emergency support screen providing immediate crisis resources including:
 * - Emergency contact numbers (911, crisis hotlines)
 * - Immediate coping strategies
 * - Grounding techniques (5-4-3-2-1 method)
 * - Quick access to professional help
 * Features an elegant curved background and urgent, clear interface design.
 */
export default function CrisisScreen() {
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("crisis");

  // Mock user data (replaces backend auth context)
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

  /**
   * Handles emergency call actions
   * Note: In a real app, this would use Linking.openURL('tel:911')
   * @param number - The emergency number to call
   */
  const handleEmergencyCall = (number: string) => {
    console.log(`Calling emergency number: ${number}`);
    // In a real app: Linking.openURL(`tel:${number}`);
    alert(`This would call ${number} in a real application`);
  };

  /**
   * Handles distress center website navigation
   * Note: In a real app, this would use Linking.openURL
   */
  const handleDistressCenter = () => {
    console.log("Opening Distress Center website");
    // In a real app: Linking.openURL('https://distresscentre.com');
    alert("This would open the Distress Center website in a real application");
  };

  // Show loading indicator during operations
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <AppHeader title="Crisis Support" showBack={true} />

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Emergency Help Card - High visibility for immediate assistance */}
          <View style={styles.card}>
            <View style={styles.section}>
              <Text style={styles.sectionMainTitle}>Need Immediate Help?</Text>
              <Text style={styles.sectionText}>
                If you or someone you know is in crisis, please call 911 or
                contact a 24/7 crisis line in your area.
              </Text>
              <Text style={styles.sectionText}>
                For urgent mental health support, reach out to the Distress
                Centre at 403-266-4357 or visit distresscentre.com.
              </Text>
            </View>
          </View>

          {/* Emergency Action Buttons */}
          <View style={styles.emergencyButtons}>
            <TouchableOpacity
              style={[styles.emergencyButton, { backgroundColor: "#E53935" }]}
              onPress={() => handleEmergencyCall("911")}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Call 911</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emergencyButton, { backgroundColor: "#4CAF50" }]}
              onPress={() => handleEmergencyCall("988")}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>
                Crisis Hotline: 988
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emergencyButton, { backgroundColor: "#2196F3" }]}
              onPress={handleDistressCenter}
            >
              <Ionicons name="globe" size={20} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Distress Center</Text>
            </TouchableOpacity>
          </View>

          {/* Immediate Coping Strategies Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Immediate Coping Strategies</Text>
            <View style={styles.strategiesList}>
              <View style={styles.strategyItem}>
                <View style={styles.strategyNumber}>
                  <Text style={styles.strategyNumberText}>1</Text>
                </View>
                <Text style={styles.strategyText}>Take slow breaths.</Text>
              </View>

              <View style={styles.strategyItem}>
                <View style={styles.strategyNumber}>
                  <Text style={styles.strategyNumberText}>2</Text>
                </View>
                <Text style={styles.strategyText}>
                  Go to a safe public place.
                </Text>
              </View>

              <View style={styles.strategyItem}>
                <View style={styles.strategyNumber}>
                  <Text style={styles.strategyNumberText}>3</Text>
                </View>
                <Text style={styles.strategyText}>
                  Focus on getting through the next hour.
                </Text>
              </View>

              <View style={styles.strategyItem}>
                <View style={styles.strategyNumber}>
                  <Text style={styles.strategyNumberText}>4</Text>
                </View>
                <Text style={styles.strategyText}>
                  Reach out to someone you trust.
                </Text>
              </View>

              <View style={styles.strategyItem}>
                <View style={styles.strategyNumber}>
                  <Text style={styles.strategyNumberText}>5</Text>
                </View>
                <Text style={styles.strategyText}>
                  Remove means of self harm.
                </Text>
              </View>

              <View style={styles.strategyItem}>
                <View style={styles.strategyNumber}>
                  <Text style={styles.strategyNumberText}>6</Text>
                </View>
                <Text style={styles.strategyText}>
                  Use grounding techniques (5-4-3-2-1)
                </Text>
              </View>
            </View>
          </View>

          {/* Grounding Technique Section */}
          <View style={styles.groundingSection}>
            <Text style={styles.groundingTitle}>
              5-4-3-2-1 Grounding Technique
            </Text>
            <View style={styles.groundingSteps}>
              <Text style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>5</Text> things you can see
              </Text>
              <Text style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>4</Text> things you can
                touch
              </Text>
              <Text style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>3</Text> things you can
                hear
              </Text>
              <Text style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>2</Text> things you can
                smell
              </Text>
              <Text style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>1</Text> thing you can
                taste
              </Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#c22f2fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 12,
  },
  sectionMainTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 8,
  },
  emergencyButtons: {
    marginBottom: 30,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  emergencyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  strategiesList: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
  },
  strategyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  strategyNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  strategyNumberText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  strategyText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  groundingSection: {
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  groundingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 12,
  },
  groundingSteps: {
    marginLeft: 8,
  },
  groundingStep: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  groundingNumber: {
    fontWeight: "bold",
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
