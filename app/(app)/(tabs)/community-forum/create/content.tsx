/**
 * Modern Facebook-Style Create Post Screen
 * Features: Photo upload, feeling/mood selection, privacy toggle, save draft/publish
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";
import { useUser } from "@clerk/clerk-expo";
import { useConvex } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useTheme } from "../../../../../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import avatarEvents from "../../../../../utils/avatarEvents";
import { makeAbsoluteUrl } from "../../../../../utils/apiBaseUrl";
import StatusModal from "../../../../../components/StatusModal";
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MOODS = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "excited", emoji: "🤩", label: "Excited" },
  { id: "grateful", emoji: "🙏", label: "Grateful" },
  { id: "loved", emoji: "🥰", label: "Loved" },
  { id: "hopeful", emoji: "😌", label: "Hopeful" },
  { id: "calm", emoji: "😊", label: "Calm" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "anxious", emoji: "😰", label: "Anxious" },
  { id: "stressed", emoji: "😫", label: "Stressed" },
  { id: "frustrated", emoji: "😤", label: "Frustrated" },
  { id: "angry", emoji: "😠", label: "Angry" },
  { id: "tired", emoji: "😴", label: "Tired" },
];

export default function CreatePostScreen() {
  const { theme, scaledFontSize } = useTheme();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const selectedCategory = params.category as string;
  
  const [activeTab, setActiveTab] = useState("community-forum");
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const convex = useConvex();

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successCallback, setSuccessCallback] = useState<(() => void) | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Error");

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

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

  const pickImage = async () => {
    if (selectedImages.length >= 3) {
      showError('Maximum Photos', 'You can only add up to 3 photos');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Permission Denied', 'We need permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Compress the image
      const manipResult = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      
      setSelectedImages([...selectedImages, manipResult.uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!user?.id) {
      showError("Sign In Required", "Please sign in to save drafts");
      return;
    }

    if (!postContent.trim() && !postTitle.trim()) {
      showError("Missing Information", "Please add a title or content for your post");
      return;
    }

    setLoading(true);
    try {
      const title = postTitle.trim() || postContent.substring(0, 50) + (postContent.length > 50 ? '...' : '');
      const draftResult = await convex.mutation(api.posts.create, {
        title,
        content: postContent,
        category: selectedCategory,
        isDraft: true,
      });
      showSuccess("Your post has been saved as a draft.", () => {
        router.push("/(app)/(tabs)/community-forum");
      });
    } catch (error) {
      console.error('Error saving draft via Convex:', error);
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

    if (!postContent.trim() && !postTitle.trim()) {
      showError("Missing Information", "Please add a title or content for your post");
      return;
    }

    setLoading(true);
    try {
      const title = postTitle.trim() || postContent.substring(0, 50) + (postContent.length > 50 ? '...' : '');
      const publishResult = await convex.mutation(api.posts.create, {
        title,
        content: postContent,
        category: selectedCategory,
        isDraft: false,
      });
      const createdId = (publishResult as any)?.postId;
      router.push({
        pathname: "/(app)/(tabs)/community-forum/create/success",
        params: createdId ? { postId: String(createdId) } : undefined,
      });
    } catch (error) {
      console.error('Error publishing via Convex:', error);
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
        <AppHeader 
          title="Create Post" 
          showBack={true}
          rightActions={
            (postContent.trim() || postTitle.trim()) ? (
              <TouchableOpacity onPress={handlePublish} disabled={loading}>
                <Text style={[styles.nextButton, loading && styles.nextButtonDisabled]}>
                  {loading ? "..." : "NEXT"}
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Author Header - Transparent */}
          <View style={styles.authorHeader}>
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
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: theme.colors.text }]}>{getDisplayName()}</Text>
              <TouchableOpacity 
                style={styles.privacyButton}
                onPress={() => setIsPrivate(!isPrivate)}
              >
                <Ionicons 
                  name={isPrivate ? "lock-closed" : "earth"} 
                  size={scaledFontSize(12)} 
                  color={theme.colors.textSecondary} 
                />
                <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
                  {isPrivate ? "Private" : "Public"}
                </Text>
                <Ionicons name="chevron-down" size={scaledFontSize(12)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Badge */}
          {selectedCategory && (
            <View style={styles.categoryContainer}>
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={scaledFontSize(14)} color="#7CB9A9" />
                <Text style={[styles.categoryText, { color: "#7CB9A9" }]}>{selectedCategory}</Text>
              </View>
            </View>
          )}

          {/* Content Card */}
          <View style={[styles.contentCard, { backgroundColor: theme.colors.surface }]}>
            {/* Post Title Input */}
            <TextInput
              style={[styles.titleInput, { color: theme.colors.text }]}
              placeholder="Post Title"
              placeholderTextColor={theme.colors.textSecondary}
              value={postTitle}
              onChangeText={setPostTitle}
            />

            {/* Post Content Input */}
            <TextInput
              style={[styles.contentInput, { color: theme.colors.text }]}
              multiline
              placeholder={`What's on your mind, ${getDisplayName()}?`}
              placeholderTextColor={theme.colors.textSecondary}
              value={postContent}
              onChangeText={setPostContent}
              textAlignVertical="top"
            />

            {/* Selected Mood */}
            {selectedMood && (
              <View style={styles.selectedMoodContainer}>
                <View style={styles.selectedMood}>
                  <Text style={styles.moodEmoji}>{selectedMood.emoji}</Text>
                  <Text style={[styles.moodText, { color: theme.colors.text }]}>
                    Feeling {selectedMood.label}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMood(null)}>
                  <Ionicons name="close-circle" size={scaledFontSize(20)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Selected Images */}
            {selectedImages.length > 0 && (
              <View style={styles.imagesGrid}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={[
                    styles.imageContainer,
                    selectedImages.length === 1 && styles.singleImage,
                    selectedImages.length === 2 && styles.doubleImage,
                    selectedImages.length === 3 && styles.tripleImage,
                  ]}>
                    <Image source={{ uri }} style={styles.selectedImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Mood Picker Modal */}
            {showMoodPicker && (
              <View style={[styles.moodPickerContainer, { backgroundColor: theme.colors.background }]}>
                <View style={styles.moodPickerHeader}>
                  <Text style={[styles.moodPickerTitle, { color: theme.colors.text }]}>How are you feeling?</Text>
                  <TouchableOpacity onPress={() => setShowMoodPicker(false)}>
                    <Ionicons name="close" size={scaledFontSize(24)} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.moodList} showsVerticalScrollIndicator={false}>
                  {MOODS.map((mood) => (
                    <TouchableOpacity
                      key={mood.id}
                      style={[styles.moodItem, { borderBottomColor: theme.colors.borderLight }]}
                      onPress={() => {
                        setSelectedMood(mood);
                        setShowMoodPicker(false);
                      }}
                    >
                      <Text style={styles.moodItemEmoji}>{mood.emoji}</Text>
                      <Text style={[styles.moodItemLabel, { color: theme.colors.text }]}>{mood.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionsContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.actionsTitle, { color: theme.colors.text }]}>Add to your post</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={[styles.actionButton, { borderColor: theme.colors.borderLight }]} 
                onPress={pickImage}
                disabled={selectedImages.length >= 3}
              >
                <Ionicons name="image" size={scaledFontSize(24)} color="#45BD62" />
                <Text style={[styles.actionLabel, { color: theme.colors.text }]}>
                  Photo {selectedImages.length > 0 && `(${selectedImages.length}/3)`}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { borderColor: theme.colors.borderLight }]} 
                onPress={() => setShowMoodPicker(true)}
              >
                <Ionicons name="happy" size={scaledFontSize(24)} color="#F7B928" />
                <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Feeling</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.draftButton,
              { borderColor: theme.colors.border },
              (loading || (!postContent.trim() && !postTitle.trim())) && styles.buttonDisabled
            ]}
            onPress={handleSaveDraft}
            disabled={loading || (!postContent.trim() && !postTitle.trim())}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            ) : (
              <Text style={[styles.draftButtonText, { color: theme.colors.textSecondary }]}>Save Draft</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.publishButton,
              ((!postContent.trim() && !postTitle.trim()) || loading) && styles.publishButtonDisabled
            ]}
            onPress={handlePublish}
            disabled={(!postContent.trim() && !postTitle.trim()) || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        {/* Success Modal */}
        <StatusModal
          visible={showSuccessModal}
          type="success"
          title="Success!"
          message={successMessage}
          onClose={() => {
            setShowSuccessModal(false);
            if (successCallback) {
              successCallback();
            }
          }}
          buttonText="Done"
        />

        {/* Error Modal */}
        <StatusModal
          visible={showErrorModal}
          type="error"
          title={errorTitle}
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
          buttonText="OK"
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Dynamic styles with text size scaling
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  nextButton: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: "#7CB9A9",
    paddingHorizontal: 16,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  
  // Author Header - Transparent
  authorHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    backgroundColor: "transparent",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 50,
    height: 50,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(18),
    fontWeight: "bold",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    marginBottom: 4,
  },
  privacyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    alignSelf: "flex-start",
  },
  privacyText: {
    fontSize: scaledFontSize(13),
    fontWeight: "500",
  },
  
  // Category
  categoryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 185, 169, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
  },
  
  // Content Card
  contentCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  titleInput: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    paddingVertical: 8,
    marginBottom: 8,
  },
  contentInput: {
    fontSize: scaledFontSize(16),
    lineHeight: 24,
    minHeight: 120,
    paddingVertical: 8,
  },
  
  // Selected Mood
  selectedMoodContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(124, 185, 169, 0.05)",
  },
  selectedMood: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodEmoji: {
    fontSize: scaledFontSize(24),
  },
  moodText: {
    fontSize: scaledFontSize(15),
    fontWeight: "500",
  },
  
  // Images Grid
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  singleImage: {
    width: "100%",
    height: 250,
  },
  doubleImage: {
    width: "48.5%",
    height: 180,
  },
  tripleImage: {
    width: "31.5%",
    height: 120,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
  },
  
  // Mood Picker
  moodPickerContainer: {
    marginTop: 12,
    borderRadius: 12,
    maxHeight: 300,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  moodPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  moodPickerTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
  },
  moodList: {
    maxHeight: 250,
  },
  moodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  moodItemEmoji: {
    fontSize: scaledFontSize(28),
  },
  moodItemLabel: {
    fontSize: scaledFontSize(16),
    fontWeight: "500",
  },
  
  // Actions
  actionsContainer: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  actionsTitle: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: scaledFontSize(14),
    fontWeight: "500",
  },
  
  // Footer
  footer: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  draftButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  draftButtonText: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
  },
  publishButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#7CB9A9",
    alignItems: "center",
    justifyContent: "center",
  },
  publishButtonDisabled: {
    backgroundColor: "#B6D5CF",
  },
  publishButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  bottomSpacing: {
    height: 20,
  },
});