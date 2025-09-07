import { useState } from "react";
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
    likes: 35,
    comments: 178,
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

const CATEGORIES = ["Trending", "Stress", "Support", "Stories", "Bookmarked", "Favorites"];

export default function CommunityMainScreen() {
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  const [activeTab, setActiveTab] = useState("community-forum");
  const { user, profile, logout } = useAuth();

  const handleBackPress = () => {
    router.back();
  };

  const handlePostPress = (postId: number) => {
    router.push(`/community-forum/${postId}`);
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
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Forum</Text>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Profile Summary */}
        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/women/17.jpg",
                }}
                style={styles.profileImage}
              />
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.userName}>{getDisplayName()}</Text>
              <Text style={styles.userStats}>0 Total Posts</Text>
            </View>
          </View>

          {/* Create New Post Button */}
          <TouchableOpacity
            style={styles.newPostButton}
            onPress={() => router.push("/community-forum/create")}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Browse By Categories */}
        <View style={styles.categoriesHeader}>
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
                <View style={styles.userInfo}>
                  <Image
                    source={{
                      uri: `https://randomuser.me/api/portraits/${
                        post.user.name.includes("Sarah") ? "women" : "men"
                      }/${post.id}.jpg`,
                    }}
                    style={styles.postUserImage}
                  />
                  <View>
                    <Text style={styles.postUserName}>{post.user.name}</Text>
                    <Text style={styles.postUserStats}>
                      {post.user.posts} posts
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{post.category}</Text>
                </View>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent}>{post.content}</Text>

              <View style={styles.postFooter}>
                <View style={styles.interactionButtons}>
                  <TouchableOpacity style={styles.interactionButton}>
                    <Ionicons name="heart-outline" size={20} color="#666" />
                    <Text style={styles.interactionText}>{post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.interactionButton}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color="#666"
                    />
                    <Text style={styles.interactionText}>{post.comments}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity>
                  <Ionicons name="bookmark-outline" size={20} color="#666" />
                </TouchableOpacity>
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
    backgroundColor: "#d9ead3",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileTextContainer: {
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  userStats: {
    fontSize: 14,
    color: "#757575",
  },
  newPostButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 35,
    height: 35,
    borderRadius: 28,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  categoriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: "center",
  },

  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    marginBottom: 4,
  },
  categoryButtonActive: {
    backgroundColor: "#4CAF50",
  },
  categoryText: {
    fontSize: 10,
    color: "#666",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  postsSection: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  postUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  postUserStats: {
    fontSize: 12,
    color: "#757575",
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
  },
  categoryTagText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
    marginBottom: 16,
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
    fontSize: 14,
    color: "#666",
  },
});
