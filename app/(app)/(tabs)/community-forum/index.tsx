/**
 * CommunityMainScreen - React Native Component
 * 
 * Main community forum screen that provides:
 * - Newsfeed view with categorized posts
 * - Personal posts management with draft support
 * - Interactive reactions and bookmarking system
 * - Category-based content filtering
 * - User authentication and session management
 * 
 * Features:
 * - Dual view mode: Newsfeed (community posts) and My Posts (personal content)
 * - Real-time reactions and bookmark updates
 * - Draft post management with publish functionality
 * - Horizontal category scrolling with active state tracking
 * - Pull-to-refresh for content updates
 * - Side navigation menu with app-wide navigation
 * - Responsive design with curved background
 * 
 * Authentication:
 * - Requires user sign-in for personal features
 * - Handles bookmarking and reaction tracking per user
 * - Manages user sessions and logout functionality
 * 
 * Data Flow:
 * - Loads categories and posts on component mount
 * - Filters posts by selected category in newsfeed view
 * - Manages personal posts with draft/published states
 * - Updates UI optimistically for better user experience
 * 
 * LLM Prompt: Add comprehensive comments to this React Native component.
 * Reference: chat.deepseek.com
 */

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { communityApi } from "../../../../utils/communityForumApi";

const { width, height } = Dimensions.get("window");

// Available categories for post filtering and organization
const CATEGORIES = [
  "Trending",
  "Stress",
  "Support",
  "Stories",
  "Self Care",
  "Mindfulness",
  "Creative",
  "Therapy",
  "Affirmation",
  "Awareness",
  "Bookmark", // Special category for user's bookmarked posts
];

// Define the tab types for view switching
type ViewType = "newsfeed" | "my-posts";

/**
 * Main community forum component with dual-view functionality
 * Handles newsfeed browsing and personal post management
 */
export default function CommunityMainScreen() {
  // State management for UI and data
  const [selectedCategory, setSelectedCategory] = useState("Trending"); // Currently selected category filter
  const [activeView, setActiveView] = useState<ViewType>("newsfeed"); // Active view mode
  const [activeTab, setActiveTab] = useState("community-forum"); // Bottom navigation active tab
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set()); // Track user's bookmarked posts
  const [sideMenuVisible, setSideMenuVisible] = useState(false); // Side navigation menu visibility
  const [posts, setPosts] = useState<any[]>([]); // Community posts data
  const [myPosts, setMyPosts] = useState<any[]>([]); // User's personal posts including drafts
  const [loading, setLoading] = useState(true); // Main loading state
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state
  const [categories, setCategories] = useState<any[]>([]); // Available categories from API
  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation for side menu
  const [isSigningOut, setIsSigningOut] = useState(false); // Sign-out process state

  // Authentication and user context
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

  /**
   * Load initial data when component mounts
   * Fetches categories and initial posts
   */
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Load appropriate data when view or category changes
   * Newsfeed: Load posts based on selected category
   * My Posts: Load user's personal posts
   */
  useEffect(() => {
    if (selectedCategory && activeView === "newsfeed") {
      loadPosts();
    } else if (activeView === "my-posts") {
      loadMyPosts();
    }
  }, [selectedCategory, activeView]);

  /**
   * Initial data loading sequence
   * Fetches categories and posts in parallel
   */
  const loadInitialData = async () => {
    try {
      await Promise.all([loadCategories(), loadPosts()]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "Failed to load community data");
    }
  };

  /**
   * Fetch available categories from API
   * Used for post categorization and filtering
   */
  const loadCategories = async () => {
    try {
      const response = await communityApi.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  /**
   * Load posts based on current category selection
   * Handles special case for bookmarked posts
   * Manages user-specific data like reactions and bookmarks
   */
  const loadPosts = async () => {
    try {
      setLoading(true);
      let response;
      
      // Special handling for bookmark category
      if (selectedCategory === "Bookmark") {
        if (!user?.id) {
          Alert.alert("Sign In Required", "Please sign in to view bookmarked posts");
          setPosts([]);
          return;
        }
        response = await communityApi.getBookmarkedPosts(user.id);
        response = { posts: response.bookmarks || [] };
      } else {
        // Regular category-based post loading
        response = await communityApi.getPosts({
          category: selectedCategory === "Trending" ? undefined : selectedCategory,
          limit: 20,
        });
      }

      const postsWithReactions = response.posts;
      setPosts(postsWithReactions);

      // Load user-specific data if authenticated and not in bookmark view
      if (user?.id && selectedCategory !== "Bookmark") {
        await Promise.all([
          loadUserBookmarks(user.id),
          loadUserReactions(user.id, postsWithReactions),
        ]);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      Alert.alert("Error", "Failed to load posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Load user's personal posts including drafts
   * Requires authentication
   */
  const loadMyPosts = async () => {
    if (!user?.id) {
      Alert.alert("Sign In Required", "Please sign in to view your posts");
      setMyPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await communityApi.getUserPosts(user.id, true); // Include drafts
      setMyPosts(response.posts || []);
    } catch (error) {
      console.error("Error loading user posts:", error);
      Alert.alert("Error", "Failed to load your posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Fetch user's reactions for multiple posts
   * Used to display user's current reaction state
   */
  const loadUserReactions = async (clerkUserId: string, posts: any[]) => {
    try {
      const userReactions: { [postId: number]: string } = {};
      for (const post of posts) {
        const response = await communityApi.getUserReaction(post.id, clerkUserId);
        if (response.userReaction) {
          userReactions[post.id] = response.userReaction;
        }
      }
      return userReactions;
    } catch (error) {
      console.error("Error loading user reactions:", error);
      return {};
    }
  };

  /**
   * Load user's bookmarked posts for visual indication
   */
  const loadUserBookmarks = async (clerkUserId: string) => {
    try {
      const response = await communityApi.getBookmarkedPosts(clerkUserId);
      const bookmarkedIds = new Set<number>(
        response.bookmarks?.map((post: any) => post.id as number) || []
      );
      setBookmarkedPosts(bookmarkedIds);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  };

  /**
   * Pull-to-refresh handler
   * Reloads data based on current view
   */
  const onRefresh = () => {
    setRefreshing(true);
    if (activeView === "newsfeed") {
      loadPosts();
    } else {
      loadMyPosts();
    }
  };

  /**
   * Handle emoji reaction to a post
   * Updates local state optimistically for better UX
   */
  const handleReactionPress = async (postId: number, emoji: string) => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in to react to posts");
      return;
    }

    try {
      const response = await communityApi.reactToPost(postId, user.id, emoji);

      // Update posts based on current view for immediate UI feedback
      if (activeView === "newsfeed") {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  reactions: response.reactions,
                  reaction_count: (post.reaction_count || 0) + response.reactionChange,
                }
              : post
          )
        );
      } else {
        setMyPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  reactions: response.reactions,
                  reaction_count: (post.reaction_count || 0) + response.reactionChange,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error reacting to post:", error);
      Alert.alert("Error", "Failed to update reaction");
    }
  };

  /**
   * Toggle bookmark status for a post
   * Updates local state and refreshes bookmark view if active
   */
  const handleBookmarkPress = async (postId: number) => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in to bookmark posts");
      return;
    }

    try {
      const response = await communityApi.toggleBookmark(postId, user.id);
      const newBookmarkedPosts = new Set(bookmarkedPosts);
      if (response.bookmarked) {
        newBookmarkedPosts.add(postId);
      } else {
        newBookmarkedPosts.delete(postId);
      }
      setBookmarkedPosts(newBookmarkedPosts);

      // Refresh posts if currently in bookmark view
      if (selectedCategory === "Bookmark" && activeView === "newsfeed") {
        loadPosts();
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark");
    }
  };

  /**
   * Navigate to post edit screen with current post data
   */
  const handleEditPost = (postId: number) => {
    const postToEdit = myPosts.find((post) => post.id === postId);
    if (postToEdit) {
      router.push({
        pathname: "/community-forum/edit",
        params: {
          id: postId,
          title: postToEdit.title,
          content: postToEdit.content,
          category: postToEdit.category_name,
          isDraft: postToEdit.is_draft ? "true" : "false",
        },
      });
    }
  };

  /**
   * Publish a draft post by updating its draft status
   */
  const handlePublishDraft = async (postId: number) => {
    if (!user?.id) return;

    try {
      await communityApi.updatePost(postId, { isDraft: false });
      Alert.alert("Success", "Post published successfully!");
      loadMyPosts(); // Refresh the list to show updated state
    } catch (error) {
      console.error("Error publishing draft:", error);
      Alert.alert("Error", "Failed to publish post");
    }
  };

  /**
   * Delete a post with confirmation dialog
   * Updates UI immediately after successful deletion
   */
  const handleDeletePost = async (postId: number) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await communityApi.deletePost(postId);
              Alert.alert("Success", "Post deleted successfully!");

              // Update the UI immediately for better UX
              if (activeView === "my-posts") {
                setMyPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
              } else {
                setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
              }
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  /**
   * Extract user's display name from Clerk user object
   * Falls back to email username if no name available
   */
  const getDisplayName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.split("@")[0];
    }
    return "User";
  };

  /**
   * Get user's email address from Clerk user object
   */
  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email available"
    );
  };

  /**
   * Handle user logout process
   * Clears local storage and redirects to login
   */
  const handleLogout = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      setSideMenuVisible(false);
      await AsyncStorage.clear();
      if (signOut) {
        await signOut();
      }
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert("Logout Failed", "Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * Confirm sign-out with alert dialog
   */
  const confirmSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: handleLogout },
    ]);
  };

  /**
   * Generate user initials for avatar display
   */
  const getInitials = () => {
    const firstName = getDisplayName()?.split(" ")[0] || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  /**
   * Show side navigation menu with animation
   */
  const showSideMenu = () => {
    setSideMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Hide side navigation menu with animation
   */
  const hideSideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  };

  /**
   * Navigate to post detail screen
   */
  const handlePostPress = (postId: number) => {
    router.push({
      pathname: "/community-forum/post-detail",
      params: { id: postId },
    });
  };

  /**
   * Bottom navigation tabs configuration
   */
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Handle bottom navigation tab press
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Calculate total reactions count from reactions object
   */
  const getTotalReactions = (reactions: { [key: string]: number }) => {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  /**
   * Side menu navigation items configuration
   */
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        hideSideMenu();
        router.replace("/(app)/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/profile");
      },
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        hideSideMenu();
        router.push("/self-assessment");
      },
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        hideSideMenu();
        router.push("/mood-tracking");
      },
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        hideSideMenu();
        router.push("/journal");
      },
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        hideSideMenu();
        router.push("/resources");
      },
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        hideSideMenu();
        router.push("/crisis-support");
      },
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/appointments");
      },
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        hideSideMenu();
        router.push("/community-forum");
      },
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        hideSideMenu();
        router.push("/video-consultations");
      },
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: confirmSignOut,
      disabled: isSigningOut,
    },
  ];

  // Determine which posts to display based on current view
  const displayPosts = activeView === "newsfeed" ? posts : myPosts;

  return (
    <SafeAreaView style={styles.container}>
      <CurvedBackground style={styles.curvedBackground} />
      <AppHeader title="Community Forum" showBack={true} />

      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* View Tabs - Switch between Newsfeed and My Posts */}
          <View style={styles.viewTabsContainer}>
            <TouchableOpacity
              style={[
                styles.viewTab,
                activeView === "newsfeed" && styles.viewTabActive,
              ]}
              onPress={() => setActiveView("newsfeed")}
            >
              <Ionicons
                name="newspaper"
                size={20}
                color={activeView === "newsfeed" ? "#FFFFFF" : "#7CB9A9"}
              />
              <Text
                style={[
                  styles.viewTabText,
                  activeView === "newsfeed" && styles.viewTabTextActive,
                ]}
              >
                Newsfeed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewTab,
                activeView === "my-posts" && styles.viewTabActive,
              ]}
              onPress={() => setActiveView("my-posts")}
            >
              <Ionicons
                name="person"
                size={20}
                color={activeView === "my-posts" ? "#FFFFFF" : "#7CB9A9"}
              />
              <Text
                style={[
                  styles.viewTabText,
                  activeView === "my-posts" && styles.viewTabTextActive,
                ]}
              >
                My Posts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Categories Section - Only show in Newsfeed view */}
          {activeView === "newsfeed" && (
            <View style={styles.categoriesSection}>
              <TouchableOpacity
                style={styles.addPostButton}
                onPress={() => router.push("/community-forum/create")}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addPostButtonText}>Add Post</Text>
              </TouchableOpacity>

              <Text style={styles.browseBySectionTitle}>Browse By</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScrollView}
              >
                <View style={styles.categoriesContainer}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category && styles.categoryButtonActive,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory === category && styles.categoryTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* My Posts Header - Only show in My Posts view */}
          {activeView === "my-posts" && (
            <View style={styles.myPostsHeader}>
              <View style={styles.myPostsHeaderContent}>
                <Ionicons name="document-text" size={24} color="#7CB9A9" />
                <Text style={styles.myPostsTitle}>My Posts</Text>
                <Text style={styles.myPostsSubtitle}>
                  Manage your published posts and drafts
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addPostButton}
                onPress={() => router.push("/community-forum/create")}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addPostButtonText}>New Post</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Posts Section - Dynamic content based on current view */}
          <View style={styles.postsSection}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7CB9A9" />
                <Text style={styles.loadingText}>
                  {activeView === "newsfeed"
                    ? "Loading posts..."
                    : "Loading your posts..."}
                </Text>
              </View>
            ) : displayPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={
                    activeView === "newsfeed"
                      ? "document-text-outline"
                      : "create-outline"
                  }
                  size={64}
                  color="#E0E0E0"
                />
                <Text style={styles.emptyText}>
                  {activeView === "newsfeed"
                    ? selectedCategory === "Trending"
                      ? "Be the first to share something with the community!"
                      : `No posts in ${selectedCategory} category yet`
                    : "You haven't created any posts yet"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {activeView === "my-posts" &&
                    "Create your first post to share with the community!"}
                </Text>
                {activeView === "my-posts" && (
                  <TouchableOpacity
                    style={styles.createFirstPostButton}
                    onPress={() => router.push("/community-forum/create")}
                  >
                    <Text style={styles.createFirstPostButtonText}>
                      Create Your First Post
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {displayPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={[
                      styles.postCard,
                      post.is_draft && styles.draftPostCard,
                    ]}
                    onPress={() => !post.is_draft && handlePostPress(post.id)}
                  >
                    {/* Draft Badge - Only show for draft posts */}
                    {post.is_draft && (
                      <View style={styles.draftBadge}>
                        <Ionicons name="time" size={12} color="#666" />
                        <Text style={styles.draftBadgeText}>Draft</Text>
                      </View>
                    )}

                    <View style={styles.postHeader}>
                      <View style={styles.postUserInfo}>
                        <View style={styles.avatarContainer}>
                          <Text style={styles.avatarText}>
                            {post.author_name?.charAt(0) || "U"}
                          </Text>
                        </View>
                        <View style={styles.postTitleContainer}>
                          <Text style={styles.postTitle} numberOfLines={2}>
                            {post.title}
                          </Text>
                          <Text style={styles.postAuthor}>
                            {post.author_name} •{" "}
                            {new Date(post.created_at).toLocaleDateString()}
                            {post.is_draft && " • Draft"}
                          </Text>
                        </View>
                      </View>

                      {/* My Posts Actions - Only show in My Posts view */}
                      {activeView === "my-posts" && (
                        <View style={styles.postActions}>
                          {post.is_draft ? (
                            <>
                              <TouchableOpacity
                                style={styles.postActionButton}
                                onPress={() => handleEditPost(post.id)}
                              >
                                <Ionicons name="create" size={18} color="#666" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.postActionButton}
                                onPress={() => handlePublishDraft(post.id)}
                              >
                                <Ionicons name="send" size={18} color="#4CAF50" />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity
                              style={styles.postActionButton}
                              onPress={() => handlePostPress(post.id)}
                            >
                              <Ionicons name="eye" size={18} color="#666" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.postActionButton}
                            onPress={() => handleDeletePost(post.id)}
                          >
                            <Ionicons name="trash" size={18} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <Text style={styles.postContent} numberOfLines={4}>
                      {post.content}
                    </Text>

                    {/* Reactions and Interactions - Only show for published posts */}
                    {!post.is_draft && (
                      <View style={styles.reactionsRow}>
                        <View style={styles.reactionsContainer}>
                          {post.reactions &&
                            Object.entries(post.reactions)
                              .slice(0, 3)
                              .map(([emoji, count]) => (
                                <TouchableOpacity
                                  key={emoji}
                                  style={styles.reactionPill}
                                  onPress={() => handleReactionPress(post.id, emoji)}
                                >
                                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                                  <Text style={styles.reactionCount}>
                                    {count as number}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                          {post.reactions &&
                            Object.keys(post.reactions).length > 3 && (
                              <Text style={styles.moreReactions}>
                                +{Object.keys(post.reactions).length - 3} more
                              </Text>
                            )}
                        </View>

                        {/* Bookmark Button - Only in Newsfeed view */}
                        {activeView === "newsfeed" && (
                          <TouchableOpacity
                            onPress={() => handleBookmarkPress(post.id)}
                            style={styles.bookmarkButton}
                          >
                            <Ionicons
                              name={
                                bookmarkedPosts.has(post.id)
                                  ? "bookmark"
                                  : "bookmark-outline"
                              }
                              size={24}
                              color={bookmarkedPosts.has(post.id) ? "#FFA000" : "#666"}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Category Badge - Show post category */}
                    {post.category_name && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {post.category_name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Side Menu Modal - App navigation overlay */}
      <Modal
        animationType="none"
        transparent={true}
        visible={sideMenuVisible}
        onRequestClose={hideSideMenu}
      >
        <Animated.View style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={hideSideMenu} />
          <Animated.View style={[styles.sideMenu, { opacity: fadeAnim }]}>
            <View style={styles.sideMenuHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{getInitials()}</Text>
              </View>
              <Text style={styles.profileName}>{getDisplayName()}</Text>
              <Text style={styles.profileEmail}>{getUserEmail()}</Text>
            </View>
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sideMenuItem,
                    item.disabled && styles.sideMenuItemDisabled,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.disabled ? "#CCCCCC" : "#4CAF50"}
                  />
                  <Text
                    style={[
                      styles.sideMenuItemText,
                      item.disabled && styles.sideMenuItemTextDisabled,
                      item.title === "Sign Out" && styles.signOutText,
                    ]}
                  >
                    {item.title}
                    {item.title === "Sign Out" && isSigningOut && "..."}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Bottom Navigation - Main app navigation */}
      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

/**
 * Stylesheet for CommunityMainScreen component
 * Organized by component sections with consistent theming
 */
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
    marginBottom: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // View Tabs - Newsfeed vs My Posts toggle
  viewTabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  viewTabActive: {
    backgroundColor: "#7CB9A9",
  },
  viewTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7CB9A9",
  },
  viewTabTextActive: {
    color: "#FFFFFF",
  },

  // Categories Section - Horizontal scrolling categories
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesScrollView: {
    marginHorizontal: -16,
  },
  addPostButton: {
    backgroundColor: "#2EA78F",
    height: 40,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    borderColor: "#D36500",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 16,
  },
  addPostButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  browseBySectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: "#757575",
  },
  categoryText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },

  // My Posts Header - Personal posts management section
  myPostsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  myPostsHeaderContent: {
    flex: 1,
  },
  myPostsTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 8,
  },
  myPostsSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  // Posts Section - Main content area
  postsSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },

  // Post Cards - Individual post containers
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
    overflow: "visible",
  },
  draftPostCard: {
    borderColor: "#FFA726",
    borderWidth: 1,
    backgroundColor: "#FFFBF0",
  },
  draftBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
  },
  draftBadgeText: {
    fontSize: 12,
    color: "#856404",
    fontWeight: "500",
  },

  // Post Header - Author info and actions
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  postTitleContainer: {
    flex: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    lineHeight: 20,
  },
  postAuthor: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  // Post Actions - Edit, publish, delete buttons for My Posts
  postActions: {
    flexDirection: "row",
    gap: 8,
  },
  postActionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#F8F9FA",
  },

  // Post Content - Main post text
  postContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },

  // Reactions Row - Emoji reactions and bookmark button
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  reactionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  moreReactions: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  bookmarkButton: {
    padding: 4,
  },

  // Category Badge - Post category indicator
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },

  // Create First Post Button - Empty state action
  createFirstPostButton: {
    backgroundColor: "#7CB9A9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  createFirstPostButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Bottom Spacing - Scroll view padding
  bottomSpacing: {
    height: 30,
  },

  // Side Menu Styles - Navigation overlay
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemTextDisabled: {
    color: "#CCCCCC",
  },
  signOutText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  sideMenu: {
    paddingTop: 60,
    width: width * 0.75,
    backgroundColor: "#FFFFFF",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#757575",
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