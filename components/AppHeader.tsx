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
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import assessmentsApi from "../utils/assessmentsApi";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { makeAbsoluteUrl } from "../utils/apiBaseUrl";
import avatarEvents from "../utils/avatarEvents";
import notificationEvents from "../utils/notificationEvents";
import { useNotifications } from "../contexts/NotificationsContext";
import { useConvexActivity } from "../utils/hooks/useConvexActivity";
import { ConvexReactClient, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useFeatureAccess } from "../contexts/FeatureAccessContext";

const { width, height } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? -5: StatusBar.currentHeight || 0;

// Responsive sizing based on screen height
const isSmallDevice = height < 700;
const isMediumDevice = height >= 700 && height < 800;

const normalizeImageUri = (uri?: string | null) => {
  if (!uri) return null;
  if (uri.startsWith('http')) return uri;
  if (uri.startsWith('/')) return makeAbsoluteUrl(uri);
  if (uri.startsWith('data:image')) return null; // avoid rendering large base64 in header
  return uri;
};

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
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAssessmentDue, setIsAssessmentDue] = useState(false);
  const [checkingAssessment, setCheckingAssessment] = useState(true);
  const [menuKey, setMenuKey] = useState(0);

  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  
  // Feature access control
  const { hasFeature } = useFeatureAccess();
  
  // Use shared notification context instead of duplicate polling
  const { unreadCount, refreshNotifications } = useNotifications();
  
  // Initialize Convex client for activity tracking
  const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);
  const { recordLogout } = useConvexActivity(convexClient);

  useEffect(() => {
    const initConvex = async () => {
      try {
        const url = await AsyncStorage.getItem('convexUrl');
        if (url) {
          const client = new ConvexReactClient(url);
          setConvexClient(client);
        }
      } catch (error) {
        console.error('❌ Failed to initialize Convex client:', error);
      }
    };
    initConvex();
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check if assessment is due
  useEffect(() => {
    const checkAssessment = async () => {
      if (user?.id) {
        try {
          const result = await assessmentsApi.isAssessmentDue(user.id);
          setIsAssessmentDue(result.isDue);
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
    setMenuKey(prev => prev + 1); // Increment key to force ScrollView remount
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
      
      // Record logout activity using Convex
      if (user?.id) {
        try {
          await recordLogout(user.id);
        } catch (_e) {
          // Continue with logout even if tracking fails
        }
      }
      
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
        
        // ✅ FIX: If it's base64 (starts with data:image), it's too large - remove it
        if (savedImage.startsWith('data:image')) {
          console.warn("⚠️ Removing large base64 image from AsyncStorage to prevent OOM");
          await AsyncStorage.removeItem("profileImage");
          // Fall through to use Clerk image
        } else {
          setProfileImage(savedImage);
          return;
        }
      }

      // Priority 2: Check "profileData" in AsyncStorage
      const savedProfileData = await AsyncStorage.getItem("profileData");
      if (savedProfileData) {
        const parsedData = JSON.parse(savedProfileData);
        if (parsedData.profileImageUrl) {
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
          setProfileImage(userSpecificImage);
          return;
        }
      }

      // Priority 4: Use Clerk image as fallback
      if (user?.imageUrl) {
        setProfileImage(user.imageUrl);
        return;
      }

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

  // Live profile subscription from Convex: keep avatar in sync with profile personal info
  const fullProfile = useQuery(
    api.profiles.getFullProfile,
    user?.id ? { clerkId: user.id } : "skip"
  ) as { profileImageUrl?: string } | undefined;

  useEffect(() => {
    const url = fullProfile?.profileImageUrl;
    if (url && typeof url === 'string') {
      const normalized = normalizeImageUri(url);
      if (normalized && normalized !== profileImage) {
        setProfileImage(normalized);
        // Persist for fast startup
        AsyncStorage.setItem('profileImage', normalized).catch(() => {});
        AsyncStorage.setItem('profileData', JSON.stringify({ profileImageUrl: normalized })).catch(() => {});
      }
    }
  }, [fullProfile?.profileImageUrl, profileImage]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadProfileImage();
      }
      // Subscribe to avatar updates so header reflects changes immediately
      const unsubscribe = avatarEvents.subscribe((url) => {
        console.log('📸 AppHeader received avatar event:', url);
        // If event sends a URL, store it and update state; if null, clear
        if (url && typeof url === 'string') {
          AsyncStorage.setItem('profileImage', url).catch(() => {});
          setProfileImage(url);
          console.log('✅ AppHeader profileImage updated to:', url);
        } else {
          setProfileImage(null);
          console.log('✅ AppHeader profileImage cleared');
        }
      });

      return () => {
        unsubscribe();
      };
    }, [user?.id, loadProfileImage])
  );

  const getInitials = () => {

    if (user?.firstName && user?.lastName) {
      const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(
        0
      )}`.toUpperCase();
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
      return initials;
    }
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

  // Unread notifications badge - now handled by NotificationsContext
  // No more duplicate polling! Just refresh when push arrives
  useEffect(() => {
    const unsubscribe = notificationEvents.subscribe(() => {
      refreshNotifications();
    });
    return () => { unsubscribe(); };
  }, [refreshNotifications]);

  // Base menu items with feature flags
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
      show: isAssessmentDue && hasFeature("assessments"),
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        hideSideMenu();
        router.push("/mood-tracking");
      },
      disabled: false,
      show: hasFeature("mood_tracking"),
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        hideSideMenu();
        router.push("/journal");
      },
      disabled: false,
      show: true, // Journaling not part of feature control
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        hideSideMenu();
        router.push("/resources");
      },
      disabled: false,
      show: hasFeature("resources"),
    },
    {
      icon: "megaphone",
      title: "Announcements",
      onPress: () => {
        hideSideMenu();
        router.push("/announcements");
      },
      disabled: false,
      show: true, // Announcements always visible
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        hideSideMenu();
        router.push("/crisis-support");
      },
      disabled: false,
      show: hasFeature("crisis_support"),
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/messages");
      },
      disabled: false,
      show: hasFeature("messaging"),
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/appointments");
      },
      disabled: false,
      show: hasFeature("appointments"),
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        hideSideMenu();
        router.push("/community-forum");
      },
      disabled: false,
      show: hasFeature("community"),
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        hideSideMenu();
        router.push("/video-consultations");
      },
      disabled: false,
      show: hasFeature("video_consultation"),
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
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: theme.colors.background }]} testID="app-header"> 
      <View style={[styles.header, { backgroundColor: "transparent" }]}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            testID="back-button"
          >
            <Ionicons name="arrow-undo-sharp" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile/edit")}>
            <View style={styles.profileImageContainer}>
              {profileImage && normalizeImageUri(profileImage) ? (
                <Image
                  source={{ uri: normalizeImageUri(profileImage)! }}
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
            <TouchableOpacity onPress={() => router.push("/notifications")} style={{ position: 'relative', padding: 4 }}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.icon} />
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: '#FF3B30' }]}>
                  <Text style={styles.unreadBadgeText} numberOfLines={1}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              )}
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

          <Animated.View style={[
            styles.sideMenu, 
            { 
              opacity: fadeAnim, 
              backgroundColor: theme.colors.surface,
              paddingTop: Math.max(insets.top, 20),
            }
          ]}>
            {/* Improved side menu header */}
            <View style={[styles.sideMenuHeader, { borderBottomColor: theme.colors.borderLight }]}>
              <View
                style={[
                  styles.profileAvatar,
                  { 
                    borderWidth: 2, 
                    borderColor: "#4CAF50",
                    shadowColor: "#4CAF50",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 3,
                  },
                ]}
              >
                {profileImage && normalizeImageUri(profileImage) ? (
                  <Image
                    source={{ uri: normalizeImageUri(profileImage)! }}
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

            <ScrollView 
              key={`menu-${menuKey}`}
              style={styles.sideMenuContent}
              contentContainerStyle={{ paddingBottom: isSmallDevice ? 80 : isMediumDevice ? 85 : 90 }}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {sideMenuItems.filter(item => item.title !== "Sign Out").map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sideMenuItem,
                    { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' },
                    item.disabled && styles.sideMenuItemDisabled,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: theme.isDark ? 'rgba(76,175,80,0.2)' : '#E8F5E9' }]}>
                    <Ionicons
                      name={item.icon as any}
                      size={isSmallDevice ? 16 : isMediumDevice ? 17 : 18}
                      color={item.disabled ? "#CCCCCC" : "#4CAF50"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.sideMenuItemText,
                      { color: theme.colors.text },
                      item.disabled && styles.sideMenuItemTextDisabled,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.badge && (
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={isSmallDevice ? 13 : 14} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Sign Out Button - Absolute positioned at bottom */}
            <View style={[styles.signOutSection, { 
              borderTopColor: theme.colors.borderLight, 
              paddingBottom: Math.max(insets.bottom + 16, 24),
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.colors.surface,
            }]}>
              <TouchableOpacity
                style={[styles.signOutButton, { backgroundColor: theme.isDark ? 'rgba(255,107,107,0.15)' : '#FFEBEE' }]}
                onPress={confirmSignOut}
                disabled={isSigningOut}
              >
                <Ionicons
                  name="log-out"
                  size={isSmallDevice ? 16 : isMediumDevice ? 17 : 18}
                  color="#FF6B6B"
                />
                <Text style={[styles.signOutText, { marginLeft: 12 }]}>
                  Sign Out{isSigningOut && "..."}
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 20,
    height: 56,
    // backgroundColor removed - now uses theme.colors.surface
  },
  emptyTitle: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "500",
    fontSize: 17,
    textAlign: "center",
    letterSpacing: 0.5,
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
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  sideMenu: {
    width: width * 0.75,
    height: "100%",
  },
  // Updated sideMenuHeader with better spacing
  sideMenuHeader: {
    padding: isSmallDevice ? 12 : isMediumDevice ? 16 : 20,
    paddingBottom: isSmallDevice ? 10 : isMediumDevice ? 12 : 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  // Styles for the profile avatar in side menu
  profileAvatar: {
    width: isSmallDevice ? 50 : isMediumDevice ? 55 : 60,
    height: isSmallDevice ? 50 : isMediumDevice ? 55 : 60,
    borderRadius: isSmallDevice ? 25 : isMediumDevice ? 27.5 : 30,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isSmallDevice ? 6 : isMediumDevice ? 8 : 10,
  },
  profileAvatarImage: {
    width: isSmallDevice ? 50 : isMediumDevice ? 55 : 60,
    height: isSmallDevice ? 50 : isMediumDevice ? 55 : 60,
    borderRadius: isSmallDevice ? 25 : isMediumDevice ? 27.5 : 30,
  },
  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    fontWeight: "bold",
  },
  profileName: {
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 16 : 18,
    fontWeight: "700",
    marginBottom: isSmallDevice ? 2 : isMediumDevice ? 2 : 3,
  },
  profileEmail: {
    fontSize: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
  },
  sideMenuContent: {
    paddingVertical: isSmallDevice ? 2 : 4,
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: isSmallDevice ? 6 : isMediumDevice ? 7 : 8,
    paddingHorizontal: isSmallDevice ? 8 : isMediumDevice ? 10 : 12,
    marginHorizontal: isSmallDevice ? 6 : isMediumDevice ? 8 : 10,
    marginVertical: isSmallDevice ? 1 : isMediumDevice ? 1.5 : 2,
    borderRadius: isSmallDevice ? 8 : isMediumDevice ? 9 : 10,
  },
  menuIconCircle: {
    width: isSmallDevice ? 26 : isMediumDevice ? 28 : 30,
    height: isSmallDevice ? 26 : isMediumDevice ? 28 : 30,
    borderRadius: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: isSmallDevice ? 6 : isMediumDevice ? 8 : 10,
  },
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemText: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    fontWeight: "500",
    marginLeft: 0,
    flex: 1,
  },
  sideMenuItemTextDisabled: {
    color: "#CCCCCC",
  },
  signOutSection: {
    borderTopWidth: 1,
    paddingTop: isSmallDevice ? 10 : isMediumDevice ? 12 : 14,
    paddingHorizontal: isSmallDevice ? 10 : isMediumDevice ? 12 : 14,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isSmallDevice ? 10 : isMediumDevice ? 11 : 12,
    paddingHorizontal: isSmallDevice ? 14 : isMediumDevice ? 16 : 18,
    borderRadius: isSmallDevice ? 8 : isMediumDevice ? 9 : 10,
  },
  signOutText: {
    color: "#FF6B6B",
    fontWeight: "700",
    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
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
