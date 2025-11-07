/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import BottomNavigation from "../../../components/BottomNavigation";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import { useTheme } from "../../../contexts/ThemeContext";
import { APP_TIME_ZONE } from "../../../utils/timezone";
import StatusModal from "../../../components/StatusModal";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface MoodEntry {
  id: string;
  mood_type: string;
  intensity: number;
  notes?: string;
  created_at: string;
  mood_emoji: string;
  mood_label: string;
  mood_factors: Array<{ factor: string }>;
}

const { width } = Dimensions.get("window");
const EMOJI_SIZE = width / 4.5;

type MoodType = "very-happy" | "happy" | "neutral" | "sad" | "very-sad";

interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
  color: string;
  scale: Animated.Value;
  opacity: Animated.Value;
}

const MoodTrackingScreen = () => {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const [activeEmoji, setActiveEmoji] = useState<MoodType | null>(null);
  const [activeTab, setActiveTab] = useState("mood");
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideStatusModal = () => {
    setModalVisible(false);
  };

  // Navigation tabs configuration
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

  // Initialize animated values for mood emojis with visual feedback
  const moodOptions = useRef<MoodOption[]>([
    {
      id: "very-happy",
      emoji: "😄",
      label: "Very Happy",
      color: "#4CAF50",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    {
      id: "happy",
      emoji: "🙂",
      label: "Happy",
      color: "#8BC34A",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    {
      id: "neutral",
      emoji: "😐",
      label: "Neutral",
      color: "#FFC107",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    {
      id: "sad",
      emoji: "🙁",
      label: "Sad",
      color: "#FF9800",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    {
      id: "very-sad",
      emoji: "😢",
      label: "Very Sad",
      color: "#F44336",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
  ]).current;

  // Live subscription for recent moods (child component to avoid conditional hook)
  const LiveRecentMoods = ({ userId, onData }: { userId: string; onData: (e: MoodEntry[]) => void }) => {
    const live = useQuery(api.moods.getRecentMoods, { userId, limit: 5 }) as any[] | undefined;
    useEffect(() => {
      if (Array.isArray(live)) {
        onData(live as unknown as MoodEntry[]);
        setLoading(false);
      }
    }, [live, onData]);
    return null;
  };

  // Handle emoji press animation for visual feedback
  const handleEmojiPressIn = (moodId: MoodType) => {
    setActiveEmoji(moodId);
    moodOptions.forEach((emoji) => {
      if (emoji.id === moodId) {
        Animated.spring(emoji.scale, {
          toValue: 1.2,
          useNativeDriver: true,
          friction: 3,
        }).start();
      } else {
        Animated.spring(emoji.opacity, {
          toValue: 0.3,
          useNativeDriver: true,
          friction: 3,
        }).start();
      }
    });
  };

  // Reset emoji animations when press is released
  const handleEmojiPressOut = () => {
    setActiveEmoji(null);
    moodOptions.forEach((emoji) => {
      Animated.parallel([
        Animated.spring(emoji.scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.spring(emoji.opacity, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
      ]).start();
    });
  };

  // Navigate to mood logging screen with selected mood
  const handleMoodPress = (moodId: MoodType) => {
    router.push(`/(app)/mood-tracking/mood-logging?selectedMood=${moodId}`);
  };

  // Render individual mood emoji with animations
  const renderMoodEmoji = (mood: MoodOption) => {
    return (
      <Pressable
        key={mood.id}
        onPressIn={() => handleEmojiPressIn(mood.id)}
        onPressOut={handleEmojiPressOut}
        onPress={() => handleMoodPress(mood.id)}
        style={styles.emojiContainer}
      >
        <Animated.View
          style={[
            styles.emojiWrapper,
            {
              transform: [{ scale: mood.scale }],
              opacity: mood.opacity,
            },
          ]}
        >
          <Text style={styles.emoji}>{mood.emoji}</Text>
          <Text style={[styles.emojiLabel, { color: theme.colors.text }]}>
            {mood.label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* Header with navigation controls */}
        <AppHeader title="Mood Tracker" showBack={true} />

        {/* Main scrollable content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {user?.id ? (
            <LiveRecentMoods userId={user.id} onData={setRecentEntries} />
          ) : null}
          {/* Mood selection section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              How are you feeling?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Tap an emoji to log your mood
            </Text>

            <View style={styles.moodGrid}>
              <View style={styles.moodRow}>
                {moodOptions.slice(0, 3).map(renderMoodEmoji)}
              </View>
              <View style={styles.moodRow}>
                {moodOptions.slice(3, 5).map(renderMoodEmoji)}
              </View>
            </View>
          </View>

          {/* Recent moods section - Limited to 5 entries */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Recent Moods
              </Text>
              <Text style={[styles.entriesCount, { color: theme.colors.textSecondary }]}>
                {recentEntries.length}/5 entries
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Loading your moods...
                </Text>
              </View>
            ) : recentEntries.length > 0 ? (
              <View style={styles.recentMoodsContainer}>
                {recentEntries.slice(0, 5).map((entry, index) => ( // Ensure max 5 entries
                  <View 
                    key={entry.id || index} 
                    style={[
                      styles.moodCard,
                      { 
                        backgroundColor: theme.colors.surface,
                        shadowColor: theme.isDark ? "#000" : "#000",
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.moodCardEmoji,
                        {
                          color: moodOptions.find((m) => m.id === entry.mood_type)
                            ?.color,
                        },
                      ]}
                    >
                      {entry.mood_emoji}
                    </Text>
                    <View style={styles.moodCardContent}>
                      <Text style={[styles.moodCardTitle, { color: theme.colors.text }]}>
                        {entry.mood_label}
                      </Text>
                      <Text style={[styles.moodCardDate, { color: theme.colors.textSecondary }]}>
                        {new Date(entry.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: APP_TIME_ZONE,
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                <Ionicons 
                  name="happy-outline" 
                  size={48} 
                  color={theme.colors.textSecondary} 
                />
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  No recent entries
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  Start tracking your mood by selecting an emoji above
                </Text>
              </View>
            )}
          </View>

          {/* Navigation to view full mood history */}
          <TouchableOpacity
            style={[
              styles.historyLink,
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.isDark ? "#000" : "#000",
              }
            ]}
            onPress={() => router.push("../mood-tracking/mood-history")}
          >
            <Text style={[styles.historyLinkText, { color: theme.colors.primary }]}>
              View Mood History
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* Extra bottom padding for better scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Status Modal for error handling */}
        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideStatusModal}
          buttonText="OK"
        />

        {/* Bottom navigation bar */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
};

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: scaledFontSize(16), // Base size 16px
    marginBottom: Spacing.lg,
    color: "#666",
  },
  entriesCount: {
    fontSize: scaledFontSize(12), // Base size 12px
  },
  moodGrid: {
    marginTop: Spacing.md,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.xl,
  },
  emojiContainer: {
    alignItems: "center",
    width: EMOJI_SIZE,
  },
  emojiWrapper: {
    alignItems: "center",
  },
  emoji: {
    fontSize: EMOJI_SIZE * 0.7,
    marginBottom: Spacing.sm,
  },
  emojiLabel: {
    fontSize: scaledFontSize(14), // Base size 14px
    fontWeight: "500",
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: Spacing.sm,
    color: "#666",
  },
  recentMoodsContainer: {
    // Container for recent moods cards
  },
  moodCard: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  moodCardEmoji: {
    fontSize: scaledFontSize(28), // Base size 28px
    marginRight: Spacing.md,
  },
  moodCardContent: {
    flex: 1,
  },
  moodCardTitle: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  moodCardDate: {
    fontSize: scaledFontSize(14), // Base size 14px
    color: "#666",
  },
  emptyState: {
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: scaledFontSize(16), // Base size 16px
    marginTop: Spacing.md,
    fontWeight: "500",
    color: "#666",
  },
  emptyStateSubtext: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: Spacing.xs,
    textAlign: "center",
    color: "#666",
  },
  historyLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyLinkText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "500",
  },
  bottomPadding: {
    height: 140, 
  },
});

export default MoodTrackingScreen;