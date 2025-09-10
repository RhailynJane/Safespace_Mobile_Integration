import { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import { useAuth } from "../../../../context/AuthContext";

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

const CATEGORIES = ["Trending", "Stress", "Support", "Stories"];

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
          <TouchableOpacity>
            <Ionicons name="grid" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Summary */}
        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/men/17.jpg",
                }}
                style={styles.profileImage}
              />
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.userName}>{getDisplayName()}</Text>
              <Text style={styles.userStats}>📝 0 Total Posts</Text>
            </View>
          </View>

          {/* Add Post Button */}
          <TouchableOpacity
            style={styles.addPostButton}
            onPress={() => router.push("/community-forum/create")}
          >
            <Text style={styles.addPostButtonText}>Add Post</Text>
          </TouchableOpacity>
        </View>

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
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#7BB8A8",
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
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: "#D4EDDA",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileTextContainer: {
    flex: 1,
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
  addPostButton: {
    backgroundColor: "#28A745",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPostButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
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
    marginBottom: 12,
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
});