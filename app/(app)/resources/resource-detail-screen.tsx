/**
 * ResourceDetailScreen - React Native Component
 * 
 * Detailed view screen for individual mental health resources featuring:
 * - Full resource content display with rich formatting
 * - Social sharing capabilities
 * - Category-based visual theming
 * - Reflection prompts and next steps
 * - Related action suggestions
 * 
 * Features:
 * - Dynamic color theming based on resource category
 * - Share functionality for quotes and affirmations
 * - Large emoji visual representation
 * - Reflection section for user engagement
 * - Navigation suggestions for continued journey
 * - Responsive design with curved background
 * 
 * Content Types Supported:
 * - Inspirational quotes with author attribution
 * - Daily affirmations for positive reinforcement
 * - Educational articles and mental health resources
 * - Mindfulness exercises and techniques
 * 
 * Data Flow:
 * - Receives resource data via navigation parameters
 * - Dynamically applies category-based styling
 * - Handles social sharing with formatted messages
 * - Provides contextual navigation options
 * 
 * LLM Prompt: Add comprehensive comments to this React Native component.
 * Reference: chat.deepseek.com
 */

// app/(app)/resources/resource-detail-screen.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { useTheme } from "../../../contexts/ThemeContext";

/**
 * ResourceDetailScreen Component
 * 
 * Provides an immersive reading experience for individual mental health resources
 * with enhanced visual presentation and user engagement features
 */
export default function ResourceDetailScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false); // Loading state for future enhancements

  /**
   * Extract and structure resource data from navigation parameters
   * Provides type safety for resource properties
   */
  const resource = {
    id: params.id as string,
    title: params.title as string,
    content: params.content as string,
    author: params.author as string,
    type: params.type as string,
    category: params.category as string,
    imageEmoji: params.imageEmoji as string,
    backgroundColor: params.backgroundColor as string,
  };

  /**
   * Handle social sharing of resource content
   * Formats message with proper attribution for quotes
   */
  const handleShare = async () => {
    try {
      const message = resource.author
        ? `${resource.title}\n\n"${resource.content}"\n\n— ${resource.author}`
        : `${resource.title}\n\n${resource.content}`;

      await Share.share({ message });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  /**
   * Get category-specific color for visual theming
   * Maps category names to consistent brand colors
   */
  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      stress: "#FF8A65",      // Calming orange
      anxiety: "#81C784",     // Soothing green
      depression: "#64B5F6",  // Comforting blue
      sleep: "#4DD0E1",       // Tranquil teal
      motivation: "#FFB74D",  // Energetic orange
      mindfulness: "#BA68C8", // Spiritual purple
    };
    return colors[resource.category] || "#4CAF50"; // Default brand green
  };

  // Loading state UI - Currently minimal as data comes from params
  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Resource" showBack={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Resource" showBack={true} />

        {/* Main Content Scroll Area */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Resource Header Section - Visual identity and metadata */}
          <View style={styles.header}>
            {/* Category Badge - Visual category indicator */}
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor() },
              ]}
            >
              <Text style={styles.categoryText}>
                {resource.category.toUpperCase()}
              </Text>
            </View>

            {/* Title Row - Large emoji and visual representation */}
            <View style={styles.titleRow}>
              <View style={[
                styles.emojiContainer,
                { backgroundColor: resource.backgroundColor }
              ]}>
                <Text style={styles.emojiLarge}>{resource.imageEmoji}</Text>
              </View>
            </View>

            {/* Resource Title - Primary content identifier */}
            <Text style={styles.title}>{resource.title}</Text>

            {/* Author Attribution - For quotes and authored content */}
            {resource.author && resource.author !== "Unknown" && (
              <Text style={styles.author}>By {resource.author}</Text>
            )}

            {/* Metadata - Resource type and additional info */}
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="document-text" size={16} color="#666" />
                <Text style={styles.metaText}>{resource.type}</Text>
              </View>
            </View>
          </View>

          {/* Action Bar - User interactions with the resource */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#666" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Resource Content Section - Main reading area */}
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Content</Text>
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{resource.content}</Text>
            </View>
          </View>

          {/* Reflection Section - Prompts for user engagement */}
          <View style={styles.reflectionSection}>
            <Text style={styles.reflectionTitle}>💭 Take a Moment</Text>
            <Text style={styles.reflectionText}>
              Reflect on how this resonates with you. Consider journaling your
              thoughts or discussing with someone you trust.
            </Text>
          </View>

          {/* Related Actions Section - Navigation suggestions */}
          <View style={styles.relatedActions}>
            <Text style={styles.relatedTitle}>What&apos;s Next?</Text>
            
            {/* Return to Home Action */}
            <TouchableOpacity
              style={styles.relatedCard}
              onPress={() => router.push("/(app)/(tabs)/home")}
            >
              <View style={styles.relatedIconContainer}>
                <Text style={styles.relatedIcon}>🏠</Text>
              </View>
              <View style={styles.relatedContent}>
                <Text style={styles.relatedCardTitle}>Return to Home</Text>
                <Text style={styles.relatedCardText}>
                  Continue your wellness journey
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {/* Explore More Resources Action */}
            <TouchableOpacity
              style={styles.relatedCard}
              onPress={() => router.back()}
            >
              <View style={styles.relatedIconContainer}>
                <Text style={styles.relatedIcon}>📚</Text>
              </View>
              <View style={styles.relatedContent}>
                <Text style={styles.relatedCardTitle}>Explore More</Text>
                <Text style={styles.relatedCardText}>
                  Browse other resources
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CurvedBackground>
  );
}

/**
 * Stylesheet for ResourceDetailScreen component
 * Organized by content sections with consistent visual hierarchy
 * Uses category-based theming and accessible design patterns
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, // Extra padding for comfortable scrolling
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Header Section - Resource identity and metadata
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 1, // Enhanced readability for uppercase
  },
  titleRow: {
    marginBottom: 15,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  emojiLarge: {
    fontSize: 40, // Large emoji for visual impact
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    lineHeight: 34, // Improved readability for longer titles
  },
  author: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 15,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  
  // Action Bar - User interaction controls
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#FAFAFA", // Subtle background for action area
    justifyContent: "center", // Center the single button
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#FFF",
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  
  // Content Section - Main reading area
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  contentCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50", // Accent border for visual emphasis
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26, // Enhanced readability for longer content
    color: "#333",
    letterSpacing: 0.3, // Improved text rendering
  },
  
  // Reflection Section - User engagement prompts
  reflectionSection: {
    marginHorizontal: 20,
    marginTop: 25,
    padding: 20,
    backgroundColor: "#FFF9E6", // Warm yellow background for reflection
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFE082", // Subtle border for definition
  },
  reflectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F57C00", // Warm orange for attention
    marginBottom: 10,
  },
  reflectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666",
  },
  
  // Related Actions Section - Navigation suggestions
  relatedActions: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  relatedIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  relatedIcon: {
    fontSize: 24,
  },
  relatedContent: {
    flex: 1,
  },
  relatedCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  relatedCardText: {
    fontSize: 13,
    color: "#666",
  },
});