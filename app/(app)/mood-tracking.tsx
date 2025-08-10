import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

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
  const { user, logout } = useAuth();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEmoji, setActiveEmoji] = useState<MoodType | null>(null);

  // Initialize animated values
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

  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/index");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/profile");
      },
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        setSideMenuVisible(false);
        console.log("Self-Assessment");
      },
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        setSideMenuVisible(false);
        console.log("Mood Tracking");
      },
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        setSideMenuVisible(false);
        console.log("Journaling");
      },
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        setSideMenuVisible(false);
        console.log("Resources");
      },
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        setSideMenuVisible(false);
        console.log("Crisis Support");
      },
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/appointments");
      },
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        setSideMenuVisible(false);
        console.log("Community Forum");
      },
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        setSideMenuVisible(false);
        console.log("Video Consultations");
      },
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: async () => {
        try {
          await logout();
          setSideMenuVisible(false);
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
    },
  ];

  useEffect(() => {
    if (user?.uid) {
      loadRecentEntries();
    }

    return () => {
      moodOptions.forEach((emoji) => {
        emoji.scale.stopAnimation();
        emoji.opacity.stopAnimation();
      });
    };
  }, [user?.uid]);

  const loadRecentEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user!.uid)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentEntries(data || []);
    } catch (error) {
      console.error("Failed to load mood history:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleMoodPress = (moodId: MoodType) => {
    router.push(`/(app)/mood-logging?selectedMood=${moodId}`);
  };

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
          <Text style={[styles.emojiLabel, { color: "#000" }]}>
            {mood.label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mood Tracker</Text>
        <TouchableOpacity
          onPress={() => setSideMenuVisible(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Mood selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <Text style={styles.sectionSubtitle}>
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

        {/* Recent moods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Moods</Text>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : recentEntries.length > 0 ? (
            recentEntries.map((entry, index) => (
              <View key={index} style={styles.moodCard}>
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
                  <Text style={styles.moodCardTitle}>{entry.mood_label}</Text>
                  <Text style={styles.moodCardDate}>
                    {new Date(entry.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent entries</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Side Menu */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sideMenuVisible}
        onRequestClose={() => setSideMenuVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSideMenuVisible(false)}
          />
          <View style={styles.sideMenu}>
            <View style={styles.sideMenuHeader}>
              <View style={styles.profileContainer}>
                <Text style={styles.profileName}>
                  {user?.displayName?.split(" ")[0] || "User"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSideMenuVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sideMenuItem}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon as any} size={20} color="#7FDBDA" />
                  <Text style={styles.sideMenuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: "600",
  },
  menuButton: {
    padding: Spacing.sm,
  },
  scrollContainer: {
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
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
    color: "#000",
  },
  moodCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
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
    color: Colors.textSecondary,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: "center",
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    padding: Spacing.lg,
  },
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sideMenu: {
    width: width * 0.75,
    backgroundColor: "#FFFFFF",
    height: "100%",
  },
  sideMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F9F9F9",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 5,
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
});

export default MoodTrackingScreen;
