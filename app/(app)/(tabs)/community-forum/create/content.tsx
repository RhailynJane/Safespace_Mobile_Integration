/**
 * Enhanced Create Post Screen with Modern UI Design
 * Features improved typography, better spacing, and visual enhancements
 * Uses modal system for user feedback instead of Alert
 * LLM Prompt: Add comprehensive comments to this React Native component.
 * Reference: chat.deepseek.com
 */
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Switch,
  ActivityIndicator,
  Dimensions,
  Animated,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";
import { useUser } from "@clerk/clerk-expo";
import { communityApi } from "../../../../../utils/communityForumApi";
import { useTheme } from "../../../../../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import avatarEvents from "../../../../../utils/avatarEvents";
import { makeAbsoluteUrl } from "../../../../../utils/apiBaseUrl";

const { width } = Dimensions.get("window");

export default function CreatePostScreen() {
  const { theme } = useTheme();
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
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successCallback, setSuccessCallback] = useState<(() => void) | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Error");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadProfileImage = useCallback(async () => {
    try {
      const storedImage = await AsyncStorage.getItem("profileImage");
      console.log('📝 Create Post: Loaded from AsyncStorage:', storedImage);
      if (storedImage) {
        setProfileImage(storedImage);
        console.log('📝 Create Post: Set profileImage to:', storedImage);
        return;
      }
      if (user?.imageUrl) {
        console.log('📝 Create Post: Using Clerk imageUrl:', user.imageUrl);
        setProfileImage(user.imageUrl);
      }
    } catch (error) {
      console.error("Error loading profile image:", error);
    }
  }, [user?.imageUrl]);

  useEffect(() => {
    loadProfileImage();
    
    const unsubscribe = avatarEvents.subscribe((newAvatarUrl) => {
      console.log('📝 Create Post received avatar event:', newAvatarUrl);
      setProfileImage(newAvatarUrl);
      if (newAvatarUrl) {
        AsyncStorage.setItem("profileImage", newAvatarUrl);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadProfileImage]);

  const normalizeImageUri = (uri: string | null | undefined): string | null => {
    if (!uri) {
      console.log('📝 Create Post normalizeImageUri: uri is null/undefined');
      return null;
    }
    if (uri.startsWith('data:image')) {
      console.log('📝 Create Post normalizeImageUri: Blocking base64 image');
      return null;
    }
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('📝 Create Post normalizeImageUri: Using absolute URL:', uri);
      return uri;
    }
    if (uri.startsWith('/')) {
      const absolute = makeAbsoluteUrl(uri);
      console.log('📝 Create Post normalizeImageUri: Converted relative to absolute:', absolute);
      return absolute;
    }
    console.log('📝 Create Post normalizeImageUri: Returning as-is:', uri);
    return uri;
  };

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

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const showSuccess = (message: string, callback?: () => void) => {
    setSuccessMessage(message);
    setSuccessCallback(() => callback || null);
    setShowSuccessModal(true);
  };

  const handleSaveDraft = async () => {
    if (!user?.id) {
      showError("Sign In Required", "Please sign in to save drafts");
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      showError("Missing Information", "Please add a title and content for your post");
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
      
      showSuccess("Your post has been saved as a draft. You can find it in your profile.", () => {
        router.push("/community-forum");
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      showError("Save Failed", "Unable to save draft. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!user?.id) {
      showError("Sign In Required", "Please sign in to create posts");
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      showError("Missing Information", "Please add a title and content for your post");
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
      showError("Post Failed", "Unable to publish post. Please check your connection and try again.");
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Author</Text>
              <View style={[styles.authorCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.authorInfo}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      {normalizeImageUri(profileImage) ? (
                        <Image 
                          source={{ uri: normalizeImageUri(profileImage)! }} 
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarText}>{getInitials()}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.authorDetails}>
                    <Text style={[styles.authorName, { color: theme.colors.text }]}>{getDisplayName()}</Text>
                    <Text style={[styles.authorRole, { color: theme.colors.textSecondary }]}>Community Member</Text>
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
            </View>

            {/* Post Content Section */}
            <View style={styles.contentSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Post Details</Text>
              
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Post Title</Text>
                  <Text style={[styles.charCount, { color: getCharacterColor(postTitle.length, 100) }]}>
                    {postTitle.length}/100
                  </Text>
                </View>
                <TextInput
                  style={[styles.titleInput, { 
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.borderLight
                  }]}
                  placeholder="Give your post a meaningful title..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={postTitle}
                  onChangeText={setPostTitle}
                  maxLength={100}
                />
              </View>

              {/* Content Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Your Story</Text>
                  <Text style={[styles.charCount, { color: getCharacterColor(postContent.length, 1000) }]}>
                    {postContent.length}/1000
                  </Text>
                </View>
                <View style={[styles.contentInputContainer, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight
                }]}>
                  <TextInput
                    style={[styles.contentInput, { color: theme.colors.text }]}
                    multiline
                    placeholder="Share your experiences, ask questions, or offer support to others..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={postContent}
                    onChangeText={setPostContent}
                    textAlignVertical="top"
                    maxLength={1000}
                  />
                  <View style={[styles.contentTips, { borderTopColor: theme.colors.borderLight }]}>
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
              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Privacy Settings</Text>
              <View style={[styles.privacyCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.privacyInfo}>
                  <Ionicons 
                    name={isPrivate ? "lock-closed" : "earth"} 
                    size={20} 
                    color={isPrivate ? "#FF6B6B" : "#4CAF50"} 
                  />
                  <View style={styles.privacyTextContainer}>
                    <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>
                      {isPrivate ? "Private Post" : "Public Post"}
                    </Text>
                    <Text style={[styles.privacyDescription, { color: theme.colors.textSecondary }]}>
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
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  (loading || !postTitle.trim() || !postContent.trim()) && styles.buttonDisabled
                ]}
                onPress={handleSaveDraft}
                disabled={loading || !postTitle.trim() || !postContent.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color={theme.colors.textSecondary} />
                    <Text style={[styles.draftButtonText, { color: theme.colors.textSecondary }]}>Save Draft</Text>
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

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>Success!</Text>
              <Text style={styles.successMessage}>{successMessage}</Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  if (successCallback) {
                    successCallback();
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.successButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowErrorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="close-circle" size={80} color="#FF3B30" />
              </View>
              <Text style={styles.errorTitle}>{errorTitle}</Text>
              <Text style={styles.successMessage}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => setShowErrorModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.successButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    marginBottom: 12,
  },
  authorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    overflow: "hidden",
  },
  avatarImage: {
    width: 50,
    height: 50,
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
    marginBottom: 2,
  },
  authorRole: {
    fontSize: 14,
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
  },
  charCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  titleInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contentInputContainer: {
    borderRadius: 12,
    borderWidth: 2,
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
    textAlignVertical: "top",
  },
  contentTips: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(124, 185, 169, 0.05)",
    borderTopWidth: 1,
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
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
  },
  errorButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});