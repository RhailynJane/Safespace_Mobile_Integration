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
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
// Import Clerk hooks
import { useAuth, useUser } from "@clerk/clerk-expo";

const { width } = Dimensions.get("window");

// Props interface for the AppHeader component
export interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showNotifications?: boolean;
  rightActions?: React.ReactNode;
  onMenuPress?: () => void;
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
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Clerk hooks for authentication
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

  // Animation value for fade effects
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Function to show the side menu with animation
  const showSideMenu = () => {
    setSideMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Function to hide the side menu with animation
  const hideSideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  };

  // Fixed Clerk logout function - using relative paths like your working appointments screen
  const handleSignOut = async () => {
    console.log('SIGN OUT BUTTON PRESSED!');
    
    if (isSigningOut) {
      console.log('Already signing out, returning...');
      return;
    }
    
    try {
      console.log('Setting isSigningOut to true...');
      setIsSigningOut(true);
      
      console.log('Hiding side menu...');
      hideSideMenu(); // Close the menu first
      
      // Clear ALL stored data
      console.log('Clearing AsyncStorage...');
      await AsyncStorage.clear();
      
      // Also try Clerk signOut
      try {
        console.log('Calling Clerk signOut...');
        await signOut();
        console.log('Clerk signOut completed');
      } catch (clerkError) {
        console.log('Clerk signOut failed, but continuing:', clerkError);
      }
      
      // Use relative path navigation like your working appointments screen
      console.log('Navigating to login...');
      router.replace("../../../(auth)/login");
      
      // Reset the signing out state
      console.log('Resetting isSigningOut to false...');
      setIsSigningOut(false);
      
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
      
      // Show error alert with fallback navigation
      Alert.alert(
        "Sign Out Error",
        `There was an issue signing out: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          { 
            text: "Try Again", 
            onPress: () => {
              // Try different navigation approaches
              try {
                router.replace("../../../(auth)/login");
              } catch (navError) {
                console.log('Fallback navigation failed:', navError);
                // Last resort - try going back to root
                router.replace("/");
              }
            }
          },
          { text: "Cancel" }
        ]
      );
    }
  };

  // Load profile image from AsyncStorage
  const loadProfileImage = async () => {
    try {
      if (user?.id) {
        const savedImage = await AsyncStorage.getItem(
          `profileImage_${user.id}`
        );
        if (savedImage) {
          setProfileImage(savedImage);
        }
      }
    } catch (error) {
      console.log("Error loading profile image:", error);
    }
  };

  // Load profile image when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadProfileImage();
    }
  }, [user?.id]);

  // Generate initials from user's name for profile placeholder
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(
        0
      )}`.toUpperCase();
    }
    if (user?.fullName) {
      const names = user.fullName.split(" ");
      return names.length > 1
        ? `${names[0]?.charAt(0) ?? ""}${
            names[names.length - 1]?.charAt(0) ?? ""
          }`.toUpperCase()
        : (names[0]?.charAt(0) ?? "").toUpperCase();
    }
    return "U";
  };

  // Get greeting name from user data
  const getGreetingName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    return "User";
  };

  // Get user email
  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email"
    );
  };

  // Menu items with corrected navigation paths
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/home");
      },
      disabled: false,
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/profile");
      },
      disabled: false,
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        hideSideMenu();
        router.push("/self-assessment");
      },
      disabled: false,
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        hideSideMenu();
        router.push("/mood-tracking");
      },
      disabled: false,
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        hideSideMenu();
        router.push("/journal");
      },
      disabled: false,
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        hideSideMenu();
        router.push("/resources");
      },
      disabled: false,
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        hideSideMenu();
        router.push("/crisis-support");
      },
      disabled: false,
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/messages");
      },
      disabled: false,
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/appointments");
      },
      disabled: false,
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        hideSideMenu();
        router.push("/community-forum");
      },
      disabled: false,
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        hideSideMenu();
        router.push("/video-consultations");
      },
      disabled: false,
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: async () => {
        setSideMenuVisible(false);
        console.log("User signed out");
      },
      disabled: false,
    },
  ];

  // Don't render if user is not available (still loading)
  if (!user && isSignedIn) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {/* Main Header Container */}
      <View style={styles.header}>
        {/* Left Section: Back Button or Profile Image */}
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-undo-sharp" size={24} color="black" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/edit")}
            accessibilityLabel="Edit profile"
          >
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                  accessibilityLabel="Profile photo"
                />
              ) : user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
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
            <View style={styles.emptyTitle} />
          )}
        </View>

        {/* Right Section: Icons and Actions */}
        <View style={styles.headerIcons}>
          {rightActions}

          {showNotifications && (
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              accessibilityLabel="View notifications"
            >
              <Ionicons name="notifications-outline" size={24} color="#666" />
            </TouchableOpacity>
          )}

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

      {/* Side Menu Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={sideMenuVisible}
        onRequestClose={hideSideMenu}
        statusBarTranslucent={true}
      >
        <Animated.View
          style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={hideSideMenu}
            accessibilityLabel="Close menu"
          />

          <Animated.View style={[styles.sideMenu, { opacity: fadeAnim }]}>
            <View style={styles.sideMenuHeader}>
              <Text style={styles.profileName}>{getGreetingName()}</Text>
              <Text style={styles.profileEmail}>{getUserEmail()}</Text>
            </View>

            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sideMenuItem,
                    item.disabled && styles.sideMenuItemDisabled,
                  ]}
                  onPress={item.onPress}
                  accessibilityLabel={item.title}
                  disabled={item.disabled}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.disabled ? "#CCCCCC" : "#757575"}
                  />
                  <Text
                    style={[
                      styles.sideMenuItemText,
                      item.disabled && styles.sideMenuItemTextDisabled,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

// Styles remain the same
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
    backgroundColor: "#E8F5E9",
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
    color: "#4CAF50",
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
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
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
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  sideMenuItemTextDisabled: {
    color: "#CCCCCC",
  },
  safeArea: {
    backgroundColor: "transparent",
  },
});