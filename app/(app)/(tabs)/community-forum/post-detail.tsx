import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import { useState } from "react";

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
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    },
    timestamp: "2 hours ago",
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
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    timestamp: "4 hours ago",
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
      avatar: "https://randomuser.me/api/portraits/men/33.jpg",
    },
    timestamp: "1 day ago",
  },
];

export default function PostDetailScreen() {
  const params = useLocalSearchParams();
  const postId = parseInt(params.id as string, 10);
  const post = POSTS.find((p) => p.id === postId);

  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

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

  const handleReactionPress = (emoji: string) => {
    if (userReaction === emoji) {
      setUserReaction(null);
    } else {
      setUserReaction(emoji);
    }
    setReactionPickerVisible(false);
  };

  const getTotalReactions = (reactions: { [key: string]: number }) => {
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  const handleBookmarkPress = () => {
    setBookmarked(!bookmarked);
  };

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
              <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{post.user.name}</Text>
                <Text style={styles.postMeta}>
                  {post.user.posts} posts • {post.timestamp}
                </Text>
              </View>
            </View>

            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{post.category}</Text>
            </View>

            {/* Post Title */}
            <Text style={styles.postTitle}>{post.title}</Text>

            {/* Post Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Reaction Stats - Now Tappable */}
            <View style={styles.reactionStats}>
              {Object.entries(post.reactions).map(([emoji, count]) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.reactionStat,
                    userReaction === emoji && styles.reactionStatActive,
                  ]}
                  onPress={() => handleReactionPress(emoji)}
                >
                  <Text style={styles.reactionStatEmoji}>{emoji}</Text>
                  <Text style={styles.reactionStatCount}>{count}</Text>
                </TouchableOpacity>
              ))}
              
              {/* Add More Reactions Button */}
              <TouchableOpacity
                style={styles.addMoreReactionButton}
                onPress={() => setReactionPickerVisible(!reactionPickerVisible)}
              >
                <Ionicons name="add-circle" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons - Removed, reactions now in stats section */}
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
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Related Posts Section */}
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Posts</Text>
            {POSTS.filter((p) => p.id !== postId && p.category === post.category)
              .slice(0, 2)
              .map((relatedPost) => (
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
                  <Image
                    source={{ uri: relatedPost.user.avatar }}
                    style={styles.relatedAvatar}
                  />
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedPostTitle} numberOfLines={2}>
                      {relatedPost.title}
                    </Text>
                    <Text style={styles.relatedPostMeta}>
                      by {relatedPost.user.name} •{" "}
                      {getTotalReactions(relatedPost.reactions)} reactions
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
          </View>

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
    borderRadius: 12,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
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
  moreButton: {
    padding: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 4,
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
  bookmarkSection: {
    marginBottom: 16,
  },
  bookmarkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  bookmarkButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
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
    marginRight: 12,
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