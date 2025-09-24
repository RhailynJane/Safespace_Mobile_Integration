/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth, useUser } from "@clerk/clerk-expo"; // Import Clerk hooks
import CurvedBackground from "../../../components/CurvedBackground";

const { width } = Dimensions.get("window");

type MoodEntry = {
  id: string;
  mood_type: string;
  created_at: string;
  mood_emoji?: string;
  mood_label?: string;
};

type Resource = {
  id: string;
  title: string;
  duration: string;
  onPress?: () => void;
};

/**
 * HomeScreen Component
 *
 * Main dashboard screen featuring user greeting, quick actions, mood tracking,
 * and resource recommendations. Designed with a clean, modern UI and smooth animations.
 *
 * Integrated with Clerk for authentication and user management.
 */
export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Clerk authentication hooks
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Enhanced logout function with Clerk integration
   */
  const handleLogout = async () => {
    console.log('HomeScreen logout initiated...');
    
    if (isSigningOut) {
      console.log('Already signing out, returning...');
      return;
    }
    
    try {
      setIsSigningOut(true);
      
      // Close the side menu first
      hideSideMenu();
      
      // Clear local storage
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared');
      
      // Sign out from Clerk
      if (signOut) {
        await signOut();
        console.log('Clerk signOut completed');
      }
      
      // Navigate to login screen
      router.replace("/(auth)/login");
      console.log('Navigation to login completed');
      
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Logout Failed", "Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * Confirmation dialog for sign out
   */
  const confirmSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log('Sign out cancelled')
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: handleLogout
        }
      ]
    );
  };

  // Quick action buttons for main app features
  const quickActions = [
    {
      id: "mood",
      title: "Track Mood",
      icon: "happy-outline",
      image: require("../../../assets/images/track-mood.png"),
      color: "#EDE7EC",
      borderColor: "#EDE7EC",
      onPress: () => router.push("/mood-tracking"),
    },
    {
      id: "journal",
      title: "Journal",
      icon: "journal-outline",
      image: require("../../../assets/images/journal.png"),
      color: "#EDE7EC",
      borderColor: "#EDE7EC",
      onPress: () => router.push("/journal"),
    },
    {
      id: "resources",
      title: "Resources",
      icon: "library-outline",
      image: require("../../../assets/images/resources.png"),
      color: "#EDE7EC",
      borderColor: "#EDE7EC",
      onPress: () => router.push("/resources"),
    },
    {
      id: "crisis",
      title: "Crisis Support",
      icon: "help-buoy-outline",
      image: require("../../../assets/images/crisis-support.png"),
      color: "#EDE7EC",
      borderColor: "#bab5b9ff",
      onPress: () => router.push("/crisis-support"),
    },
  ];

  /**
   * Shows the side menu with smooth fade animation
   */
  const showSideMenu = () => {
    setSideMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Hides the side menu with fade out animation
   */
  const hideSideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  };

  // Side menu navigation items
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/profile");
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
        router.push("/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        hideSideMenu();
        router.push("/(tabs)/appointments");
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
      onPress: confirmSignOut, // Use confirmation dialog
      disabled: isSigningOut,
    },
  ];

  /**
   * Returns emoji representation for mood type
   */
  const getEmojiForMood = (moodType: string) => {
    switch (moodType) {
      case "very-happy":
        return "😄";
      case "happy":
        return "🙂";
      case "neutral":
        return "😐";
      case "sad":
        return "🙁";
      case "very-sad":
        return "😢";
      default:
        return "😐";
    }
  };

  /**
   * Returns label text for mood type
   */
  const getLabelForMood = (moodType: string) => {
    switch (moodType) {
      case "very-happy":
        return "Very Happy";
      case "happy":
        return "Happy";
      case "neutral":
        return "Neutral";
      case "sad":
        return "Sad";
      case "very-sad":
        return "Very Sad";
      default:
        return "Unknown";
    }
  };

  /**
   * Returns appropriate greeting based on time of day
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  /**
   * Loads mock mood data for demonstration
   */
  const fetchRecentMoods = async () => {
    try {
      // Try to load moods from local storage first
      const storedMoods = await AsyncStorage.getItem("recentMoods");

      if (storedMoods) {
        setRecentMoods(JSON.parse(storedMoods));
      } else {
        // Create mock data if none exists
        const mockMoods: MoodEntry[] = [
          {
            id: "1",
            mood_type: "happy",
            created_at: new Date().toISOString(),
            mood_emoji: getEmojiForMood("happy"),
            mood_label: getLabelForMood("happy"),
          },
          {
            id: "2",
            mood_type: "neutral",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            mood_emoji: getEmojiForMood("neutral"),
            mood_label: getLabelForMood("neutral"),
          },
          {
            id: "3",
            mood_type: "sad",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            mood_emoji: getEmojiForMood("sad"),
            mood_label: getLabelForMood("sad"),
          },
        ];

        setRecentMoods(mockMoods);
        await AsyncStorage.setItem("recentMoods", JSON.stringify(mockMoods));
      }
    } catch (error) {
      console.log("Error loading mood data");
      setRecentMoods([]);
    }
  };

  /**
   * Loads mock resource data for demonstration
   */
  const fetchResources = async () => {
    try {
      // Mock data for demonstration
      const mockResources: Resource[] = [
        {
          id: "1",
          title: "Understanding Anxiety",
          duration: "10 min",
        },
      ];

      setResources(mockResources);
    } catch (error) {
      setResources([]);
    }
  };

  /**
   * Fetches all required data for the dashboard
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRecentMoods(), fetchResources()]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadProfileImage();
    }, [])
  );

  /**
   * Formats date into relative or short format
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  /**
   * Loads profile image from local storage
   */
  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem("profileImage");
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log("Error loading profile image:", error);
    }
  };

  /**
   * Generates initials from user's name for fallback avatar
   */
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.fullName) {
      const names = user.fullName.split(" ");
      return names.length > 1 
        ? `${names[0]?.charAt(0) ?? ""}${names[names.length - 1]?.charAt(0) ?? ""}`.toUpperCase()
        : (names[0]?.charAt(0) ?? "").toUpperCase();
    }
    return "U";
  };

  /**
   * Returns the user's first name for personalized greeting
   */
  const getGreetingName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    return "User";
  };

  /**
   * Returns the user's email for display
   */
  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email"
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/edit")}
          >
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
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={showSideMenu}>
              <Ionicons name="grid" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.contentContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Greeting Section */}
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>
                {getGreeting()},{" "}
                <Text style={styles.nameText}>{getGreetingName()}!</Text>
              </Text>
              <Text style={styles.subGreetingText}>
                How are you feeling today?
              </Text>
            </View>

            {/* Emergency Help Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => router.push("/crisis-support")}
              >
                <View style={styles.helpButtonContent}>
                  <Text style={styles.helpButtonText}>Get Help Now</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.actionCard,
                      {
                        backgroundColor: action.color,
                        borderColor: action.borderColor,
                      },
                    ]}
                    onPress={action.onPress}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: action.borderColor },
                      ]}
                    >
                      {action.image ? (
                        <Image
                          source={action.image}
                          style={[
                            styles.actionImage,
                            action.id === "crisis" && styles.crisisSupportImage,
                          ]}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name={action.icon as any}
                          size={28}
                          color="white"
                        />
                      )}
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Mood History Section */}
            <View style={styles.section}>
              <TouchableOpacity
                onPress={() => router.push("/mood-history")}
                style={styles.sectionTitleContainer}
              >
                <Text style={styles.sectionTitle}>Recent Moods</Text>
              </TouchableOpacity>
              {recentMoods.length > 0 ? (
                <View style={styles.recentMoods}>
                  {recentMoods.map((mood) => (
                    <View key={mood.id} style={styles.moodItem}>
                      <Text style={styles.moodEmoji}>{mood.mood_emoji}</Text>
                      <View style={styles.moodDetails}>
                        <Text style={styles.moodDate}>
                          {formatDate(mood.created_at)}
                        </Text>
                        <Text style={styles.moodText}>{mood.mood_label}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No mood entries yet</Text>
                  <Text style={styles.noDataSubtext}>
                    Start tracking your mood to see insights here
                  </Text>
                </View>
              )}
            </View>

            {/* Resources Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended Resources</Text>
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <TouchableOpacity
                    key={resource.id}
                    style={styles.resourceCard}
                    onPress={() => router.push(`../resources/understanding-anxiety`)}
                  >
                    <View style={styles.resourceInfo}>
                      <Text style={styles.resourceTitle}>{resource.title}</Text>
                      <Text style={styles.resourceDuration}>
                        {resource.duration}
                      </Text>
                    </View>
                    <Ionicons name="play-circle" size={32} color="#4CAF50" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No resources available</Text>
                  <Text style={styles.noDataSubtext}>
                    Check back later for new content
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id !== "home") router.push(`/(tabs)/${tab.id}`);
              }}
            >
              <View
                style={[
                  styles.navIconContainer,
                  activeTab === tab.id && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={24}
                  color={activeTab === tab.id ? "#2EA78F" : "#9E9E9E"}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Side Menu Modal */}
        <Modal
          animationType="none"
          transparent={true}
          visible={sideMenuVisible}
          onRequestClose={hideSideMenu}
        >
          <Animated.View
            style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}
          >
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={hideSideMenu}
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
                    disabled={item.disabled}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.disabled ? "#CCCCCC" : "#757575"}
                    />
                    <Text style={[
                      styles.sideMenuItemText,
                      item.disabled && styles.sideMenuItemTextDisabled,
                      item.title === "Sign Out" && styles.signOutText,
                    ]}>
                      {item.title}
                      {item.title === "Sign Out" && isSigningOut && "..."}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#BAD6D2",
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
  greetingSection: {
    backgroundColor: "#BAD6D2",
    marginHorizontal: 0,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "300",
    color: "#000",
    marginBottom: 4,
  },
  subGreetingText: {
    fontSize: 15,
    color: "#000",
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    marginRight: 4,
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
  helpButton: {
    backgroundColor: "#E4585A",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  helpButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    padding: 20,
  },
  actionCard: {
    width: 141,
    height: 159,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionImage: {
    width: 85,
    height: 120,
  },
  trackMoodImage: {
    width: 130,
    height: 140,
  },
  crisisSupportImage: {
    opacity: 0.6,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginTop: 8,
  },
  recentMoods: {
    backgroundColor: "#EDE7EC",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitleContainer: {
    alignSelf: "flex-start",
  },
  moodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#fafafaff",
  },
  moodEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  moodDetails: {
    flex: 1,
  },
  moodDate: {
    fontSize: 12,
    color: "#9E9E9E",
    marginBottom: 2,
  },
  moodText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  noDataContainer: {
    backgroundColor: "#EDE7EC",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  noDataText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EDE7EC",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  resourceDuration: {
    fontSize: 14,
    color: "#757575",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  activeIconContainer: {
    backgroundColor: "#B6D5CF61",
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
    color: "#000",
    marginBottom: 4,
  },
  nameText: {
    fontWeight: "700",
    color: "#000",
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
  contentContainer: {
    flex: 1,
      marginBottom: 80, // Space for bottom navigation
    },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30, 
  },
  bottomSpacing: {
    height: 30, // Additional spacing at the bottom
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
