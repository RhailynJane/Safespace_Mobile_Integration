/* eslint-disable react-hooks/exhaustive-deps */
/**
 * PostDetailScreen - React Native Component
 * 
 * This screen displays detailed view of a community forum post with:
 * - Post content, author info, and metadata
 * - Interactive emoji reactions system
 * - Bookmark functionality
 * - Related posts suggestions
 * - Real-time reaction updates
 * 
 * Features:
 * - Gesture support for reaction picker
 * - Loading states and error handling
 * - Responsive design with curved background
 * - Integration with community API
 * - User authentication checks
 * 
 * LLM Prompt: Add comprehensive comments to this React Native component.
 * Reference: chat.deepseek.com
 */

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import { useState, useEffect, useMemo } from "react";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useTheme } from "../../../../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import avatarEvents from "../../../../utils/avatarEvents";
import { makeAbsoluteUrl } from "../../../../utils/apiBaseUrl";
import { APP_TIME_ZONE } from "../../../../utils/timezone";
import OptimizedImage from "../../../../components/OptimizedImage";
import StatusModal from "../../../../components/StatusModal";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";

// Available emoji reactions for users to express emotions on posts
const EMOJI_REACTIONS = ["❤️", "👍", "😊", "😢", "😮", "🔥"];

/**
 * Main component for displaying post details with interactive features
 */
export default function PostDetailScreen() {
  const { theme, scaledFontSize } = useTheme();
  // Extract post ID from navigation parameters
  const params = useLocalSearchParams();
  // Convex document ids are strings; do not parse as number
  const postId = params.id as string;
  const { user } = useUser();
  
  // Use Convex client from provider
  const convex = useConvex();
  
  // State management for post data and UI interactions
  const [post, setPost] = useState<any>(null); // Current post data
  const [loading, setLoading] = useState(true); // Loading state
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]); // Related posts suggestions
  const [userReaction, setUserReaction] = useState<string | null>(null); // Current user's reaction
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false); // Reaction picker visibility
  const [bookmarked, setBookmarked] = useState(false); // Bookmark status
  const [reacting, setReacting] = useState(false); // Reaction update in progress
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Error");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  /**
   * Show error modal with custom title and message
   */
  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  /**
   * Show success modal with custom message
   */
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  // Load and subscribe to profile image updates for current user (for self-authored posts fallback)
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const stored = await AsyncStorage.getItem("profileImage");
        if (stored) {
          setProfileImage(stored);
          return;
        }
        if (user?.imageUrl) {
          setProfileImage(user.imageUrl);
        }
      } catch (e) {
        console.warn("PostDetail: failed to load profile image", e);
      }
    };

    loadProfileImage();
    const unsub = avatarEvents.subscribe((url) => {
      setProfileImage(url ?? null);
    });
    return () => {
      unsub();
    };
  }, [user?.imageUrl]);

  // Normalize any avatar URI
  const normalizeImageUri = (uri?: string | null): string | null => {
    if (!uri) return null;
    if (uri.startsWith("data:image")) return null; // block base64
    if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
    if (uri.startsWith("/")) return makeAbsoluteUrl(uri);
    return uri;
  };

  // Append size params for consistent avatar rendering
  const withSizeParams = (uri?: string | null, w = 48, h = 48): string | null => {
    if (!uri) return null;
    try {
      const hasW = /[?&]w=/.test(uri);
      const hasH = /[?&]h=/.test(uri);
      if (hasW && hasH) return uri;
      const sep = uri.includes('?') ? '&' : '?';
      return `${uri}${sep}fit=crop&w=${w}&h=${h}`;
    } catch {
      return uri;
    }
  };

  /**
   * Load post data when component mounts or postId changes
   */
  useEffect(() => {
    loadPostData();
  }, [postId]);

  /**
   * Fetches post details, related posts, and user-specific data
   */
  const loadPostData = async () => {
    try {
      setLoading(true);
      
      // Load all posts via Convex (includes author enrichment)
      const allPosts = await convex.query(api.posts.list, { limit: 50 });
      
      // Find current post
  const currentPost = allPosts.find((p: any) => p._id === postId);
      if (currentPost) {
        // Prefer enriched author fields from backend
        const authorName = currentPost.authorName || currentPost.author_name || currentPost.userName || "Community Member";
        const authorImageUrl = currentPost.authorImage || currentPost.author_image_url || currentPost.profile_image_url || null;
        const authorId = currentPost.authorId || currentPost.clerk_user_id || currentPost.user_id || null;

        setPost({
          id: currentPost._id,
          title: currentPost.title,
          content: currentPost.content,
          category: currentPost.category,
          author_name: authorName,
          authorImageUrl,
          clerk_user_id: authorId,
          created_at: new Date(currentPost.createdAt ?? currentPost.created_at ?? Date.now()).toISOString(),
          imageUrls: currentPost.imageUrls || [],
          mood: currentPost.mood || null,
          reactions: (() => {
            // Normalize reactions to object {emoji: count}
            if (currentPost.reactions && typeof currentPost.reactions === 'object' && !Array.isArray(currentPost.reactions)) {
              return currentPost.reactions;
            }
            if (Array.isArray(currentPost.reactionCounts)) {
              const entries = currentPost.reactionCounts.map((r: any) => [r.e || r.emoji, r.c || r.count]);
              return Object.fromEntries(entries);
            }
            return {};
          })(),
        });
      }
      
      // Compute simple similar posts (category + text overlap)
      const tokenize = (text: string) => (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);

      const currentTokens = tokenize(`${currentPost?.title || ''} ${currentPost?.content || ''}`);
      const currentSet = new Set(currentTokens);

      const jaccard = (a: Set<string>, b: Set<string>) => {
        const inter = [...a].filter(x => b.has(x)).length;
        const uni = new Set([...a, ...b]).size;
        return uni === 0 ? 0 : inter / uni;
      };

      const related = allPosts
        .filter((p: any) => p._id !== postId)
        .map((p: any) => {
          const tokens = tokenize(`${p.title || ''} ${p.content || ''}`);
          const set = new Set(tokens);
          const score = jaccard(currentSet, set) + (p.category === currentPost?.category ? 0.2 : 0);
          return { p, score };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3)
        .map(({ p }: any) => ({
          id: p._id,
          title: p.title,
          content: p.content,
          category: p.category,
          author_name: p.authorName || p.author_name || 'Community Member',
          reactions: (() => {
            if (p.reactions && typeof p.reactions === 'object' && !Array.isArray(p.reactions)) return p.reactions;
            if (Array.isArray(p.reactionCounts)) {
              const entries = p.reactionCounts.map((r: any) => [r.e || r.emoji, r.c || r.count]);
              return Object.fromEntries(entries);
            }
            return {};
          })(),
        }));
      setRelatedPosts(related);
      
      // Load user-specific data if authenticated
      if (user?.id) {
        await loadUserReaction();
        await checkIfBookmarked();
      }
      
    } catch (error) {
      console.error('Error loading post:', error);
      showError("Error", "Failed to load post. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches the current user's reaction to this post
   */
  const loadUserReaction = async () => {
    if (!user?.id) return;
    
    try {
      const reaction = await convex.query(api.posts.getUserReaction, { 
        postId: postId as any 
      });
      setUserReaction(reaction);
    } catch (error) {
      console.error('Error loading user reaction:', error);
    }
  };

  /**
   * Checks if the current user has bookmarked this post
   */
  const checkIfBookmarked = async () => {
    if (!user?.id) return;
    
    try {
      const isBookmarked = await convex.query(api.posts.isBookmarked, { 
        postId: postId as any 
      });
      setBookmarked(isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  /**
   * Handles emoji reaction selection and updates post reaction data
   * @param emoji - The selected emoji reaction
   */
  const handleReactionPress = async (emoji: string) => {
    if (!user?.id) {
      showError("Sign In Required", "Please sign in to react to posts");
      return;
    }

    if (reacting) return; // Prevent multiple simultaneous reactions

    try {
      setReacting(true);
      
      console.log('📤 Reacting to post via Convex...');
      await convex.mutation(api.posts.react, { 
        postId: postId as any,
        emoji 
      });
      
      setUserReaction(emoji);
      
      setReactionPickerVisible(false);
      showSuccess('Reaction updated successfully!');
    } catch (error) {
      console.error('Error updating reaction:', error);
      showError("Reaction Failed", "Failed to update reaction. Please try again.");
    } finally {
      setReacting(false);
    }
  };

  /**
   * Toggles bookmark status for the current post
   */
  const handleBookmarkPress = async () => {
    if (!user?.id) {
      showError("Sign In Required", "Please sign in to bookmark posts");
      return;
    }

    try {
      const result = await convex.mutation(api.posts.toggleBookmark, { 
        postId: postId as any 
      });
      setBookmarked(result.bookmarked);
      showSuccess(result.bookmarked ? "Post bookmarked!" : "Bookmark removed");
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showError("Bookmark Failed", "Failed to update bookmark. Please try again.");
    }
  };

  /**
   * Calculates total number of reactions across all emojis
   * @param reactions - Object containing emoji:count pairs
   * @returns Total reaction count
   */
  const getTotalReactions = (reactions: { [key: string]: number }) => {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  /**
   * Formats timestamp into relative time string
   * @param timestamp - ISO timestamp string
   * @returns Human-readable time difference
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString([], { timeZone: APP_TIME_ZONE });
  };

  /**
   * Gets all possible reactions including zero-count ones for consistent UI
   * @returns Object with all emoji reactions and their counts
   */
  const getAllReactions = () => {
    const baseReactions: { [key: string]: number } = {};
    
    // Initialize with all possible reactions at 0 count
    EMOJI_REACTIONS.forEach(emoji => {
      baseReactions[emoji] = 0;
    });
    
    // Merge with actual reactions from post data
    if (post?.reactions) {
      Object.entries(post.reactions).forEach(([emoji, count]) => {
        baseReactions[emoji] = count as number;
      });
    }
    
    return baseReactions;
  };

  // Loading state UI
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CurvedBackground style={styles.curvedBackground} />
        <AppHeader title="Post Detail" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7CB9A9" />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state UI for missing post
  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CurvedBackground style={styles.curvedBackground} />
        <AppHeader title="Post Detail" showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={scaledFontSize(64)} color="#E0E0E0" />
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Post not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const allReactions = getAllReactions();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CurvedBackground style={styles.curvedBackground} />
      <AppHeader title="Post Detail" showBack={true} />

      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Post Card Container */}
          <View style={[styles.postCard, { backgroundColor: theme.colors.surface }]}>
            {/* Post Header with Author Info */}
            <View style={styles.postHeader}>
              <View style={styles.avatarContainer}>
                {(() => {
                  // Prefer author image from API if present
                  const authorImgRaw = normalizeImageUri(
                    post?.author_image_url || post?.profile_image_url || post?.authorImageUrl
                  );
                  const authorImg = withSizeParams(authorImgRaw, 48, 48);
                  // Fallback to current user's avatar if they authored this post
                  const authorIdCandidates = [
                    post?.clerk_user_id,
                    post?.clerkUserId,
                    post?.author_id,
                    post?.user_id,
                  ].filter(Boolean);
                  const isMyPost = authorIdCandidates.includes(user?.id);
                  const selfImg = withSizeParams(normalizeImageUri(profileImage), 48, 48);

                  if (authorImg) {
                    return (
                      <OptimizedImage 
                        source={{ uri: authorImg }} 
                        style={styles.avatarImage}
                        cache="force-cache"
                        loaderSize="small"
                        loaderColor="#7CB9A9"
                        showErrorIcon={false}
                      />
                    );
                  }
                  if (isMyPost && selfImg) {
                    return (
                      <OptimizedImage 
                        source={{ uri: selfImg }} 
                        style={styles.avatarImage}
                        cache="force-cache"
                        loaderSize="small"
                        loaderColor="#7CB9A9"
                        showErrorIcon={false}
                      />
                    );
                  }
                  return (
                    <Text style={styles.avatarText}>
                      {post.author_name?.charAt(0) || 'U'}
                    </Text>
                  );
                })()}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>{post.author_name || 'Anonymous User'}</Text>
                <Text style={[styles.postMeta, { color: theme.colors.textSecondary }]}>
                  {formatTimestamp(post.created_at)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={handleBookmarkPress}
              >
                <Ionicons
                  name={bookmarked ? "bookmark" : "bookmark-outline"}
                  size={scaledFontSize(24)}
                  color={bookmarked ? "#FFA000" : "#666"}
                />
              </TouchableOpacity>
            </View>

            {/* Category Badge */}
            {post.category_name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{post.category_name}</Text>
              </View>
            )}

            {/* Post Title */}
            <Text style={[styles.postTitle, { color: theme.colors.text }]}>{post.title}</Text>

            {/* Post Content Body */}
            <Text style={[styles.postContent, { color: theme.colors.textSecondary }]}>{post.content}</Text>

            {/* Display mood/feeling if present */}
            {post.mood && (
              <View style={styles.postMoodContainer}>
                <Text style={styles.postMoodEmoji}>{post.mood.emoji}</Text>
                <Text style={[styles.postMoodText, { color: theme.colors.text }]}>
                  Feeling {post.mood.label}
                </Text>
              </View>
            )}

            {/* Display images if present */}
            {post.imageUrls && post.imageUrls.length > 0 && (
              <View style={styles.postImagesGrid}>
                {post.imageUrls.map((uri: string, index: number) => (
                  <View key={index} style={[
                    styles.postImageContainer,
                    post.imageUrls.length === 1 && styles.postSingleImage,
                    post.imageUrls.length === 2 && styles.postDoubleImage,
                    post.imageUrls.length === 3 && styles.postTripleImage,
                  ]}>
                    <Image source={{ uri }} style={styles.postImage} />
                  </View>
                ))}
              </View>
            )}

            {/* Reaction Statistics Bar */}
            <View style={[styles.reactionStats, { borderColor: theme.colors.borderLight }]}>
              {/* Only show reactions that have been received (count > 0) */}
              {Object.entries(allReactions)
                .filter(([_, count]) => count > 0)
                .map(([emoji, count]) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.reactionStat,
                      userReaction === emoji && styles.reactionStatActive,
                    ]}
                    onPress={() => handleReactionPress(emoji)}
                    disabled={reacting}
                  >
                    <Text style={styles.reactionStatEmoji}>{emoji}</Text>
                    <Text style={styles.reactionStatCount}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              
              {/* Add Reaction Button */}
              <TouchableOpacity
                style={styles.addMoreReactionButton}
                onPress={() => setReactionPickerVisible(!reactionPickerVisible)}
                disabled={reacting}
              >
                <Text style={styles.addReactionText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* User Reaction Status Indicator */}
            {userReaction && (
              <View style={styles.userReactionIndicator}>
                <Text style={styles.userReactionText}>
                  You reacted with {userReaction}
                </Text>
              </View>
            )}

            {/* Expandable Reaction Picker */}
            {reactionPickerVisible && (
              <View style={[styles.reactionPicker, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.reactionPickerTitle, { color: theme.colors.text }]}>Add Reaction</Text>
                <View style={styles.reactionPickerEmojis}>
                  {EMOJI_REACTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        userReaction === emoji && styles.emojiButtonActive,
                      ]}
                      onPress={() => handleReactionPress(emoji)}
                      disabled={reacting}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Related Posts Section */}
          {relatedPosts.length > 0 && (
            <View style={[styles.relatedSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.relatedTitle, { color: theme.colors.text }]}>Related Posts</Text>
              {relatedPosts.map((relatedPost) => (
                <TouchableOpacity
                  key={relatedPost.id}
                  style={[styles.relatedPost, { borderTopColor: theme.colors.borderLight }]}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/(tabs)/community-forum/post-detail",
                      params: { id: relatedPost.id },
                    })
                  }
                >
                  <View style={styles.relatedAvatar}>
                    <Text style={styles.relatedAvatarText}>
                      {relatedPost.author_name?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <View style={styles.relatedContent}>
                    <Text style={[styles.relatedPostTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {relatedPost.title}
                    </Text>
                    <Text style={[styles.relatedPostMeta, { color: theme.colors.textSecondary }]}>
                      by {relatedPost.author_name} • {getTotalReactions(relatedPost.reactions)} reactions
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={scaledFontSize(20)} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Bottom spacing for scroll view */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Overlay to close reaction picker when tapping outside */}
      {reactionPickerVisible && (
        <Pressable
          style={styles.reactionOverlay}
          onPress={() => setReactionPickerVisible(false)}
        />
      )}

      {/* Success Modal */}
      <StatusModal
        visible={showSuccessModal}
        type="success"
        title="Success!"
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        buttonText="OK"
      />

      {/* Error Modal */}
      <StatusModal
        visible={showErrorModal}
        type="error"
        title={errorTitle}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
        buttonText="OK"
      />
    </SafeAreaView>
  );
}

/**
 * Stylesheet for PostDetailScreen component
 * Uses consistent color scheme and responsive design patterns
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: scaledFontSize(16),
    // color moved to theme.colors.textSecondary via inline override
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: scaledFontSize(18),
    // color moved to theme.colors.textSecondary via inline override
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  postCard: {
    // backgroundColor moved to theme.colors.surface via inline override
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(18),
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    // color moved to theme.colors.text via inline override
    marginBottom: 2,
  },
  postMeta: {
    fontSize: scaledFontSize(12),
    // color moved to theme.colors.textSecondary via inline override
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  categoryText: {
    fontSize: scaledFontSize(12),
    fontWeight: "600",
    color: "#4CAF50",
  },
  postTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "800",
    // color moved to theme.colors.text via inline override
    marginBottom: 12,
    lineHeight: 28,
  },
  postContent: {
    fontSize: scaledFontSize(15),
    // color moved to theme.colors.textSecondary via inline override
    lineHeight: 24,
    marginBottom: 20,
  },
  postMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(124, 185, 169, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  postMoodEmoji: {
    fontSize: scaledFontSize(20),
  },
  postMoodText: {
    fontSize: scaledFontSize(15),
    fontWeight: '500',
  },
  postImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  postImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  postSingleImage: {
    width: '100%',
    height: 250,
  },
  postDoubleImage: {
    width: '48.5%',
    height: 180,
  },
  postTripleImage: {
    width: '31.5%',
    height: 120,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reactionStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    // borderColor moved to theme.colors.borderLight via inline override
    marginBottom: 16,
    alignItems: "center",
  },
  reactionStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "transparent",
    minWidth: 56,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3A3F47",
  },
  reactionStatActive: {
    backgroundColor: "rgba(76,175,80,0.12)",
    borderWidth: 1.5,
    borderColor: "#4CAF50",
  },
  reactionStatEmpty: {
    opacity: 0.6,
  },
  reactionStatEmoji: {
    fontSize: scaledFontSize(16),
  },
  reactionStatCount: {
    fontSize: scaledFontSize(12),
    fontWeight: "600",
    color: "#666",
  },
  reactionStatCountEmpty: {
    color: "#999",
  },
  addMoreReactionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
    minHeight: 32,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  addReactionText: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    color: "#4CAF50",
  },
  userReactionIndicator: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  userReactionText: {
    fontSize: scaledFontSize(14),
    color: "#2E7D32",
    fontWeight: "600",
  },
  reactionPicker: {
    marginTop: 12,
    padding: 16,
    // backgroundColor moved to theme.colors.surface via inline override
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  reactionPickerTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    // color moved to theme.colors.text via inline override
    marginBottom: 12,
    textAlign: "center",
  },
  reactionPickerEmojis: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  emojiButtonActive: {
    backgroundColor: "#FFE0B2",
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: scaledFontSize(28),
  },
  reactionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  relatedSection: {
    // backgroundColor moved to theme.colors.surface via inline override
    borderRadius: 16,
    padding: 20,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  relatedTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    // color moved to theme.colors.text via inline override
    marginBottom: 16,
  },
  relatedPost: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    // borderTopColor moved to theme.colors.borderLight via inline override
  },
  relatedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  relatedAvatarText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(14),
    fontWeight: "bold",
  },
  relatedContent: {
    flex: 1,
  },
  relatedPostTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    // color moved to theme.colors.text via inline override
    marginBottom: 4,
  },
  relatedPostMeta: {
    fontSize: scaledFontSize(12),
    // color moved to theme.colors.textSecondary via inline override
  },
  bottomSpacing: {
    height: 30,
  },
});