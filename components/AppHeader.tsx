import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// Props interface for the AppHeader component
export interface AppHeaderProps {
  title?: string; // Optional header title
  showBack?: boolean; // Whether to show back button instead of profile
  showMenu?: boolean; // Whether to show menu button
  showNotifications?: boolean; // Whether to show notifications button
  rightActions?: React.ReactNode; // Custom right-side actions/components
  onMenuPress?: () => void; // Optional custom menu press handler
}

export const AppHeader = ({
  title,
  showBack = false,
  showMenu = true,
  showNotifications = true,
  rightActions,
}: AppHeaderProps) => {
  // State for managing side menu visibility and profile image
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Mock user data for frontend-only version
  const [user] = useState({
    uid: "demo-user-id",
    email: "demo@gmail.com",
    displayName: "Demo User",
  });

  const [profile] = useState({
    firstName: "Demo",
    lastName: "User",
  });

  // Animation value for fade effects
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Function to show the side menu with animation
  const showSideMenu = () => {
    setSideMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  // Function to hide the side menu with animation
  const hideSideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  };

  // Mock logout function for frontend-only version
  const logout = async () => {
    console.log("User logged out (frontend simulation)");
    router.replace("/login");
  };

  // Load profile image from AsyncStorage
  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(`profileImage_${user.uid}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log("Error loading profile image:", error);
    }
  };

  // Load profile image when component mounts
  useEffect(() => {
    loadProfileImage();
  }, []);

  // Generate initials from user's name for profile placeholder
  const getInitials = () => {
    const firstName = profile?.firstName || "";
    const lastName = profile?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  // Get greeting name from profile or user data
  const getGreetingName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    return "User";
  };

  // Menu items for the side navigation drawer
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/home");
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
        router.push("/journal");
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
      onPress: async () => {
        try {
          hideSideMenu();
          await logout();
        } catch (error) {
          console.error("Sign out error:", error);
        }
      },
    },
  ];

  return (
    <>
      {/* Main Header Container */}
      <View style={styles.header}>
        {/* Left Section: Back Button or Profile Image */}
        {showBack ? (
          // Back button for navigation
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-undo-sharp" size={24} color="black" />
          </TouchableOpacity>
        ) : (
          // Profile image/initials that navigate to profile edit
          <TouchableOpacity
            onPress={() => router.push("/(app)/(tabs)/profile/edit")}
            accessibilityLabel="Edit profile"
          >
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                  accessibilityLabel="Profile photo"
                />
              ) : (
                <Text style={styles.initialsText}>{getInitials()}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Center Section: Title */}
        <View style={styles.titleContainer}>
          {title ? (
            <Text style={styles.headerTitle} accessibilityRole="header">
              {title}
            </Text>
          ) : (
            <View style={styles.emptyTitle} /> // Empty view to maintain layout
          )}
        </View>

        {/* Right Section: Icons and Actions */}
        <View style={styles.headerIcons}>
          {/* Custom right-side actions passed as props */}
          {rightActions}

          {/* Notifications Icon */}
          {showNotifications && (
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              accessibilityLabel="View notifications"
            >
              <Ionicons name="notifications-outline" size={24} color="#666" />
            </TouchableOpacity>
          )}

          {/* Menu Icon - Opens side navigation drawer */}
          {showMenu && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={showSideMenu}
              accessibilityLabel="Open menu"
            >
              <Ionicons name="grid" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Side Menu Modal - Navigation Drawer */}
      <Modal
        animationType="none"
        transparent={true}
        visible={sideMenuVisible}
        onRequestClose={hideSideMenu} // Android back button support
      >
        {/* Overlay with press-to-close functionality */}
        <Animated.View
          style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={hideSideMenu}
            accessibilityLabel="Close menu"
          />

          {/* Side Menu Content */}
          <Animated.View style={[styles.sideMenu, { opacity: fadeAnim }]}>
            {/* User Profile Section in Menu Header */}
            <View style={styles.sideMenuHeader}>
              <Text style={styles.profileName}>{getGreetingName()}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>

            {/* Scrollable List of Menu Items */}
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sideMenuItem}
                  onPress={item.onPress}
                  accessibilityLabel={item.title}
                >
                  <Ionicons name={item.icon as any} size={20} color="#757575" />
                  <Text style={styles.sideMenuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 2,
    height: 48,
  },
  emptyTitle: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "500",
    fontSize: 17,
    textAlign: "left",
    letterSpacing: 0.5,
    marginLeft: 10,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9", // Light green background for initials
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50", // Green color for initials
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 8,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // Space between icons
  },
  menuButton: {
    padding: 4,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black overlay
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  sideMenu: {
    paddingTop: 40, // Extra padding at top for status bar
    width: width * 0.75, // 75% of screen width
    backgroundColor: "#FFFFFF",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0", // Light gray border
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121", // Dark gray
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#757575", // Medium gray
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
    borderBottomColor: "#F0F0F0", // Very light gray border
  },
  sideMenuItemText: {
    fontSize: 16,
    color: "#333", // Dark text color
    marginLeft: 15, // Space between icon and text
  },
});
