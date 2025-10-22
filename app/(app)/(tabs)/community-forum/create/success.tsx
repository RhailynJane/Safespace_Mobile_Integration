/**
 * Enhanced Post Success Screen with Modern UI Design
 * Features improved visuals, better animations, and additional navigation options
 * LLM Prompt: Add comprehensive comments to this React Native component.
 * Reference: chat.deepseek.com
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";
import { useTheme } from "../../../../../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function PostSuccessScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("community-forum");
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Success animation sequence
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  /**
   * Handles navigation to view the newly created post
   */
  const handleViewPost = () => {
    router.replace("/(app)/(tabs)/community-forum");
  };

  /**
   * Handles navigation to create another post
   */
  const handleCreateAnother = () => {
    router.push("/community-forum/create");
  };

  /**
   * Handles navigation to community home
   */
  const handleBrowseCommunity = () => {
    router.replace("/(app)/(tabs)/community-forum/main");
  };

  // Bottom navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Handles bottom tab navigation
   * @param tabId - ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Success" showBack={false} />

        <View style={styles.content}>
          {/* Animated Success Card */}
          <Animated.View 
            style={[
              styles.successCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {/* Success Icon with Celebration Effect */}
            <View style={styles.iconContainer}>
              <View style={styles.successIconBackground}>
                <Ionicons name="checkmark" size={48} color="#FFFFFF" />
              </View>
              {/* Celebration dots */}
              <View style={styles.celebrationDot1} />
              <View style={styles.celebrationDot2} />
              <View style={styles.celebrationDot3} />
            </View>

            {/* Success Title */}
            <Text style={styles.title}>Post Published!</Text>

            {/* Success Message */}
            <Text style={styles.message}>
              Your voice has been shared with the community.{"\n"}
              Your story matters and can help others feel less alone.
            </Text>

            {/* Success Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={20} color="#7CB9A9" />
                <Text style={styles.statText}>Visible to community</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart-outline" size={20} color="#7CB9A9" />
                <Text style={styles.statText}>Ready for reactions</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={20} color="#7CB9A9" />
                <Text style={styles.statText}>Open for support</Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewPost}
            >
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>View My Post</Text>
            </TouchableOpacity>

            {/* Secondary Actions */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCreateAnother}
              >
                <Ionicons name="add-circle" size={18} color="#7CB9A9" />
                <Text style={styles.secondaryButtonText}>Create Another</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBrowseCommunity}
              >
                <Ionicons name="compass" size={18} color="#7CB9A9" />
                <Text style={styles.secondaryButtonText}>Browse Community</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

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
  curvedBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: width * 0.9,
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#7CB9A9",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(124, 185, 169, 0.1)",
  },
  iconContainer: {
    position: "relative",
    marginBottom: 24,
  },
  successIconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationDot1: {
    position: "absolute",
    top: -10,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFD54F",
    shadowColor: "#FFD54F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  celebrationDot2: {
    position: "absolute",
    bottom: -5,
    left: -10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#7CB9A9",
    shadowColor: "#7CB9A9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  celebrationDot3: {
    position: "absolute",
    top: -5,
    left: -15,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF6B6B",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 34,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  statsContainer: {
    width: "100%",
    marginBottom: 32,
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 8,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7CB9A9",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    gap: 12,
    shadowColor: "#7CB9A9",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E8F5E9",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#7CB9A9",
    fontSize: 14,
    fontWeight: "600",
  },
  // Legacy styles (kept for reference)
  headerContainer: {
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  communityPostButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#000",
  },
  communityPostButtonText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "600",
  },
  headerRight: {
    width: 24,
  },
  footer: {
    flexDirection: "column",
    padding: 20,
    backgroundColor: "#F2F2F7",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    gap: 12,
    marginBottom: 40,
  },
});