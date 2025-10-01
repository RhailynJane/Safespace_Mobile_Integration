/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";
import { useUser } from "@clerk/clerk-expo";
import { communityApi } from "../../../../../utils/communityForumApi";

export default function CreatePostScreen() {
  const params = useLocalSearchParams();
  const { user } = useUser();
  const selectedCategory = params.category as string;
  
  const [activeTab, setActiveTab] = useState("community-forum");
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDisplayName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.split("@")[0];
    }
    return "User";
  };

  const getInitials = () => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    const displayName = getDisplayName() ?? "";
    return displayName.charAt(0).toUpperCase();
  };

  const handleSaveDraft = async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in to save drafts");
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert("Error", "Please add a title and content");
      return;
    }

    setLoading(true);
    try {
      await communityApi.createPost({
        clerkUserId: user.id,
        title: postTitle,
        content: postContent,
        category: selectedCategory,
        isPrivate,
        isDraft: true,
      });
      
      Alert.alert("Draft Saved", "Your post has been saved as a draft.");
      router.back();
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert("Error", "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in to create posts");
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert("Error", "Please add a title and content");
      return;
    }

    setLoading(true);
    try {
      await communityApi.createPost({
        clerkUserId: user.id,
        title: postTitle,
        content: postContent,
        category: selectedCategory,
        isPrivate,
        isDraft: false,
      });
      
      router.push("/community-forum/create/success");
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert("Error", "Failed to create post");
    } finally {
      setLoading(false);
    }
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

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Community Forum" showBack={true} />
        <ScrollView style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Post Content</Text>
            {selectedCategory && (
              <Text style={styles.categoryIndicator}>
                Category: {selectedCategory}
              </Text>
            )}
          </View>

          {/* User Profile Summary with Post Card Inside */}
          <View style={styles.profileCard}>
            <View style={styles.profileSection}>
              <View style={styles.profileContainer}>
                <View style={styles.profileImageContainer}>
                  <View style={styles.profileImageFallback}>
                    <Text style={styles.initialsText}>{getInitials()}</Text>
                  </View>
                </View>
                <View style={styles.profileTextContainer}>
                  <Text style={styles.userName}>{getDisplayName()}</Text>
                </View>
              </View>
            </View>
            
            {/* Post Title Input */}
            <View style={styles.titleInputContainer}>
              <TextInput
                style={styles.titleInput}
                placeholder="Post title..."
                value={postTitle}
                onChangeText={setPostTitle}
                maxLength={100}
              />
              <Text style={styles.charCount}>
                {postTitle.length}/100
              </Text>
            </View>

            {/* Post Content Card */}
            <View style={styles.postCard}>
              <TextInput
                style={styles.postInput}
                multiline
                placeholder="Share your thoughts, experiences, or questions..."
                value={postContent}
                onChangeText={setPostContent}
                textAlignVertical="top"
                maxLength={1000}
              />

              {/* Character Count */}
              <View style={styles.postActions}>
                <Text style={styles.charCount}>
                  {postContent.length}/1000
                </Text>
              </View>
            </View>

            <View style={styles.divider} />
          </View>

          {/* Privacy Settings */}
          <View style={styles.privacyContainer}>
            <View style={styles.privacyRow}>
              <Text style={styles.privacyText}>Hide from Community?</Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                thumbColor={isPrivate ? "#4CAF50" : "#f4f3f4"}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
              />
            </View>
            {isPrivate && (
              <Text style={styles.privacyNote}>
                This post will only be visible to you and support workers.
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.draftButton,
                loading && styles.buttonDisabled
              ]}
              onPress={handleSaveDraft}
              disabled={loading || !postTitle.trim() || !postContent.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.draftButtonText}>Save as Draft</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.publishButton,
                (!postContent.trim() || !postTitle.trim() || loading) && styles.publishButtonDisabled
              ]}
              onPress={handlePublish}
              disabled={!postContent.trim() || !postTitle.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.publishButtonText}>Publish Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  curvedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  headerContainer: {
    backgroundColor: "#transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  communityPostButton: {
    backgroundColor: "#EDE7EC",
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#000",
  },
  communityPostButtonText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "600",
  },
  headerRight: {
    width: 24, // Placeholder for balance
  },
  titleSection: {
    paddingHorizontal: 15,
    backgroundColor: "transparent",
    paddingVertical: 16,
  },
  mainTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#000",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: "transparent",
  },
  profileCard: {
    backgroundColor: "#EDE7EC",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: "#999",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  profileSection: {
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileImageFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileTextContainer: {
    justifyContent: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  postCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
  },
  postInput: {
    minHeight: 120,
    fontSize: 12,
    textAlignVertical: "top",
    color: "#424242",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  actionIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  privacyContainer: {
    backgroundColor: "transparent",
    borderRadius: 12,
    marginTop: 10,
    padding: 16,
  },
  privacyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  privacyNote: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "column",
    padding: 20,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "transparent",
    gap: 12,
    marginBottom: 40,
  },
  draftButton: {
    backgroundColor: "#B6D5CF",
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    marginRight: 30,
    marginLeft: 30,
    shadowColor: "#999",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  draftButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  publishButton: {
    backgroundColor: "#7CB9A9",
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    marginRight: 30,
    marginLeft: 30,
    shadowColor: "#999",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  publishButtonDisabled: {
    backgroundColor: "#B6D5CF",
  },
  publishButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  categoryIndicator: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  titleInputContainer: {
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});