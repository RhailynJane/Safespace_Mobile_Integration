/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";

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
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
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
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
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
      avatar: "https://randomuser.me/api/portraits/men/33.jpg",
    },
  },
];

// Define the comment type
interface CommentType {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
}

// Define the type for POST_COMMENTS with number index signature
interface PostComments {
  [key: number]: CommentType[];
}

// Mock comments data for each post with proper typing
const POST_COMMENTS: PostComments = {
  1: [
    {
      id: 1,
      user: {
        name: "Emma Wilson",
        avatar: "https://randomuser.me/api/portraits/women/13.jpg",
      },
      content: "I find that reading before bed really helps me sleep better!",
      timestamp: "2 hours ago",
      likes: 5,
    },
    {
      id: 2,
      user: {
        name: "David Kim",
        avatar: "https://randomuser.me/api/portraits/men/23.jpg",
      },
      content: "Meditation and deep breathing exercises work wonders for me.",
      timestamp: "1 hour ago",
      likes: 3,
    },
    {
      id: 3,
      user: {
        name: "Lisa Rodriguez",
        avatar: "https://randomuser.me/api/portraits/women/34.jpg",
      },
      content: "I use a white noise machine and it's been life-changing!",
      timestamp: "45 minutes ago",
      likes: 8,
    },
  ],
  2: [
    {
      id: 1,
      user: {
        name: "Alex Morgan",
        avatar: "https://randomuser.me/api/portraits/men/24.jpg",
      },
      content: "Journaling has been incredibly helpful for my anxiety.",
      timestamp: "3 hours ago",
      likes: 12,
    },
    {
      id: 2,
      user: {
        name: "Sophia Chen",
        avatar: "https://randomuser.me/api/portraits/women/14.jpg",
      },
      content: "Talking to a therapist made a huge difference for me.",
      timestamp: "2 hours ago",
      likes: 7,
    },
  ],
  3: [
    {
      id: 1,
      user: {
        name: "Marcus Brown",
        avatar: "https://randomuser.me/api/portraits/men/25.jpg",
      },
      content:
        "Great tips! I also find that limiting screen time before bed helps.",
      timestamp: "1 hour ago",
      likes: 4,
    },
    {
      id: 2,
      user: {
        name: "Olivia Davis",
        avatar: "https://randomuser.me/api/portraits/women/15.jpg",
      },
      content:
        "I started practicing gratitude too and it's amazing how it changes your perspective!",
      timestamp: "30 minutes ago",
      likes: 6,
    },
  ],
};

export default function CommentsScreen() {
  const params = useLocalSearchParams();
  const postIdParam = params.id || params.postId;
  const [newComment, setNewComment] = useState("");

  // Convert postId to number and find the post
  const numericPostId = parseInt(postIdParam as string, 10);
  const post = POSTS.find((p) => p.id === numericPostId);

  // Get comments for this post
  const [comments, setComments] = useState<CommentType[]>(
    POST_COMMENTS[numericPostId] || []
  );

  // Debug: log the parameters to see what's being passed
  console.log("Received params:", params);
  console.log("Looking for post ID:", numericPostId);

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Post not found (ID: {numericPostId})
          </Text>
          <Text style={styles.errorSubtext}>
            Available post IDs: {POSTS.map((p) => p.id).join(", ")}
          </Text>
          <Text style={styles.errorSubtext}>
            Received parameters: {JSON.stringify(params)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj: CommentType = {
        id: comments.length + 1,
        user: {
          name: "You",
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
    // Implement like functionality
    console.log("Liked comment:", commentId);
  };

  const renderComment = ({ item }: { item: CommentType }) => (
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      style={{ flex: 1 }}
    >
      <CurvedBackground>
        <SafeAreaView style={styles.container}>
          <AppHeader title="Comments" showBack={true} />

          <View style={styles.content}>
            {/* Original Post */}
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: post.user.avatar }}
                  style={styles.postAvatar}
                />
                <View>
                  <Text style={styles.postUserName}>{post.user.name}</Text>
                  <Text style={styles.postUserStats}>
                    {post.user.posts} posts
                  </Text>
                </View>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent}>{post.content}</Text>

              <View style={styles.postFooter}>
                <View style={styles.postStats}>
                  <Ionicons name="heart-outline" size={16} color="#666" />
                  <Text style={styles.postStatText}>{post.likes}</Text>

                  <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.postStatText}>{post.comments}</Text>
                </View>
              </View>
            </View>

            {/* Comments List */}
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color="#E0E0E0"
                  />
                  <Text style={styles.emptyCommentsText}>No comments yet</Text>
                  <Text style={styles.emptyCommentsSubtext}>
                    Be the first to share your thoughts!
                  </Text>
                </View>
              }
            />
          </View>

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newComment.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  postStatText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
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
  emptyComments: {
    alignItems: "center",
    padding: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
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
