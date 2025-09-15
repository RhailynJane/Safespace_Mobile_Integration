import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import BottomNavigation from "../../../../components/BottomNavigation";

const { width } = Dimensions.get("window");

/**
 * CommunityScreen Component
 * 
 * Main community forum entry screen that provides an introduction to the community features.
 * Features a welcoming interface with a curved background and navigation options.
 * This is a standalone UI component with no backend dependencies.
 */
export default function CommunityScreen() {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("community");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Mock user data for UI demonstration
  const mockUser = {
    displayName: "Demo User",
    email: "demo@gmail.com",
    uid: "demo-uid"
  };

  // Mock profile data for UI demonstration
  const mockProfile = {
    firstName: "Demo",
    lastName: "User"
  };

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Shows the side menu with animation
   */
  const showSideMenu = () => {
    setSideMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Hides the side menu with animation
   */
  const hideSideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  };

  /**
   * Generates initials from user's name for profile placeholder
   */
  const getInitials = () => {
    const firstName = mockProfile?.firstName || "";
    const lastName = mockProfile?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  /**
   * Gets the user's name for greeting purposes
   */
  const getGreetingName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    return "User";
  };

  /**
   * Handles tab navigation
   * @param tabId - The ID of the tab to navigate to
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
   * Navigates to the main community forum
   */
  const handleStartPress = () => {
    router.push("../community-forum/main");
  };

  /**
   * Mock logout function for demonstration
   */
  const mockLogout = () => {
    console.log("User logged out");
    hideSideMenu();
  };

  // Side menu navigation items
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        hideSideMenu();
        router.replace("/(app)/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/profile");
      },
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        hideSideMenu();
        router.push("/self-assessment");
      },
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        hideSideMenu();
        router.push("/mood-tracking");
      },
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        hideSideMenu();
        router.push("/journaling");
      },
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        hideSideMenu();
        router.push("/resources");
      },
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        hideSideMenu();
        router.push("/crisis-support");
      },
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/appointments");
      },
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        hideSideMenu();
        router.push("/community-forum");
      },
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        hideSideMenu();
        router.push("/video-consultations");
      },
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: mockLogout,
    },
  ];

  return (
    <CurvedBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with profile and navigation icons */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/profile/edit")}>
            <View style={styles.profileImageContainer}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={showSideMenu}
            >
              <Ionicons name="grid" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Community illustration */}
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../../../assets/images/community-forum.png')} 
              style={styles.appointmentImage}
              resizeMode="contain"
            />
          </View>

          {/* Main content with welcome message */}
          <View style={styles.content}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome to Our</Text>
              <Text style={styles.welcomeTitle}>Community!</Text>

              <Text style={styles.welcomeSubtitle}>
                Our community is a place of warmth and acceptance, where everyone's
                voice is valued and respected.
              </Text>

              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartPress}
              >
                <Text style={styles.startButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Side Menu Modal */}
        <Modal
          animationType="none" 
          transparent={true}
          visible={sideMenuVisible}
          onRequestClose={hideSideMenu}
        >
          <Animated.View style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={hideSideMenu}
            />
            <Animated.View style={[styles.sideMenu, { opacity: fadeAnim }]}>
              <View style={styles.sideMenuHeader}>
                <Text style={styles.profileName}>{getGreetingName()}</Text>
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
                      color="#757575"
                    />
                    <Text style={styles.sideMenuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* Bottom navigation bar */}
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
  },
  safeArea: {
    flex: 1,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    height: 200,
  },
  appointmentImage: {
    width: width * 0.9,
    height: 350,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    alignItems: "center",
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#462401ff",
    textAlign: "center",
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 25,
  },
  startButton: {
    backgroundColor: "#7CB9A9",
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
    borderColor: "#FFF",
    borderWidth: 3,
    marginTop: 20,
    marginBottom: 10,
    paddingBottom: 15,
  },
  startButtonText: {
    color: "#412100ff",
    fontSize: 18,
    fontWeight: "700",
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  sideMenu: {
    paddingTop: 40,
    width: width * 0.75,
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