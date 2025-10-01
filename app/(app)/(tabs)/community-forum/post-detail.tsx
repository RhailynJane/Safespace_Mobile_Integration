/* eslint-disable react-hooks/exhaustive-deps */
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import { useState, useEffect } from "react";
import { communityApi } from "../../../../utils/communityForumApi";
import { useUser } from "@clerk/clerk-expo";

// Available emoji reactions
const EMOJI_REACTIONS = ["❤️", "👍", "😊", "😢", "😮", "🔥"];

export default function PostDetailScreen() {
  const params = useLocalSearchParams();
  const postId = parseInt(params.id as string, 10);
  const { user } = useUser();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    loadPostData();
  }, [postId]);

  const loadPostData = async () => {
    try {
      setLoading(true);
      const [postResponse, relatedResponse] = await Promise.all([
        communityApi.getPostById(postId),
        communityApi.getPosts({ limit: 3 })
      ]);
      
      setPost(postResponse.post);
      setRelatedPosts(relatedResponse.posts.filter((p: any) => p.id !== postId).slice(0, 2));
      
      // Check if user has reacted (this would need additional backend endpoint)
      // For now, we'll assume no reaction
      setUserReaction(null);
      
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert("Error", "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleReactionPress = async (emoji: string) => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in to react to posts");
      return;
    }

    if (reacting) return;

    try {
      setReacting(true);
      
      if (userReaction === emoji) {
        // Remove reaction
        await communityApi.removeReaction(postId, user.id, emoji);
        setUserReaction(null);
        
        // Update local post reactions
        if (post && post.reactions) {
          const updatedReactions = { ...post.reactions };
          if (updatedReactions[emoji] > 0) {
            updatedReactions[emoji]--;
          }
          setPost({ ...post, reactions: updatedReactions });
        }
      } else {
        // Add new reaction
        if (userReaction) {
          // Remove previous reaction first
          await communityApi.removeReaction(postId, user.id, userReaction);
        }
        
        await communityApi.reactToPost(postId, user.id, emoji);
        setUserReaction(emoji);
        
        // Update local post reactions
        if (post && post.reactions) {
          const updatedReactions = { ...post.reactions };
          updatedReactions[emoji] = (updatedReactions[emoji] || 0) + 1;
          setPost({ ...post, reactions: updatedReactions });
        }
      }
      
      setReactionPickerVisible(false);
    } catch (error) {
      console.error('Error updating reaction:', error);
      Alert.alert("Error", "Failed to update reaction");
    } finally {
      setReacting(false);
    }
  };

  const handleBookmarkPress = async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in to bookmark posts");
      return;
    }

    try {
      const response = await communityApi.toggleBookmark(postId, user.id);
      setBookmarked(response.bookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert("Error", "Failed to update bookmark");
    }
  };

  const getTotalReactions = (reactions: { [key: string]: number }) => {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CurvedBackground style={styles.curvedBackground} />
        <AppHeader title="Post Detail" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7CB9A9" />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <CurvedBackground style={styles.curvedBackground} />
        <AppHeader title="Post Detail" showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#E0E0E0" />
          <Text style={styles.errorText}>Post not found</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <CurvedBackground style={styles.curvedBackground} />
      <AppHeader title="Post Detail" showBack={true} />

      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Post Card */}
          <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {post.author_name?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{post.author_name || 'Anonymous User'}</Text>
                <Text style={styles.postMeta}>
                  {formatTimestamp(post.created_at)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={handleBookmarkPress}
              >
                <Ionicons
                  name={bookmarked ? "bookmark" : "bookmark-outline"}
                  size={24}
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
            <Text style={styles.postTitle}>{post.title}</Text>

            {/* Post Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Reaction Stats */}
            <View style={styles.reactionStats}>
              {post.reactions && Object.entries(post.reactions).map(([emoji, count]) => (
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
                  <Text style={styles.reactionStatCount}>{count as number}</Text>
                </TouchableOpacity>
              ))}
              
              {/* Add More Reactions Button */}
              <TouchableOpacity
                style={styles.addMoreReactionButton}
                onPress={() => setReactionPickerVisible(!reactionPickerVisible)}
                disabled={reacting}
              >
                <Ionicons 
                  name="add-circle" 
                  size={20} 
                  color={reacting ? "#CCC" : "#4CAF50"} 
                />
              </TouchableOpacity>
            </View>

            {/* User Reaction Indicator */}
            {userReaction && (
              <View style={styles.userReactionIndicator}>
                <Text style={styles.userReactionText}>
                  You reacted with {userReaction}
                </Text>
              </View>
            )}

            {/* Reaction Picker */}
            {reactionPickerVisible && (
              <View style={styles.reactionPicker}>
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
            )}
          </View>

          {/* Related Posts Section */}
          {relatedPosts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Related Posts</Text>
              {relatedPosts.map((relatedPost) => (
                <TouchableOpacity
                  key={relatedPost.id}
                  style={styles.relatedPost}
                  onPress={() =>
                    router.push({
                      pathname: "/community-forum/post-detail",
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
                    <Text style={styles.relatedPostTitle} numberOfLines={2}>
                      {relatedPost.title}
                    </Text>
                    <Text style={styles.relatedPostMeta}>
                      by {relatedPost.author_name} • {getTotalReactions(relatedPost.reactions)} reactions
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Overlay to close reaction picker */}
      {reactionPickerVisible && (
        <Pressable
          style={styles.reactionOverlay}
          onPress={() => setReactionPickerVisible(false)}
        />
      )}
    </SafeAreaView>
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
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
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
    fontSize: 16,
    fontWeight: "600",
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
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
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 2,
  },
  postMeta: {
    fontSize: 12,
    color: "#757575",
  },
  bookmarkButton: {
    padding: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#212121",
    marginBottom: 12,
    lineHeight: 28,
  },
  postContent: {
    fontSize: 15,
    color: "#424242",
    lineHeight: 24,
    marginBottom: 20,
  },
  reactionStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
    alignItems: "center",
  },
  reactionStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  reactionStatActive: {
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  reactionStatEmoji: {
    fontSize: 20,
  },
  reactionStatCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  addMoreReactionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  userReactionIndicator: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  userReactionText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  reactionPicker: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
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
  emojiButton: {
    padding: 5,
    borderRadius: 9,
    backgroundColor: "#F5F5F5",
  },
  emojiButtonActive: {
    backgroundColor: "#FFE0B2",
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 32,
  },
  reactionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  relatedSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 16,
  },
  relatedPost: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
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
    fontSize: 14,
    fontWeight: "bold",
  },
  relatedContent: {
    flex: 1,
  },
  relatedPostTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  relatedPostMeta: {
    fontSize: 12,
    color: "#757575",
  },
  bottomSpacing: {
    height: 30,
  },
});