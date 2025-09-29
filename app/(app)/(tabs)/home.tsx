import { useState, useCallback } from "react";
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
 * and resource recommendations. Uses AppHeader for consistent navigation.
 */
export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [isAssessmentDue, setIsAssessmentDue] = useState(false);

  const { user } = useUser();

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

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
  const checkAssessmentStatus = async () => {
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
  };

  // Move fetchData inside useFocusEffect to avoid dependency issues
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchRecentMoods(),
            fetchResources(),
            checkAssessmentStatus(),
          ]);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [user?.id])
  );

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
   * Returns the user's first name for personalized greeting
   */
  const getGreetingName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    return "User";
  };

  /**
   * Loads mock mood data for demonstration
   */
  const fetchRecentMoods = async () => {
    try {
      const storedMoods = await AsyncStorage.getItem("recentMoods");

      if (storedMoods) {
        setRecentMoods(JSON.parse(storedMoods));
      } else {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container} edges={["top"]}>
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

            {/* Pending Assessment Task - Only show if due */}
            {isAssessmentDue && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.pendingTaskCard}
                  onPress={() => router.push("../")}
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

                  <Text style={styles.pendingTaskTitle}>
                    Complete Your Assessment
                  </Text>
                  <Text style={styles.pendingTaskDescription}>
                    Please complete your mental wellbeing assessment. This helps
                    your support worker provide better care.
                  </Text>

                  <View style={styles.pendingTaskFooter}>
                    <Text style={styles.pendingTaskTime}>
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
                    onPress={() =>
                      router.push(`../resources/understanding-anxiety`)
                    }
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
