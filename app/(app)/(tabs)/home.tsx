import { useState, useCallback, useMemo, useEffect } from "react";
import { moodApi } from "../../../utils/moodApi"
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Svg, { Line } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import CurvedBackground from "../../../components/CurvedBackground";
import { APP_TIME_ZONE } from "../../../utils/timezone";
import { AppHeader } from "../../../components/AppHeader";
import assessmentsApi from "../../../utils/assessmentsApi";
import BottomNavigation from "../../../components/BottomNavigation";
import { 
  Resource, 
  fetchAllResourcesWithExternal} from "../../../utils/resourcesApi";
import { getPersonalizedRecommendations } from "../../../utils/resourceRecommendations";
import { useTheme } from "../../../contexts/ThemeContext";
import OptimizedImage from "../../../components/OptimizedImage";
import React from "react";
import { useConvexMoods } from "../../../utils/hooks/useConvexMoods";
import { LiveMoodStats } from "../../../components/LiveMoodStats";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type MoodEntry = {
  id: string;
  mood_type: string;
  created_at: string;
  mood_emoji?: string;
  mood_label?: string;
};

/**
 * MoodChartSection Component - Shows mood chart with streaks
 */
function MoodChartSection({ userId }: { userId: string }) {
  const { theme } = useTheme();
  const chartData = useQuery(api.moods.getMoodChartData, { userId, days: 7 });

  // Mood emoji mapping
  const getEmojiForMood = (moodType: string) => {
    const moodMap: Record<string, string> = {
      "very-happy": "😄", "happy": "🙂", "neutral": "😐", "sad": "🙁", "very-sad": "😢",
      "ecstatic": "🤩", "content": "🙂", "displeased": "😕", "frustrated": "😖",
      "annoyed": "😒", "angry": "😠", "furious": "🤬",
    };
    return moodMap[moodType] || "😐";
  };

  if (!chartData) {
    return (
      <View style={{ backgroundColor: theme.colors.surface, padding: 20, borderRadius: 12 }}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  const { currentStreak, longestStreak, chartData: moodPoints } = chartData;
  // Show all 30 days
  const displayDays = moodPoints || [];
  const daysWithMoods = displayDays.filter(d => d.averageScore !== null);

  console.log('[MoodChartSection] Chart data:', { 
    totalDays: displayDays.length,
    daysWithMoods: daysWithMoods.length,
    dates: displayDays.map(d => d.date),
    scores: displayDays.map(d => d.averageScore)
  });

  return (
    <View style={{ backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginTop: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: theme.colors.text }}>
          Mood Trends (7 days)
        </Text>
        <TouchableOpacity onPress={() => router.push("/(app)/mood-tracking/mood-history")}>
          <Text style={{ fontSize: 14, color: "#4CAF50", fontWeight: "600" }}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Streaks Section */}
      <View style={{ flexDirection: "row", backgroundColor: theme.isDark ? '#2A2A2A' : '#F5F0F5', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, marginBottom: 4 }}>Current Streak</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.text }}>{currentStreak} days</Text>
        </View>
        <View style={{ width: 1, marginHorizontal: 12, backgroundColor: theme.colors.borderLight }} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Ionicons name="trophy-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, marginBottom: 4 }}>Longest Streak</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.text }}>{longestStreak} days</Text>
        </View>
      </View>

      {/* Mood Chart */}
      {displayDays.length > 0 ? (
        <>
          <Text style={{ fontSize: 15, fontWeight: "600", marginBottom: 12, color: theme.colors.text }}>Mood Chart</Text>
          <View style={{ height: 200, marginBottom: 8 }}>
            {/* Chart Area with bars */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 8, backgroundColor: theme.isDark ? '#1a1a1a' : '#f8f8f8', borderRadius: 8, paddingTop: 20, paddingBottom: 50 }}>
              {displayDays.map((point, i) => {
                const score = point.averageScore;
                const hasMood = score !== null;
                
                // Map score (1-5) to bar height percentage
                const heightPercent = hasMood ? ((score - 1) / 4) * 100 : 5;
                
                // Get emoji for the mood
                const emoji = hasMood && point.mood ? (point.mood.mood_emoji || getEmojiForMood(point.mood.mood_type)) : '';
                
                // Get color based on score
                const getBarColor = (s: number | null) => {
                  if (s === null) return theme.isDark ? '#2a2a2a' : '#e0e0e0';
                  if (s >= 4.5) return '#FFD700'; // ecstatic - gold
                  if (s >= 3.5) return '#FFB74D'; // happy/content - orange
                  if (s >= 2.5) return '#90CAF9'; // neutral/displeased - blue
                  if (s >= 1.5) return '#EF9A9A'; // frustrated/annoyed - light red
                  return '#F48FB1'; // angry/furious - pink
                };
                
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: 2 }}>
                    {/* Bar */}
                    <View style={{
                      width: '100%',
                      maxWidth: 35,
                      height: `${heightPercent}%`,
                      minHeight: hasMood ? 30 : 5,
                      backgroundColor: getBarColor(score),
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      opacity: hasMood ? 1 : 0.3,
                    }}>
                      {hasMood && emoji && (
                        <Text style={{ fontSize: 18 }}>{emoji}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            
            {/* Day of week and date labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, paddingHorizontal: 8 }}>
              {displayDays.map((point, i) => {
                // Parse date string properly (YYYY-MM-DD)
                const [year, month, dayStr] = point.date.split('-');
                const date = new Date(parseInt(year || '2025'), parseInt(month || '1') - 1, parseInt(dayStr || '1'));
                const day = date.getDate();
                const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                
                // Check if this is today by comparing date strings
                const todayStr = (() => {
                  const d = new Date();
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })();
                const isToday = point.date === todayStr;
                
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', marginHorizontal: 2 }}>
                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginBottom: 2 }}>
                      {dayOfWeek}
                    </Text>
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: isToday ? theme.colors.primary : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 11, color: isToday ? '#fff' : theme.colors.text, fontWeight: isToday ? '700' : '400' }}>
                        {day}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      ) : (
        <View style={{ backgroundColor: theme.colors.background, borderRadius: 12, padding: 24, alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: theme.colors.textSecondary, fontWeight: "500", marginBottom: 4 }}>
            No mood data yet
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textDisabled, textAlign: "center" }}>
            Track your mood to see trends
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * HomeScreen Component
 *
 * Main dashboard screen featuring user greeting, quick actions, mood tracking,
 * and resource recommendations. Uses AppHeader for consistent navigation.
 */
export default function HomeScreen() {
  // Debug instrumentation to trace render & focus effect executions (remove once stable)
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current % 5 === 0) {
    console.log(`[HomeScreen] Render count: ${renderCountRef.current}`);
  }
  // In Jest, avoid running asynchronous data fetching to prevent act() warnings and leaks
  const IS_TEST_ENV =
    typeof process !== "undefined" &&
    process.env &&
    (process.env.JEST_WORKER_ID != null || process.env.NODE_ENV === "test");

  const [loading, setLoading] = useState(true);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [recentJournals, setRecentJournals] = useState<any[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [isAssessmentDue, setIsAssessmentDue] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // Temporarily disable local Convex client on this screen to stop render loops
  // We'll rely on REST for moods here; Convex is provided at the app root if needed
  const convexClient = null;

  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { theme, scaledFontSize } = useTheme();
  
  // Note: Previously initialized a local Convex client here. Removed to prevent
  // an infinite update loop traced to a useEffect in this file. We'll revisit
  // Convex usage on this screen after stabilizing the render cycle.

  // Use Convex moods hook
  // Convex moods hook – its loading state should NOT gate the entire screen to avoid loops.
  const {
    moods: convexMoods,
    // rename to avoid shadowing 'loading' and reduce confusion
    loading: convexMoodsLoading,
    loadRecentMoods,
    isUsingConvex,
  } = useConvexMoods(user?.id, convexClient);

  // Create styles with scaled font sizes
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

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
        const result = await assessmentsApi.isAssessmentDue(user.id);
        setIsAssessmentDue(result.isDue);
        console.log("Assessment due status:", result);
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
    const moodMap: Record<string, string> = {
      // Original 5 moods
      "very-happy": "😄",
      "happy": "🙂",
      "neutral": "�",
      "sad": "🙁",
      "very-sad": "�",
      // New 9 mood grid
      "ecstatic": "🤩",
      "content": "�",
      "displeased": "😕",
      "frustrated": "�",
      "annoyed": "😒",
      "angry": "�",
      "furious": "🤬",
    };
    return moodMap[moodType] || "😐";
  };




  /**
   * Returns label text for mood type
   */
  const getLabelForMood = (moodType: string) => {
    const labelMap: Record<string, string> = {
      // Original 5 moods
      "very-happy": "Very Happy",
      "happy": "Happy",
      "neutral": "Neutral",
      "sad": "Sad",
      "very-sad": "Very Sad",
      // New 9 mood grid
      "ecstatic": "Ecstatic",
      "content": "Content",
      "displeased": "Displeased",
      "frustrated": "Frustrated",
      "annoyed": "Annoyed",
      "angry": "Angry",
      "furious": "Furious",
    };
    return labelMap[moodType] || "Unknown";
  };

  /**
   * Returns appropriate greeting based on time of day
   */
  const getGreeting = () => {
    const hour = new Date().toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: APP_TIME_ZONE });
    const hourNum = Number.parseInt(hour, 10);
    if (hourNum < 12) return "Good Morning";
    if (hourNum < 17) return "Good Afternoon";
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
   * Loads mood data from backend or Convex
   * Note: Removed convexMoods from dependencies to prevent infinite loop
   */
  const fetchRecentMoods = useCallback(async () => {
    // If using Convex hook, moods are already loaded
    if (isUsingConvex) {
      setRecentMoods(convexMoods.slice(0, 3));
      return;
    }
    
    // Fallback to REST API
    try {
      if (user?.id) {
        const data = await moodApi.getRecentMoods(user.id, 3);
        setRecentMoods(data.moods);
      }
    } catch (error) {
      console.log("Error loading mood data:", error);
      setRecentMoods([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isUsingConvex]);

  /**
   * Loads personalized resources based on user's mood patterns
   * Note: Journal analysis temporarily disabled due to network issues
   */
  const fetchResources = useCallback(async () => {
    try {
      // Get all resources
      const allResources = await fetchAllResourcesWithExternal();
      
      // Get recent moods for personalization
      const moodsForAnalysis = isUsingConvex ? convexMoods.slice(0, 7) : recentMoods;
      
      // Get personalized recommendations based on mood patterns only
      const recommendedResources = getPersonalizedRecommendations(
        allResources,
        moodsForAnalysis,
        [], // Journal analysis disabled temporarily
        3 // Limit to 3 recommendations
      );
      
      console.log('[HomeScreen] Personalized recommendations based on mood:', 
        recommendedResources.map(r => `${r.title} (${r.category})`)
      );
      
      setResources(recommendedResources);
    } catch (error) {
      console.error("Error loading resources:", error);
      setResources([]);
    }
  }, [isUsingConvex, convexMoods, recentMoods]);

  // NOTE: We intentionally do NOT copy Convex moods into component state to avoid
  // triggering additional renders. Instead, derive a displayed list below.

  // Separate effect to update resources when moods change
  // Note: Journal recommendations are currently disabled due to network issues
  useEffect(() => {
    if (loading || IS_TEST_ENV) return;
    
    const updatePersonalizedResources = async () => {
      try {
        const allResources = await fetchAllResourcesWithExternal();
        
        // Use convexMoods if available, otherwise use recentMoods state
        const moodsForAnalysis = isUsingConvex ? convexMoods.slice(0, 7) : recentMoods;
        
        // Skip journal analysis for now (empty array)
        const recommendedResources = getPersonalizedRecommendations(
          allResources,
          moodsForAnalysis,
          [], // Journal recommendations disabled temporarily
          3
        );
        
        setResources(recommendedResources);
        console.log('[HomeScreen] Updated personalized recommendations based on moods');
      } catch (error) {
        console.error("Error updating resources:", error);
      }
    };
    
    // Only update if we have mood data
    if (convexMoods.length > 0 || recentMoods.length > 0) {
      updatePersonalizedResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convexMoods.length, recentMoods.length, isUsingConvex, loading, IS_TEST_ENV]);

  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] useFocusEffect start');
      // In tests, short-circuit async work and render the base UI immediately
      if (IS_TEST_ENV) {
        setLoading(false);
        return () => {};
      }

      let isMounted = true;

      const fetchData = async () => {
        if (!isMounted) return;
        setLoading(true);
        
        try {
          // Load profile image
          const loadProfileImage = async () => {
            try {
              const savedImage = await AsyncStorage.getItem('profileImage');
              if (!isMounted) return;
              
              if (savedImage) {
                if (savedImage.startsWith('data:image')) {
                  await AsyncStorage.removeItem("profileImage");
                } else {
                  if (isMounted) setProfileImage(savedImage);
                  return;
                }
              }

              const savedProfileData = await AsyncStorage.getItem('profileData');
              if (!isMounted) return;
              
              if (savedProfileData) {
                const parsedData = JSON.parse(savedProfileData);
                if (parsedData.profileImageUrl) {
                  if (isMounted) setProfileImage(parsedData.profileImageUrl);
                  return;
                }
              }

              if (user?.imageUrl) {
                if (isMounted) setProfileImage(user.imageUrl);
                return;
              }

              if (isMounted) setProfileImage(null);
            } catch (error) {
              console.error('Error loading profile image:', error);
              if (isMounted) setProfileImage(null);
            }
          };

          // Load moods - REST API only (Convex moods are derived directly, not stored)
          const loadMoods = async () => {
            if (!isMounted) return;
            // Only fetch if NOT using Convex
            if (!isUsingConvex) {
              try {
                if (user?.id) {
                  const data = await moodApi.getRecentMoods(user.id, 7); // Get more moods for analysis
                  if (isMounted) {
                    setRecentMoods(data.moods);
                  }
                }
              } catch (error) {
                console.log("Error loading mood data:", error);
                if (isMounted) {
                  setRecentMoods([]);
                }
              }
            }
          };

          // Load recent journal entries for personalized recommendations
          // Commented out REST API call - journals will be fetched from Convex instead
          const loadJournals = async () => {
            if (!isMounted) return;
            
            // For now, skip journal loading to prevent network errors
            // Will implement Convex journal query instead
            if (isMounted) {
              setRecentJournals([]);
            }
          };

          // Load resources with personalization
          const loadResources = async () => {
            if (!isMounted) return;
            
            try {
              const allResources = await fetchAllResourcesWithExternal();
              if (!isMounted) return;
              
              // Initial load with default/random resources
              // Will be updated by the separate useEffect when moods/journals are loaded
              const quickResources = allResources
                .filter(r => r.type === 'Exercise' || r.type === 'Affirmation' || r.type === 'Quote')
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
              
              if (isMounted) {
                setResources(quickResources);
              }
            } catch (error) {
              console.error("Error loading resources:", error);
              if (isMounted) {
                setResources([]);
              }
            }
          };

          // Check assessment status
          const loadAssessmentStatus = async () => {
            if (!isMounted) return;
            
            try {
              if (user?.id) {
                const result = await assessmentsApi.isAssessmentDue(user.id);
                if (isMounted) {
                  setIsAssessmentDue(result.isDue);
                }
                console.log("Assessment due status:", result);
              }
            } catch (error) {
              console.error("Error checking assessment status:", error);
              if (isMounted) {
                setIsAssessmentDue(false);
              }
            }
          };
          
          await Promise.all([
            loadMoods(),
            loadJournals(),
            loadAssessmentStatus(),
            loadProfileImage(),
          ]);
          
          // Load resources after moods and journals are fetched
          await loadResources();
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchData();
      
      return () => {
        isMounted = false;
        console.log('[HomeScreen] useFocusEffect cleanup');
      };
    }, [IS_TEST_ENV, user?.id, user?.imageUrl, isUsingConvex])
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
        timeZone: APP_TIME_ZONE,
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

  // Derive moods to display: Convex (real-time) has priority, else REST-fetched recentMoods
  const displayedRecentMoods = isUsingConvex
    ? convexMoods.slice(0, 3).map(m => ({
        id: m._id as any as string, // ensure we have a string id
        mood_type: m.moodType || m.mood_type || m.type || 'neutral',
        created_at: m.createdAt || m.created_at || new Date().toISOString(),
      }))
    : recentMoods;

  // Only show global loader for initial fetch; ignore convexMoodsLoading to prevent perpetual re-render gating
  if (loading) {
    return (
      <View testID="home-loading" style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <CurvedBackground>
      <View testID="home-screen" style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* Use AppHeader component - handles all navigation and menu */}
        <AppHeader showBack={false} showMenu={true} showNotifications={true} />

        <KeyboardAvoidingView
          style={styles.contentContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            testID="home-scroll-view"
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

             {/* Mood Chart with Streaks Section */}
            {user?.id && (
              <View style={styles.section}>
                <MoodChartSection userId={user.id} />
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
                    testID={action.id === 'crisis' ? 'crisis-support-button' : `quick-access-${action.id}`}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                          { backgroundColor: action.color },
                      ]}
                    >
                      {action.image ? (
                        <OptimizedImage
                          source={action.image}
                          style={[
                            styles.actionImage,
                            action.id === "crisis" && styles.crisisSupportImage,
                          ]}
                          resizeMode="contain"
                          cache="force-cache"
                          loaderSize="small"
                          loaderColor="#666"
                          showErrorIcon={false}
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

            {/* Resources Section */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, flex: 1 }]}>
                  Recommended For You
                </Text>
                <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
              </View>
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
      </View>
    </CurvedBackground>
  );
}

// Create dynamic styles function that accepts scaledFontSize
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
    fontSize: scaledFontSize(24),
    fontWeight: "300",
    color: "#000",
    marginBottom: 4,
  },
  nameText: {
    fontWeight: "700",
    color: "#000",
  },
  subGreetingText: {
    fontSize: scaledFontSize(15),
    color: "#000",
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
     fontSize: scaledFontSize(14),
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
     fontSize: scaledFontSize(16),
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
     fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginTop: 8,
  },
  recentMoods: {
    // backgroundColor moved to theme.colors.surface via inline override
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
  statsCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  distributionList: {
    marginTop: 8,
  },
  distributionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  distributionMood: {
    fontSize: 14,
    fontWeight: "500",
  },
  distributionCount: {
    fontSize: 14,
    fontWeight: "600",
  },
});