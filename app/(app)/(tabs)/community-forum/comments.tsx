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
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import { useAuth } from "../../../../context/AuthContext";

// Mock data for comments
const COMMENTS = [
  {
    id: 1,
    user: {
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    },
    content: "I find that reading before bed really helps me sleep better!",
    timestamp: "2 hours ago",
    likes: 5,
  },
  {
    id: 2,
    user: {
      name: "Michael Chen",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    content: "Meditation and deep breathing exercises work wonders for me.",
    timestamp: "1 hour ago",
    likes: 3,
  },
  {
    id: 3,
    user: {
      name: "Emily Davis",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    },
    content: "I use a white noise machine and it's been life-changing!",
    timestamp: "45 minutes ago",
    likes: 8,
  },
];

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(COMMENTS);
  const { user, profile, logout } = useAuth();

  const post = {
    id: 1,
    title: "Struggling with Sleep Due to Stress?",
    content:
      "Lately, stress has really been affecting my sleep – either I can't fall asleep or I wake up feeling exhausted.",
    user: {
      name: "John Doe",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    likes: 20,
    comments: 241,
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: comments.length + 1,
        user: {
          name: "Current User",
          avatar: "https://randomuser.me/api/portraits/women/17.jpg",
        },
        content: newComment.trim(),
        timestamp: "Just now",
        likes: 0,
      };

      setComments([newCommentObj, ...comments]);
      setNewComment("");
    }
  };

  const handleLikeComment = (commentId: number) => {
    console.log("Liked comment:", commentId);
  };

  type Comment = {
    id: number;
    user: {
      name: string;
      avatar: string;
    };
    content: string;
    timestamp: string;
    likes: number;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Image
          source={{ uri: item.user.avatar }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentUserInfo}>
          <Text style={styles.commentUserName}>{item.user.name}</Text>
          <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
        </View>
      </View>

      <Text style={styles.commentContent}>{item.content}</Text>

      <View style={styles.commentFooter}>
        <TouchableOpacity
          style={styles.commentLikeButton}
          onPress={() => handleLikeComment(item.id)}
        >
          <Ionicons name="heart-outline" size={16} color="#666" />
          <Text style={styles.commentLikeText}>{item.likes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

  const [activeTab, setActiveTab] = useState("community-forum");

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
  commentsList: {
    paddingBottom: 80,
  },
  commentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#757575",
  },
  commentContent: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
    marginBottom: 12,
  },
  commentFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  commentLikeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentLikeText: {
    fontSize: 12,
    color: "#666",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
});
