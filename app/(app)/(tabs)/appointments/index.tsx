/**
 * LLM Prompt: Add concise comments to this React Native component.
 * Reference: chat.deepseek.com
 */
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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";

const { width } = Dimensions.get("window");

/**
 * AppointmentsScreen Component
 *
 * Main appointments screen that allows users to book new appointments
 * or view their scheduled appointments. Features an intuitive interface
 * with clear navigation options and an elegant curved background.
 */
export default function AppointmentsScreen() {
  const { theme } = useTheme();
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [activeView, setActiveView] = useState("main");
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

  /**
   * Handles navigation to book appointment screen
   */
  const handleBookAppointment = () => {
    router.push("../appointments/book");
  };

  /**
   * Handles navigation to view scheduled appointments
   */
  const handleViewScheduled = () => {
    router.push("../appointments/appointment-list");
  };

  /**
   * Renders the main content of the appointments screen
   * @returns JSX element with appointment options
   */
  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.buttonContainer}>
        {/* Primary action button - Book Appointment */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleBookAppointment}
        >
          <Text style={styles.buttonText}>Book Appointment</Text>
        </TouchableOpacity>

        {/* Secondary action button - View Scheduled Appointments */}
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
          onPress={handleViewScheduled}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }] }>
            Check Scheduled Appointments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Placeholder for scheduled appointments list */}
      {activeView === "scheduled"}
    </View>
  );

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Appointments" showBack={true} />

        {/* Appointment Illustration */}
        {/* Image Reference: https://iconscout.com/free-illustration/free-task-appointment-management-illustration_3485590*/}
        <View style={styles.imageContainer}>
          <Image
            source={require("../../../../assets/images/appointment.png")}
            style={styles.appointmentImage}
            resizeMode="contain"
          />
        </View>

        {/* Main Content */}
        {renderContent()}

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
                      color={item.disabled ? theme.colors.iconDisabled : theme.colors.icon}
                    />
                    <Text
                      style={[
                        styles.sideMenuItemText,
                        { color: theme.colors.text },
                        item.disabled && styles.sideMenuItemTextDisabled,
                        item.title === "Sign Out" && styles.signOutText,
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
    // backgroundColor removed - now uses theme.colors.background
  },
  appointmentImage: {
    width: width * 0.9,
    height: 350,
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
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
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
    // backgroundColor removed - now uses theme.colors.surface
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    // borderBottomColor removed - now uses theme.colors.borderLight
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
    // color removed - now uses theme.colors.text
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    // color removed - now uses theme.colors.textSecondary
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
    // borderBottomColor removed - now uses theme.colors.borderLight
  },
  sideMenuItemText: {
    fontSize: 16,
    // color removed - now uses theme.colors.text
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
