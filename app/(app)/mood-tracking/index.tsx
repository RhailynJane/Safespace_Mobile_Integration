/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useRef, useCallback } from "react";
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
import { moodApi, MoodEntry } from "../../../utils/moodApi";
import { useTheme } from "../../../contexts/ThemeContext";

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
  const { theme } = useTheme();
  const { user } = useUser();
  const [activeEmoji, setActiveEmoji] = useState<MoodType | null>(null);
  const [activeTab, setActiveTab] = useState("mood");
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Load recent moods from API - limited to 5 entries
  const loadRecentMoods = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await moodApi.getRecentMoods(user.id, 5); // Limit to 5 entries
      setRecentEntries(data.moods || []);
    } catch (error) {
      console.error("Error loading recent moods:", error);
      // Silent fail - just show empty state
      setRecentEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load recent moods when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecentMoods();
    }, [loadRecentMoods])
  );

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

const styles = StyleSheet.create({
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
    ...Typography.title,
    fontSize: 20,
    fontWeight: "600",
  },
  sectionSubtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  entriesCount: {
    ...Typography.caption,
    fontSize: 12,
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
    ...Typography.caption,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...Typography.caption,
    marginTop: Spacing.sm,
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
    fontSize: 28,
    marginRight: Spacing.md,
  },
  moodCardContent: {
    flex: 1,
  },
  moodCardTitle: {
    ...Typography.body,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  moodCardDate: {
    ...Typography.caption,
  },
  emptyState: {
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    ...Typography.body,
    marginTop: Spacing.md,
    fontWeight: "500",
  },
  emptyStateSubtext: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textAlign: "center",
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
    ...Typography.body,
    fontWeight: "500",
  },
  bottomPadding: {
    height: 140, 
  },
});

export default MoodTrackingScreen;