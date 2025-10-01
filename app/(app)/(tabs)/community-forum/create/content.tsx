/**
 * Enhanced Create Post Screen with Modern UI Design
 * Features improved typography, better spacing, and visual enhancements
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
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";
import { useUser } from "@clerk/clerk-expo";
import { communityApi } from "../../../../../utils/communityForumApi";

const { width } = Dimensions.get("window");

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
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
      Alert.alert("Sign In Required", "Please sign in to save drafts");
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert("Missing Information", "Please add a title and content for your post");
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
      
      Alert.alert("✅ Draft Saved", "Your post has been saved as a draft. You can find it in your profile.");
      router.back();
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert("Save Failed", "Unable to save draft. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!user?.id) {
      Alert.alert("Sign In Required", "Please sign in to create posts");
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert("Missing Information", "Please add a title and content for your post");
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
      Alert.alert("Post Failed", "Unable to publish post. Please check your connection and try again.");
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

  const getCharacterColor = (length: number, max: number) => {
    if (length > max * 0.9) return "#FF6B6B";
    if (length > max * 0.8) return "#FFA726";
    return "#666";
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Create Post" showBack={true} />
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={styles.subtitle}>
                Share your thoughts with the community
              </Text>
              
              {selectedCategory && (
                <View style={styles.categoryBadge}>
                  <Ionicons name="pricetag" size={14} color="#FFFFFF" />
                  <Text style={styles.categoryText}>{selectedCategory}</Text>
                </View>
              )}
            </View>

            {/* Author Profile */}
            <View style={styles.authorSection}>
              <Text style={styles.sectionLabel}>Author</Text>
              <View style={styles.authorCard}>
                <View style={styles.authorInfo}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials()}</Text>
                    </View>
                  </View>
                  <View style={styles.authorDetails}>
                    <Text style={styles.authorName}>{getDisplayName()}</Text>
                    <Text style={styles.authorRole}>Community Member</Text>
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
            </View>

            {/* Post Content Section */}
            <View style={styles.contentSection}>
              <Text style={styles.sectionLabel}>Post Details</Text>
              
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Post Title</Text>
                  <Text style={[styles.charCount, { color: getCharacterColor(postTitle.length, 100) }]}>
                    {postTitle.length}/100
                  </Text>
                </View>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Give your post a meaningful title..."
                  placeholderTextColor="#999"
                  value={postTitle}
                  onChangeText={setPostTitle}
                  maxLength={100}
                />
              </View>

              {/* Content Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Your Story</Text>
                  <Text style={[styles.charCount, { color: getCharacterColor(postContent.length, 1000) }]}>
                    {postContent.length}/1000
                  </Text>
                </View>
                <View style={styles.contentInputContainer}>
                  <TextInput
                    style={styles.contentInput}
                    multiline
                    placeholder="Share your experiences, ask questions, or offer support to others..."
                    placeholderTextColor="#999"
                    value={postContent}
                    onChangeText={setPostContent}
                    textAlignVertical="top"
                    maxLength={1000}
                  />
                  <View style={styles.contentTips}>
                    <Ionicons name="bulb-outline" size={16} color="#7CB9A9" />
                    <Text style={styles.tipsText}>
                      Be authentic and respectful in your sharing
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Privacy Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionLabel}>Privacy Settings</Text>
              <View style={styles.privacyCard}>
                <View style={styles.privacyInfo}>
                  <Ionicons 
                    name={isPrivate ? "lock-closed" : "earth"} 
                    size={20} 
                    color={isPrivate ? "#FF6B6B" : "#4CAF50"} 
                  />
                  <View style={styles.privacyTextContainer}>
                    <Text style={styles.privacyTitle}>
                      {isPrivate ? "Private Post" : "Public Post"}
                    </Text>
                    <Text style={styles.privacyDescription}>
                      {isPrivate 
                        ? "Only visible to you and support workers" 
                        : "Visible to all community members"
                      }
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  thumbColor={isPrivate ? "#FF6B6B" : "#FFFFFF"}
                  trackColor={{ false: "#B0BEC5", true: "#FFCDD2" }}
                  ios_backgroundColor="#B0BEC5"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[
                  styles.draftButton,
                  (loading || !postTitle.trim() || !postContent.trim()) && styles.buttonDisabled
                ]}
                onPress={handleSaveDraft}
                disabled={loading || !postTitle.trim() || !postContent.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#666" />
                    <Text style={styles.draftButtonText}>Save Draft</Text>
                  </>
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.publishButtonText}>Publish to Community</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </Animated.View>

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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  
  // Header Section
  headerSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 10,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(124, 185, 169, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7CB9A9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Author Section
  authorSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  authorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  authorRole: {
    fontSize: 14,
    color: "#666",
  },
  
  // Content Section
  contentSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  charCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  titleInput: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
    borderWidth: 2,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contentInputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: "hidden",
  },
  contentInput: {
    minHeight: 160,
    padding: 16,
    fontSize: 15,
    lineHeight: 22,
    color: "#1A1A1A",
    textAlignVertical: "top",
  },
  contentTips: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(124, 185, 169, 0.05)",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 8,
  },
  tipsText: {
    fontSize: 12,
    color: "#7CB9A9",
    fontWeight: "500",
    flex: 1,
  },
  
  // Settings Section
  settingsSection: {
    marginBottom: 32,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  privacyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  privacyTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  
  // Actions Section
  actionsSection: {
    gap: 12,
    marginBottom: 40,
  },
  draftButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7CB9A9",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#7CB9A9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonDisabled: {
    backgroundColor: "#B6D5CF",
    shadowColor: "#B6D5CF",
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  
  bottomSpacing: {
    height: 20,
  },
});