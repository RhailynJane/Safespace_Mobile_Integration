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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";

const { width, height } = Dimensions.get("window");

// Mock data for posts
const POSTS = [
  {
    id: 1,
    title: "Struggling with Sleep Due to Stress?",
    content:
      "Lately, stress has really been affecting my sleep – either I can't fall asleep or I wake up feeling exhausted.\n\nJust wondering... how do you all cope with this?\nAny tips or routines that help you sleep better during stressful times?\n\nWould love to hear what works for you. 😊",
    likes: 20,
    comments: 241,
    category: "Stress",
    user: {
      name: "Sarah M.",
      posts: 24,
    },
  },
  {
    id: 2,
    title: "Dealing with Anxiety Lately?",
    content:
      "I've been feeling more anxious than usual – overthinking, tight chest, hard to focus. It sneaks in even when things seem okay. 😊\n\nJust checking in... how do you manage your anxiety day-to-day?\nBreathing exercises, journaling, talking to someone?\n\nOpen to any ideas or even just sharing how you feel.\nYou're not alone. 😊",
    likes: 20,
    comments: 241,
    category: "Support",
    user: {
      name: "Michael T.",
      posts: 12,
    },
  },
  {
    id: 3,
    title: "Little Wins & Mental Health Tips",
    content:
      "Hey everyone! Just wanted to share a few small things that helped my mental health lately:\n- Taking a short walk without my phone 🟧\n- Saying no without feeling guilty\n- Writing down 3 things I'm grateful for before bed\n\nFeel free to drop your own tips or wins-big or small.",
    likes: 87,
    comments: 42,
    category: "Stories",
    user: {
      name: "John L.",
      posts: 7,
    },
  },
];

// Available categories for filtering posts
const CATEGORIES = [
  "Trending",
  "Stress",
  "Support",
  "Stories",
  "Bookmark",
  "Favorites",
];

/**
 * CommunityMainScreen Component
 *
 * Main community forum screen displaying posts, categories, and user interactions.
 * Features a curved background, category filtering, and post interactions.
 */
export default function CommunityMainScreen() {
  // State management
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  const [activeTab, setActiveTab] = useState("community-forum");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [commentedPosts, setCommentedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(
    new Set()
  );
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Mock user data (replaces backend auth context)
  const mockUser = {
    displayName: "Demo User",
    email: "demo@gmail.com",
    uid: "demo-user-id",
  };

  const mockProfile = {
    firstName: "Demo",
    lastName: "User",
  };

  /**
   * Generates user initials from profile data
   * @returns String containing user initials
   */
  const getInitials = () => {
    const firstName = mockProfile?.firstName || "";
    const lastName = mockProfile?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  /**
   * Gets greeting name from available user data
   * @returns String with user's first name or fallback
   */
  const getGreetingName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    return "User";
  };

  /**
   * Shows the side menu with animation
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
   * Hides the side menu with animation
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

  // Side menu navigation items
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
        router.push("/journaling");
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
      onPress: async () => {
        hideSideMenu();
        // Mock logout functionality
        console.log("User signed out");
      },
    },
  ];

  /**
   * Handles like button press for posts
   * @param postId - ID of the post to like/unlike
   */
  const handleLikePress = (postId: number) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  /**
   * Handles bookmark button press for posts
   * @param postId - ID of the post to bookmark/unbookmark
   */
  const handleBookmarkPress = (postId: number) => {
    const newBookmarkedPosts = new Set(bookmarkedPosts);
    if (newBookmarkedPosts.has(postId)) {
      newBookmarkedPosts.delete(postId);
    } else {
      newBookmarkedPosts.add(postId);
    }
    setBookmarkedPosts(newBookmarkedPosts);
  };

  /**
   * Navigates to the comments screen for a specific post
   * @param postId - ID of the post to view comments for
   */
  const handlePostPress = (postId: number) => {
    router.push({
      pathname: "/community-forum/comments",
      params: { id: postId },
    });
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

  /**
   * Gets display name from available user data
   * @returns String with user's display name or fallback
   */
  const getDisplayName = () => {
    if (mockProfile?.firstName)
      return mockProfile.firstName + " " + (mockProfile.lastName || "");
    if (mockUser?.displayName) return mockUser.displayName;
    if (mockUser?.email) return mockUser.email.split("@")[0];
    return "John Doe";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Curved background component */}
      <CurvedBackground style={styles.curvedBackground} />
      <AppHeader title="Community Forum" showBack={true} />

      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Browse By Categories Section */}
          <View style={styles.categoriesSection}>
            {/* Add Post Button */}
            <TouchableOpacity
              style={styles.addPostButton}
              onPress={() => router.push("/community-forum/create")}
            >
              <Ionicons name="add" size={10} color="#FFFFFF" />
              <Text style={styles.addPostButtonText}>Add Post</Text>
            </TouchableOpacity>

            <Text style={styles.browseBySectionTitle}>Browse By</Text>

            {/* Category Filter Buttons */}
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
          </View>

          {/* Posts List Section */}
          <View style={styles.postsSection}>
            {POSTS.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                onPress={() => handlePostPress(post.id)}
              >
                <View style={styles.postHeader}>
                  <View style={styles.postUserInfo}>
                    <Image
                      source={{
                        uri: `https://randomuser.me/api/portraits/${
                          post.user.name.includes("Sarah") ? "women" : "men"
                        }/${post.id + 10}.jpg`,
                      }}
                      style={styles.postUserImage}
                    />
                    <Text style={styles.postTitle}>{post.title}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={18} color="#999" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.postContent} numberOfLines={4}>
                  {post.content}
                </Text>

                <View style={styles.postFooter}>
                  <View style={styles.interactionButtons}>
                    {/* Like Button */}
                    <TouchableOpacity
                      style={styles.interactionButton}
                      onPress={() => handleLikePress(post.id)}
                    >
                      <Ionicons
                        name={
                          likedPosts.has(post.id) ? "heart" : "heart-outline"
                        }
                        size={18}
                        color={likedPosts.has(post.id) ? "#E53935" : "#FF6B35"}
                      />
                      <Text style={styles.interactionText}>{post.likes}</Text>
                    </TouchableOpacity>

                    {/* Comment Button */}
                    <TouchableOpacity
                      style={styles.interactionButton}
                      onPress={() => handlePostPress(post.id)}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color="#FF6B35"
                      />
                      <Text style={styles.interactionText}>
                        {post.comments}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bookmark Button */}
                  <TouchableOpacity
                    onPress={() => handleBookmarkPress(post.id)}
                  >
                    <Ionicons
                      name={
                        bookmarkedPosts.has(post.id)
                          ? "bookmark"
                          : "bookmark-outline"
                      }
                      size={18}
                      color={
                        bookmarkedPosts.has(post.id) ? "#FFA000" : "#FF6B35"
                      }
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add extra spacing at the bottom to ensure all content is visible */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Side Menu Modal */}
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
              <Text style={styles.profileName}>{getGreetingName()}</Text>
              <Text style={styles.profileEmail}>{mockUser?.email}</Text>
            </View>
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sideMenuItem}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon as any} size={20} color="#757575" />
                  <Text style={styles.sideMenuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Bottom Navigation */}
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
    marginBottom: 80, // Space for bottom navigation
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30, // Extra padding for scrollable content
  },
  addPostContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "flex-end",
  },
  addPostButton: {
    backgroundColor: "#2EA78F",
    height: 35,
    paddingHorizontal: 30,
    paddingVertical: 10,
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
  },
  addPostButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    paddingVertical: 1,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  browseBySectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: "auto",
  },
  categoryButton: {
    width: "30%",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryButtonActive: {
    backgroundColor: "#757575",
  },
  categoryText: {
    fontSize: 9,
    color: "#000",
    borderColor: "#FFF",
    fontWeight: "400",
    justifyContent: "center",
    lineHeight: 12,
    alignItems: "center",
    textAlign: "center",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  postsSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    minHeight: 191,
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
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  postUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  postUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  postTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#333",
    flex: 1,
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  interactionButtons: {
    flexDirection: "row",
    gap: 16,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  interactionText: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "500",
  },
  // Bottom spacing to ensure all content is visible
  bottomSpacing: {
    height: 30,
  },
  // Side Menu Styles
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  sideMenu: {
    paddingTop: 40,
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
