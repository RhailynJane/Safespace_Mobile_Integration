import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { useAuth, useUser } from "@clerk/clerk-expo";
import { assessmentTracker } from "../utils/assessmentTracker";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";

const { width } = Dimensions.get("window");

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
  const { theme } = useTheme();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAssessmentDue, setIsAssessmentDue] = useState(false);
  const [checkingAssessment, setCheckingAssessment] = useState(true);

  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check if assessment is due
  useEffect(() => {
    const checkAssessment = async () => {
      if (user?.id) {
        try {
          const isDue = await assessmentTracker.isAssessmentDue(user.id);
          setIsAssessmentDue(isDue);
        } catch (error) {
          console.error("Error checking assessment status:", error);
        } finally {
          setCheckingAssessment(false);
        }
      }
    };

    checkAssessment();
  }, [user?.id]);

  const showSideMenu = () => {
    // ✅ Reload profile image when opening menu
    loadProfileImage();

    setSideMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideSideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      hideSideMenu();
      await AsyncStorage.clear();
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert(
        "Sign Out Error",
        "There was an issue signing out. Please try again.",
        [
          {
            text: "Try Again",
            onPress: () => router.replace("/(auth)/login"),
          },
          {
            text: "Cancel",
            onPress: () => setIsSigningOut(false),
          },
        ]
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: handleSignOut,
      },
    ]);
  };

  const loadProfileImage = useCallback(async () => {
    try {
      // Priority 1: Check AsyncStorage "profileImage" (set by edit screen)
      const savedImage = await AsyncStorage.getItem("profileImage");
      if (savedImage) {
        console.log("📸 AppHeader: Found profile image in AsyncStorage");
        setProfileImage(savedImage);
        return;
      }

      // Priority 2: Check "profileData" in AsyncStorage
      const savedProfileData = await AsyncStorage.getItem("profileData");
      if (savedProfileData) {
        const parsedData = JSON.parse(savedProfileData);
        if (parsedData.profileImageUrl) {
          console.log("📸 AppHeader: Found profile image in profileData");
          setProfileImage(parsedData.profileImageUrl);
          return;
        }
      }

      // Priority 3: Check user-specific key (legacy support)
      if (user?.id) {
        const userSpecificImage = await AsyncStorage.getItem(
          `profileImage_${user.id}`
        );
        if (userSpecificImage) {
          console.log("📸 AppHeader: Found user-specific profile image");
          setProfileImage(userSpecificImage);
          return;
        }
      }

      // Priority 4: Use Clerk image as fallback
      if (user?.imageUrl) {
        console.log("📸 AppHeader: Using Clerk profile image");
        setProfileImage(user.imageUrl);
        return;
      }

      console.log("📸 AppHeader: No profile image found");
      setProfileImage(null);
    } catch (error) {
      console.log("Error loading profile image:", error);
      setProfileImage(null);
    }
  }, [user?.id, user?.imageUrl]);

  useEffect(() => {
    if (user?.id) {
      loadProfileImage();
    }
  }, [user?.id, loadProfileImage]);

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 AppHeader: Screen focused, reloading profile image");
      if (user?.id) {
        loadProfileImage();
      }
    }, [user?.id, loadProfileImage])
  );

  const getInitials = () => {
    console.log("User data:", {
      firstName: user?.firstName,
      lastName: user?.lastName,
      fullName: user?.fullName,
      email: user?.primaryEmailAddress?.emailAddress,
    });

    if (user?.firstName && user?.lastName) {
      const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(
        0
      )}`.toUpperCase();
      console.log("Using first+last name initials:", initials);
      return initials;
    }
    if (user?.fullName) {
      const names = user.fullName.split(" ");
      const initials =
        names.length > 1
          ? `${names[0]?.charAt(0) ?? ""}${
              names[names.length - 1]?.charAt(0) ?? ""
            }`.toUpperCase()
          : (names[0]?.charAt(0) ?? "").toUpperCase();
      console.log("Using full name initials:", initials);
      return initials;
    }
    console.log("Using fallback 'U'");
    return "U";
  };

  const getGreetingName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    return "User";
  };

  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email"
    );
  };

  // Base menu items
  const baseMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/home");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/profile");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      badge: "Due",
      onPress: () => {
        hideSideMenu();
        router.push("../../self-assessment");
      },
      disabled: false,
      show: isAssessmentDue,
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        hideSideMenu();
        router.push("/mood-tracking");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        hideSideMenu();
        router.push("/journal");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        hideSideMenu();
        router.push("/resources");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        hideSideMenu();
        router.push("/crisis-support");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/messages");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/appointments");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        hideSideMenu();
        router.push("/community-forum");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        hideSideMenu();
        router.push("/video-consultations");
      },
      disabled: false,
      show: true,
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: confirmSignOut,
      disabled: isSigningOut,
      show: true,
    },
  ];

  // Filter menu items based on show property
  const sideMenuItems = baseMenuItems.filter((item) => item.show);

  if (!user && isSignedIn) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={{ color: theme.colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-undo-sharp" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile/edit")}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.initialsText}>{getInitials()}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          {title ? (
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{title}</Text>
          ) : (
            <View style={styles.emptyTitle} />
          )}
        </View>

        <View style={styles.headerIcons}>
          {rightActions}

          {showNotifications && (
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.icon} />
            </TouchableOpacity>
          )}

          {showMenu && (
            <TouchableOpacity style={styles.menuButton} onPress={showSideMenu}>
              <Ionicons name="grid" size={24} color={theme.colors.icon} />
              {isAssessmentDue && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          )}
        </View>
      </View>

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
          />

          <Animated.View style={[styles.sideMenu, { opacity: fadeAnim, backgroundColor: theme.colors.surface }]}>
            {/* FIXED: Added avatar with initials to side menu header */}
            <View style={[styles.sideMenuHeader, { borderBottomColor: theme.colors.borderLight }]}>
              <View
                style={[
                  styles.profileAvatar,
                  { borderWidth: 2, borderColor: "red" },
                ]}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileAvatarImage}
                  />
                ) : user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  <Text style={styles.profileAvatarText}>{getInitials()}</Text>
                )}
              </View>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>{getGreetingName()}</Text>
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
                    color={item.disabled ? "#CCCCCC" : theme.colors.icon}
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
                  {item.badge && (
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 2,
    marginBottom: 8,
    height: 42,
    // backgroundColor removed - now uses theme.colors.surface
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
    // color removed - now uses theme.colors.text
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
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
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
    // backgroundColor removed - now uses theme.colors.surface
    height: "100%",
  },
  // FIXED: Updated sideMenuHeader to include avatar
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    // borderBottomColor removed - now uses theme.colors.borderLight
    alignItems: "center",
  },
  // NEW: Styles for the profile avatar in side menu
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
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
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemText: {
    fontSize: 16,
    // color removed - now uses theme.colors.text
    marginLeft: 15,
    flex: 1,
  },
  sideMenuItemTextDisabled: {
    color: "#CCCCCC",
  },
  signOutText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  dueBadge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dueBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  safeArea: {
    backgroundColor: "transparent",
  },
});
