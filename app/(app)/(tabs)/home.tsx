import { useState, useCallback } from "react";
import { moodApi } from "../../../utils/moodApi"
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { assessmentTracker } from "../../../utils/assessmentTracker";
import BottomNavigation from "../../../components/BottomNavigation";
import { 
  Resource, 
  fetchAllResourcesWithExternal} from "../../../utils/resourcesApi";
import { useTheme } from "../../../contexts/ThemeContext";

type MoodEntry = {
  id: string;
  mood_type: string;
  created_at: string;
  mood_emoji?: string;
  mood_label?: string;
};

/**
 * HomeScreen Component
 *
 * Main dashboard screen featuring user greeting, quick actions, mood tracking,
 * and resource recommendations. Uses AppHeader for consistent navigation.
 */
export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [isAssessmentDue, setIsAssessmentDue] = useState(false);
const [profileImage, setProfileImage] = useState<string | null>(null);

  const { user } = useUser();
  const { theme } = useTheme();

  // Bottom navigation configuration
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
   * Check if user needs to complete assessment
   */
  const checkAssessmentStatus = useCallback(async () => {
    try {
      if (user?.id) {
        const isDue = await assessmentTracker.isAssessmentDue(user.id);
        setIsAssessmentDue(isDue);
        console.log("Assessment due status:", isDue);
      }
    } catch (error) {
      console.error("Error checking assessment status:", error);
      setIsAssessmentDue(false);
    }
  }, [user?.id]);

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
 * Loads profile image from AsyncStorage and Clerk
 */
const fetchProfileImage = useCallback(async () => {
  try {
    // Priority 1: Check AsyncStorage (set by edit screen)
    const savedImage = await AsyncStorage.getItem('profileImage');
    if (savedImage) {
      console.log('📸 Found profile image in AsyncStorage');
      setProfileImage(savedImage);
      return;
    }

    // Priority 2: Check profileData in AsyncStorage
    const savedProfileData = await AsyncStorage.getItem('profileData');
    if (savedProfileData) {
      const parsedData = JSON.parse(savedProfileData);
      if (parsedData.profileImageUrl) {
        console.log('📸 Found profile image in profileData');
        setProfileImage(parsedData.profileImageUrl);
        return;
      }
    }

    // Priority 3: Use Clerk user image as fallback
    if (user?.imageUrl) {
      console.log('📸 Using Clerk profile image');
      setProfileImage(user.imageUrl);
      return;
    }

    console.log('📸 No profile image found');
    setProfileImage(null);
  } catch (error) {
    console.error('Error loading profile image:', error);
    setProfileImage(null);
  }
}, [user?.imageUrl]);


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
   * Returns the user's first name for personalized greeting
   */
  const getGreetingName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    return "User";
  };

  /**
   * Loads mood data from backend
   */
  const fetchRecentMoods = useCallback(async () => {
    try {
      if (user?.id) {
        const data = await moodApi.getRecentMoods(user.id, 3);
        setRecentMoods(data.moods);
      }
    } catch (error) {
      console.log("Error loading mood data:", error);
      setRecentMoods([]);
    }
  }, [user?.id]);

  /**
   * Loads real resources from local API
   */
  const fetchResources = useCallback(async () => {
    try {
      // Get all resources and pick 2-3 random ones for recommendations
      const allResources = await fetchAllResourcesWithExternal();
      
      // Filter for quick, actionable resources (exercises, affirmations, quotes)
      const recommendedResources = allResources
        .filter(resource => 
          resource.type === 'Exercise' || 
          resource.type === 'Affirmation' || 
          resource.type === 'Quote'
        )
        .sort(() => Math.random() - 0.5) // Shuffle array
        .slice(0, 3); // Take 3 random ones
      
      setResources(recommendedResources);
    } catch (error) {
      console.error("Error loading resources:", error);
      setResources([]);
    }
  }, []);

  useFocusEffect(
  useCallback(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRecentMoods(),
          fetchResources(),
          checkAssessmentStatus(),
          fetchProfileImage(), // ✅ Add this
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchRecentMoods, fetchResources, checkAssessmentStatus, fetchProfileImage])
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
   * Handle resource press - navigate to resource detail
   */
  const handleResourcePress = (resource: Resource) => {
    router.push({
      pathname: "/(app)/resources/resource-detail-screen",
      params: {
        id: resource.id,
        title: resource.title,
        content: resource.content,
        author: resource.author || "Unknown",
        type: resource.type,
        category: resource.category,
        imageEmoji: resource.image_emoji,
        backgroundColor: resource.backgroundColor,
      },
    });
  };

  /**
   * Get resource type icon
   */
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Exercise':
        return 'fitness-outline';
      case 'Affirmation':
        return 'heart-outline';
      case 'Quote':
        return 'chatbubble-outline';
      case 'Article':
        return 'document-text-outline';
      case 'Guide':
        return 'book-outline';
      default:
        return 'library-outline';
    }
  };

  /**
   * Get resource type color
   */
  const getResourceColor = (type: string) => {
    switch (type) {
      case 'Exercise':
        return '#4CAF50';
      case 'Affirmation':
        return '#FF9800';
      case 'Quote':
        return '#2196F3';
      case 'Article':
        return '#9C27B0';
      case 'Guide':
        return '#607D8B';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
        {/* Use AppHeader component - handles all navigation and menu */}
        <AppHeader showBack={false} showMenu={true} showNotifications={true} />

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
              <Text style={[styles.greetingText, { color: theme.colors.text }]}>
                {getGreeting()},{" "}
                <Text style={[styles.nameText, { color: theme.colors.text }]}>{getGreetingName()}!</Text>
              </Text>
              <Text style={[styles.subGreetingText, { color: theme.colors.textSecondary }]}>
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

            {/* Pending Assessment Task - Only show if due */}
            {isAssessmentDue && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={[styles.pendingTaskCard, { backgroundColor: theme.colors.surface }]}
                  onPress={() => router.push("../self-assessment")}
                >
                  <View style={styles.pendingTaskHeader}>
                    <View style={styles.pendingTaskIconContainer}>
                      <Ionicons
                        name="clipboard-outline"
                        size={28}
                        color="#FF9800"
                      />
                    </View>
                    <View style={styles.pendingTaskBadge}>
                      <Text style={styles.pendingTaskBadgeText}>
                        ACTION REQUIRED
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.pendingTaskTitle, { color: theme.colors.text }]}>
                    Complete Your Assessment
                  </Text>
                  <Text style={[styles.pendingTaskDescription, { color: theme.colors.textSecondary }]}>
                    Please complete your mental wellbeing assessment. This helps
                    your support worker provide better care.
                  </Text>

                  <View style={styles.pendingTaskFooter}>
                    <Text style={[styles.pendingTaskTime, { color: theme.colors.textSecondary }]}>
                      Takes 5-7 minutes
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#FF9800"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Actions Grid */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.actionCard,
                      {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.borderLight,
                      },
                    ]}
                    onPress={action.onPress}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                          { backgroundColor: action.color },
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
                      <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{action.title}</Text>
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
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Moods</Text>
              </TouchableOpacity>
              {recentMoods.length > 0 ? (
                <View style={styles.recentMoods}>
                  {recentMoods.map((mood) => (
                    <View key={mood.id} style={[styles.moodItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
                      <Text style={styles.moodEmoji}>
                        {getEmojiForMood(mood.mood_type)}
                      </Text>
                      <View style={styles.moodDetails}>
                        <Text style={[styles.moodDate, { color: theme.colors.textSecondary }]}>
                          {formatDate(mood.created_at)}
                        </Text>
                        <Text style={[styles.moodText, { color: theme.colors.text }]}>
                          {getLabelForMood(mood.mood_type)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.noDataContainer, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>No mood entries yet</Text>
                  <Text style={[styles.noDataSubtext, { color: theme.colors.textDisabled }]}>
                    Start tracking your mood to see insights here
                  </Text>
                </View>
              )}
            </View>

            {/* Resources Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recommended Resources</Text>
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <TouchableOpacity
                    key={resource.id}
                    style={[styles.resourceCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}
                    onPress={() => handleResourcePress(resource)}
                  >
                    <View style={styles.resourceHeader}>
                      <View 
                        style={[
                          styles.resourceIconContainer,
                          { backgroundColor: resource.backgroundColor || '#EDE7EC' }
                        ]}
                      >
                        <Text style={styles.resourceEmoji}>
                          {resource.image_emoji}
                        </Text>
                      </View>
                      <View style={styles.resourceInfo}>
                        <Text style={[styles.resourceTitle, { color: theme.colors.text }]} numberOfLines={2}>
                          {resource.title}
                        </Text>
                        <View style={styles.resourceMeta}>
                          <View style={styles.resourceTypeBadge}>
                            <Ionicons 
                              name={getResourceIcon(resource.type) as any} 
                              size={14} 
                              color={getResourceColor(resource.type)} 
                            />
                            <Text 
                              style={[
                                styles.resourceType,
                                { color: getResourceColor(resource.type) }
                              ]}
                            >
                              {resource.type}
                            </Text>
                          </View>
                          <View style={styles.resourceDot} />
                          <Text style={[styles.resourceDuration, { color: theme.colors.textSecondary }]}>
                            {resource.duration}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.icon} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={[styles.noDataContainer, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>No resources available</Text>
                  <Text style={[styles.noDataSubtext, { color: theme.colors.textDisabled }]}>
                    Check back later for new content
                  </Text>
                </View>
              )}
              
              {/* View All Resources Button */}
              {resources.length > 0 && (
                <TouchableOpacity
                    style={[styles.viewAllButton, { borderColor: theme.colors.primary }]}
                  onPress={() => router.push("/resources")}
                >
                    <Text style={[styles.viewAllButtonText, { color: theme.colors.primary }]}>View All Resources</Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>

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
  greetingSection: {
    backgroundColor: "transparent",
    marginHorizontal: 0,
    paddingVertical: 20,
    paddingHorizontal: 32,
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
  nameText: {
    fontWeight: "700",
    color: "#000",
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
  sectionTitleContainer: {
    alignSelf: "flex-start",
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
  resourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  resourceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resourceEmoji: {
    fontSize: 20,
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
  resourceMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  resourceTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resourceType: {
    fontSize: 12,
    fontWeight: "500",
  },
  resourceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#666",
    marginHorizontal: 6,
  },
  resourceDuration: {
    fontSize: 12,
    color: "#757575",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginTop: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    marginRight: 8,
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
  contentContainer: {
    flex: 1,
    marginBottom: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  bottomSpacing: {
    height: 30,
  },
  pendingTaskCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FF9800",
    shadowColor: "#FF9800",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  pendingTaskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pendingTaskIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingTaskBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingTaskBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  pendingTaskTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 8,
  },
  pendingTaskDescription: {
    fontSize: 14,
    color: "#5D4037",
    lineHeight: 20,
    marginBottom: 16,
  },
  pendingTaskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingTaskTime: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
  },
});