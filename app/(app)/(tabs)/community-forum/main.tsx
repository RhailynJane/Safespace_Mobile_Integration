import { useState, useEffect, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useAuth } from "../../../../context/AuthContext";

const { width } = Dimensions.get("window");

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

const CATEGORIES = ["Trending", "Stress", "Support", "Stories", "Bookmark", "Favorites"];
export default function CommunityMainScreen() {
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  const [activeTab, setActiveTab] = useState("community-forum");
  const { user, profile, logout } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [commentedPosts, setCommentedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(
    new Set()
  );
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(`profileImage_${user?.uid}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };

  const getInitials = () => {
    const firstName = profile?.firstName || "";
    const lastName = profile?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getGreetingName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    return "User";
  };

  useEffect(() => {
    loadProfileImage();
  }, [user?.uid]);

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
        await logout();
      },
    },
  ];

  const handleLikePress = (postId: number) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
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

  const handleBackPress = () => {
    router.back();
  };

  const handlePostPress = (postId: number) => {
    router.push({
      pathname: "/community-forum/comments",
      params: { id: postId }
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

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName + " " + (profile.lastName || "");
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "John Doe";
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Top Header Row */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/profile/edit")}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Text style={styles.initialsText}>{getInitials()}</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={showSideMenu}
            >
              <Ionicons name="grid" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Profile Summary */}
        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <View style={styles.profileTextContainer}>
              <Text style={styles.userName}>{getDisplayName()}</Text>
              <Text style={styles.userStats}>
                <Ionicons name="document-text" size={16} color="#666" /> 0 Total Posts
              </Text>          
            </View>
          </View>
        </View>
      </View>

      {/* Dedicated Add Post Button Container */}
      <View style={styles.addPostContainer}>
        <TouchableOpacity
          style={styles.addPostButton}
          onPress={() => router.push("/community-forum/create")}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addPostButtonText}>Create New Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Browse By Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.browseBySectionTitle}>Browse By</Text>
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
        </View>

        {/* Posts List */}
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
                  <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              <Text style={styles.postContent} numberOfLines={4}>
                {post.content}
              </Text>

              <View style={styles.postFooter}>
                <View style={styles.interactionButtons}>
                  <TouchableOpacity
                    style={styles.interactionButton}
                    onPress={() => handleLikePress(post.id)}
                  >
                    <Ionicons
                      name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
                      size={18}
                      color={likedPosts.has(post.id) ? "#E53935" : "#FF6B35"}
                    />
                    <Text style={styles.interactionText}>{post.likes}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.interactionButton}
                    onPress={() =>
                      router.push({
                        pathname: "/community-forum/comments",
                        params: { id: post.id },
                      })
                    }
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color="#FF6B35"
                    />
                    <Text style={styles.interactionText}>{post.comments}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => handleBookmarkPress(post.id)}>
                  <Ionicons
                    name={bookmarkedPosts.has(post.id) ? "bookmark" : "bookmark-outline"}
                    size={18}
                    color={bookmarkedPosts.has(post.id) ? "#FFA000" : "#FF6B35"}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Side Menu Modal */}
      <Modal
        animationType="none" 
        transparent={true}
        visible={sideMenuVisible}
        onRequestClose={hideSideMenu}
      >
        <Animated.View style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={hideSideMenu}
          />
          <Animated.View style={[styles.sideMenu, { opacity: fadeAnim }]}>
            <View style={styles.sideMenuHeader}>
              <Text style={styles.profileName}>{getGreetingName()}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sideMenuItem}
                  onPress={item.onPress}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color="#757575"
                  />
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
    backgroundColor: "#F2F2F7",
  },
  headerContainer: {
    backgroundColor: "#7BB8A8",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    
    
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: "#7BB8A8",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    borderBottomLeftRadius: 40,    
    borderBottomRightRadius: 40,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    borderTopLeftRadius: 40,    // Add this
    borderTopRightRadius: 40,
  },
  profileTextContainer: {
    flex: 1,
    alignItems: "flex-start",
    
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userStats: {
    fontSize: 14,
    color: "#666",
  },
  addPostContainer: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  addPostButton: {
    backgroundColor: "#28A745",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#28A745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addPostButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  browseBySectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  categoryButtonActive: {
    backgroundColor: "#333",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  moreButton: {
    padding: 4,
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
  // Side Menu Styles
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
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