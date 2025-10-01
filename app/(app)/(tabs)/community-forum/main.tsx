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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { communityApi } from "../../../../utils/communityForumApi";

const { width, height } = Dimensions.get("window");

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
  "Bookmark",
];

export default function CommunityMainScreen() {
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  const [activeTab, setActiveTab] = useState("community-forum");
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(
    new Set()
  );
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadPosts();
    }
  }, [selectedCategory]);

  const loadUserReactions = async (clerkUserId: string, posts: any[]) => {
    try {
      const userReactions: { [postId: number]: string } = {};

      // Load reactions for each post
      for (const post of posts) {
        const response = await communityApi.getUserReaction(
          post.id,
          clerkUserId
        );
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

  const loadInitialData = async () => {
    try {
      await Promise.all([loadCategories(), loadPosts()]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "Failed to load community data");
    }
  };

  const loadCategories = async () => {
    try {
      const response = await communityApi.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);

      let response;
      if (selectedCategory === "Bookmark") {
        // Load bookmarked posts
        if (!user?.id) {
          Alert.alert(
            "Sign In Required",
            "Please sign in to view bookmarked posts"
          );
          setPosts([]);
          return;
        }
        response = await communityApi.getBookmarkedPosts(user.id);
        // Transform the response to match posts structure
        response = { posts: response.bookmarks || [] };
      } else {
        // Load regular posts
        response = await communityApi.getPosts({
          category:
            selectedCategory === "Trending" ? undefined : selectedCategory,
          limit: 20,
        });
      }

      const postsWithReactions = response.posts;
      setPosts(postsWithReactions);

      // Load bookmarks and reactions for current user (except for bookmark category)
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

  // Add reaction handler
  const handleReactionPress = async (postId: number, emoji: string) => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in to react to posts");
      return;
    }

    try {
      const response = await communityApi.reactToPost(postId, user.id, emoji);

      // Update the specific post with new reaction data
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                reactions: response.reactions,
                reaction_count:
                  (post.reaction_count || 0) + response.reactionChange,
              }
            : post
        )
      );

      // Update user reaction state if needed
      // You might want to maintain a separate state for user reactions
    } catch (error) {
      console.error("Error reacting to post:", error);
      Alert.alert("Error", "Failed to update reaction");
    }
  };

  const loadUserBookmarks = async (clerkUserId: string) => {
    try {
      const response = await communityApi.getBookmarkedPosts(clerkUserId);
      const bookmarkedIds = new Set<number>(
        response.bookmarks.map((post: any) => post.id as number)
      );
      setBookmarkedPosts(bookmarkedIds);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const getDisplayName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.split("@")[0];
    }
    return "User";
  };

  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email available"
    );
  };

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

  const confirmSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: handleLogout },
    ]);
  };

  const getInitials = () => {
    const firstName = getDisplayName()?.split(" ")[0] || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const showSideMenu = () => {
    setSideMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const hideSideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  };

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

      if (selectedCategory === "Bookmark") {
        loadPosts(); // Reload to reflect the change
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark");
    }
  };

  const handlePostPress = (postId: number) => {
    router.push({
      pathname: "/community-forum/post-detail",
      params: { id: postId },
    });
  };

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

  const getTotalReactions = (reactions: { [key: string]: number }) => {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

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
                      selectedCategory === category &&
                        styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category &&
                          styles.categoryTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.postsSection}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7CB9A9" />
                <Text style={styles.loadingText}>Loading posts...</Text>
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={64}
                  color="#E0E0E0"
                />
                <Text style={styles.emptyText}>No posts found</Text>
                <Text style={styles.emptySubtext}>
                  {selectedCategory === "Trending"
                    ? "Be the first to share something with the community!"
                    : `No posts in ${selectedCategory} category yet`}
                </Text>
              </View>
            ) : (
              <>
                {posts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postCard}
                    onPress={() => handlePostPress(post.id)}
                  >
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
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.postContent} numberOfLines={4}>
                      {post.content}
                    </Text>

                    {/* Reactions Row */}
                    <View style={styles.reactionsRow}>
                      <View style={styles.reactionsContainer}>
                        {post.reactions &&
                          Object.entries(post.reactions)
                            .slice(0, 3)
                            .map(([emoji, count]) => (
                              <TouchableOpacity
                                key={emoji}
                                style={styles.reactionPill}
                                onPress={() =>
                                  handleReactionPress(post.id, emoji)
                                }
                              >
                                <Text style={styles.reactionEmoji}>
                                  {emoji}
                                </Text>
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

                      {/* Bookmark Button */}
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
                          color={
                            bookmarkedPosts.has(post.id) ? "#FFA000" : "#666"
                          }
                        />
                      </TouchableOpacity>
                    </View>

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

      <Modal
        animationType="none"
        transparent={true}
        visible={sideMenuVisible}
        onRequestClose={hideSideMenu}
      >
        <Animated.View
          style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={hideSideMenu}
          />
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

      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
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
    marginBottom: 80,
  },
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  categoriesScrollView: {
    marginHorizontal: -16,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
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
  postContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  reactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  bookmarkButton: {
    padding: 4,
  },
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
  bottomSpacing: {
    height: 30,
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

  moreReactions: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
