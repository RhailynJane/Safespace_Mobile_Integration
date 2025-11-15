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
import { useState, useEffect, useMemo } from "react";
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
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { useTheme } from "../../../contexts/ThemeContext";

/**
 * ResourceDetailScreen Component
 * 
 * Provides an immersive reading experience for individual mental health resources
 * with enhanced visual presentation and user engagement features
 */
// Client-side resource shape
interface ClientResource {
  id: string;
  title: string;
  content: string;
  author?: string;
  type: string;
  category: string;
  imageEmoji: string;
  backgroundColor: string;
}

export default function ResourceDetailScreen() {
  const { theme, scaledFontSize } = useTheme();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false); // Loading state for future enhancements

  /**
   * Create styles dynamically based on text size scaling
   * Uses useMemo for performance optimization
   */
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  /**
   * Extract and structure resource data from navigation parameters
   * Provides type safety for resource properties
   */
  // Determine if we received full data via navigation params
  const paramHasContent = !!params.content && !!params.title;
  const passedId = params.id as string | undefined;

  // Only attempt Convex fetch if we did NOT receive full content AND the id looks like a Convex id
  // (Convex Ids are opaque strings; we'll just ensure we have something non-empty and no 'external-' prefix)
  const shouldFetchFromConvex = !paramHasContent && !!passedId && !passedId.startsWith("external-");

  // Always pass the function, conditionally pass args using "skip" to avoid runtime errors
  const convexResource = useQuery(
    api.resources.getResource,
    shouldFetchFromConvex ? { resourceId: passedId as any } : "skip"
  ) as (any | null | undefined);

  // Merge navigation params with Convex result (Convex overrides if present)
  const resource: ClientResource = {
    id: passedId || convexResource?.id || "unknown",
    title: (convexResource?.title || (params.title as string) || "Untitled") as string,
    content: (convexResource?.content || (params.content as string) || "No content available.") as string,
    author: (convexResource?.author || (params.author as string) || "") || undefined,
    type: (convexResource?.type || (params.type as string) || "Resource") as string,
    category: (convexResource?.category || (params.category as string) || "motivation") as string,
    // Convex returns image_emoji; params may provide imageEmoji
    imageEmoji: (convexResource?.image_emoji || convexResource?.imageEmoji || (params.imageEmoji as string) || "📄") as string,
    backgroundColor: (convexResource?.backgroundColor || (params.backgroundColor as string) || "#FFFFFF") as string,
  };

  // Show a loading indicator while attempting to fetch from Convex if we lack initial content
  const isLoadingFromConvex = shouldFetchFromConvex && convexResource === undefined;

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
    return colors[resource.category] || theme.colors.primary; // Use theme primary as default
  };

  // Loading state UI - Currently minimal as data comes from params
  if (loading || isLoadingFromConvex) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <AppHeader title="Resource" showBack={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
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
            <Text style={[styles.title, { color: theme.colors.text }]}>{resource.title}</Text>

            {/* Author Attribution - For quotes and authored content */}
            {resource.author && resource.author !== "Unknown" && (
              <Text style={[styles.author, { color: theme.colors.textSecondary }]}>By {resource.author}</Text>
            )}

            {/* Metadata - Resource type and additional info */}
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="document-text" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{resource.type}</Text>
              </View>
            </View>
          </View>

          {/* Resource Content Section - Main reading area */}
          <View style={styles.contentContainer}>
            <Text style={[styles.contentTitle, { color: theme.colors.text }]}>Content</Text>
            <View style={[styles.contentCard, { 
              backgroundColor: theme.colors.surface,
              borderLeftColor: theme.colors.primary 
            }]}>
              <Text style={[styles.contentText, { color: theme.colors.text }]}>{resource.content}</Text>
            </View>
          </View>

          {/* Reflection Section - Prompts for user engagement */}
          <View style={[styles.reflectionSection, { 
            backgroundColor: theme.isDark ? '#FFF3E0' : '#FFF9E6',
            borderColor: theme.isDark ? '#FFE0B2' : '#FFE082'
          }]}>
            <Text style={[styles.reflectionTitle, { color: theme.isDark ? '#E65100' : '#F57C00' }]}>💭 Take a Moment</Text>
            <Text style={[styles.reflectionText, { color: theme.isDark ? '#5D4037' : '#666' }]}>
              Reflect on how this resonates with you. Consider journaling your
              thoughts or discussing with someone you trust.
            </Text>
          </View>

          {/* Related Actions Section - Navigation suggestions */}
          <View style={styles.relatedActions}>
            <Text style={[styles.relatedTitle, { color: theme.colors.text }]}>What&apos;s Next?</Text>
            
            {/* Return to Home Action */}
            <TouchableOpacity
              style={[styles.relatedCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => router.push("/(app)/(tabs)/home")}
            >
              <View style={[styles.relatedIconContainer, { backgroundColor: theme.colors.borderLight }]}>
                <Text style={styles.relatedIcon}>🏠</Text>
              </View>
              <View style={styles.relatedContent}>
                <Text style={[styles.relatedCardTitle, { color: theme.colors.text }]}>Return to Home</Text>
                <Text style={[styles.relatedCardText, { color: theme.colors.textSecondary }]}>
                  Continue your wellness journey
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Explore More Resources Action */}
            <TouchableOpacity
              style={[styles.relatedCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => router.back()}
            >
              <View style={[styles.relatedIconContainer, { backgroundColor: theme.colors.borderLight }]}>
                <Text style={styles.relatedIcon}>📚</Text>
              </View>
              <View style={styles.relatedContent}>
                <Text style={[styles.relatedCardTitle, { color: theme.colors.text }]}>Explore More</Text>
                <Text style={[styles.relatedCardText, { color: theme.colors.textSecondary }]}>
                  Browse other resources
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
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
 * Now includes dynamic font scaling via scaledFontSize parameter
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
    fontSize: scaledFontSize(11),
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
    fontSize: scaledFontSize(26),
    fontWeight: "700",
    lineHeight: 34, // Improved readability for longer titles
    textAlign: "center",
  },
  author: {
    fontSize: scaledFontSize(16),
    fontStyle: "italic",
    marginBottom: 15,
    textAlign: "center",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    justifyContent: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: scaledFontSize(14),
  },
  
  // Content Section - Main reading area
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  contentTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    marginBottom: 15,
  },
  contentCard: {
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  contentText: {
    fontSize: scaledFontSize(16),
    lineHeight: 26, // Enhanced readability for longer content
    letterSpacing: 0.3, // Improved text rendering
  },
  
  // Reflection Section - User engagement prompts
  reflectionSection: {
    marginHorizontal: 20,
    marginTop: 25,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
  },
  reflectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    marginBottom: 10,
  },
  reflectionText: {
    fontSize: scaledFontSize(14),
    lineHeight: 22,
  },
  
  // Related Actions Section - Navigation suggestions
  relatedActions: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  relatedTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    marginBottom: 15,
  },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    marginBottom: 3,
  },
  relatedCardText: {
    fontSize: scaledFontSize(13),
  },
});