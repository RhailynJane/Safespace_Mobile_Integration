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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Alert } from "react-native";
const { width, height } = Dimensions.get("window");

// Available emoji reactions
const EMOJI_REACTIONS = ["❤️", "👍", "😊", "😢", "😮", "🔥"];

const POSTS = [
  {
    id: 1,
    title: "Struggling with Sleep Due to Stress?",
    content:
      "Lately, stress has really been affecting my sleep – either I can't fall asleep or I wake up feeling exhausted.\n\nJust wondering... how do you all cope with this?\nAny tips or routines that help you sleep better during stressful times?\n\nWould love to hear what works for you. 😊",
    reactions: { "❤️": 12, "👍": 8, "😊": 15, "😢": 3, "😮": 2, "🔥": 5 },
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
    reactions: { "❤️": 20, "👍": 15, "😊": 18, "😢": 8, "😮": 1, "🔥": 3 },
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
    reactions: { "❤️": 45, "👍": 32, "😊": 28, "😢": 2, "😮": 5, "🔥": 38 },
    category: "Stories",
    user: {
      name: "John L.",
      posts: 7,
    },
  },
];

const CATEGORIES = [
  "Trending",
  "Stress",
  "Support",
  "Stories",
  "Bookmark",
  "Favorites",
];

export default function CommunityMainScreen() {
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  const [activeTab, setActiveTab] = useState("community-forum");
  const [postReactions, setPostReactions] = useState<Map<number, string>>(new Map());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [reactionPickerVisible, setReactionPickerVisible] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

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

  const handleReactionPress = (postId: number, emoji: string) => {
    const currentReaction = postReactions.get(postId);
    if (currentReaction === emoji) {
      // Remove reaction if clicking the same emoji
      const newReactions = new Map(postReactions);
      newReactions.delete(postId);
      setPostReactions(newReactions);
    } else {
      // Add or change reaction
      const newReactions = new Map(postReactions);
      newReactions.set(postId, emoji);
      setPostReactions(newReactions);
    }
    setReactionPickerVisible(null);
  };

  const handleBookmarkPress = (postId: number) => {
    const newBookmarkedPosts = new Set(bookmarkedPosts);
    if (newBookmarkedPosts.has(postId)) {
      newBookmarkedPosts.delete(postId);
    } else {
      newBookmarkedPosts.add(postId);
    }
    setBookmarkedPosts(newBookmarkedPosts);
  };

  const handlePostPress = (postId: number) => {
    // Navigate to post detail view (without comments)
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
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CurvedBackground style={styles.curvedBackground} />
      <AppHeader title="Community Forum" showBack={true} />

      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.categoriesSection}>
            <TouchableOpacity
              style={styles.addPostButton}
              onPress={() => router.push("/community-forum/create")}
            >
              <Ionicons name="add" size={10} color="#FFFFFF" />
              <Text style={styles.addPostButtonText}>Add Post</Text>
            </TouchableOpacity>

            <Text style={styles.browseBySectionTitle}>Browse By</Text>

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
                    {/* Reaction Button */}
                    <TouchableOpacity
                      style={styles.reactionButton}
                      onPress={() => setReactionPickerVisible(post.id)}
                    >
                      <Text style={styles.reactionEmoji}>
                        {postReactions.get(post.id) || "❤️"}
                      </Text>
                      <Text style={styles.interactionText}>
                        {getTotalReactions(post.reactions)}
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
                      size={24}
                      color={
                        bookmarkedPosts.has(post.id) ? "#FFA000" : "#FF6B35"
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Reaction Picker Modal */}
                {reactionPickerVisible === post.id && (
                  <View style={styles.reactionPicker}>
                    {EMOJI_REACTIONS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.emojiButton,
                          postReactions.get(post.id) === emoji && styles.emojiButtonActive
                        ]}
                        onPress={() => handleReactionPress(post.id, emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Overlay to close reaction picker */}
      {reactionPickerVisible !== null && (
        <Pressable
          style={styles.reactionOverlay}
          onPress={() => setReactionPickerVisible(null)}
        />
      )}

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
  addPostButton: {
    backgroundColor: "#2EA78F",
    height: 35,
    paddingHorizontal: 30,
    paddingVertical: 6,
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
    fontSize: 16,
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
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: "900",
    color: "#333",
    flex: 1,
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 14,
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
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  reactionEmoji: {
    fontSize: 24,
  },
  interactionText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  reactionPicker: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignSelf: "flex-start",
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
    fontSize: 28,
  },
  reactionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
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