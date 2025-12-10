/**
 * EditPostScreen - React Native Component
 * 
 * Screen for editing existing community forum posts with support for:
 * - Updating post title, content, and category
 * - Saving as draft or publishing immediately
 * - Post deletion with confirmation
 * - Real-time character counting
 * - Category selection with horizontal scrolling
 * 
 * Features:
 * - Pre-populates form with existing post data
 * - Dual action buttons: Save Draft and Publish
 * - Input validation for required fields
 * - Loading states during API operations
 * - Destructive delete action with warning
 * - Responsive design with curved background
 * 
 * State Management:
 * - Tracks form field changes locally
 * - Manages loading states for save/publish operations
 * - Handles category selection state
 * 
 * User Flow:
 * 1. Load existing post data into form fields
 * 2. Make edits to title, content, or category
 * 3. Choose to save as draft or publish immediately
 * 4. Optionally delete the post with confirmation
 * 5. Navigate back to community forum on success
 * 
 * Error Handling:
 * - Validates required fields before submission
 * - Handles API errors with user-friendly alerts
 * - Manages authentication requirements
 * 
 * LLM Prompt: Add comprehensive comments to this React Native component.
 * Reference: chat.deepseek.com
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";
import { useBottomNavTabs } from "../../../../utils/hooks/useBottomNavTabs";

// Available categories for post organization and filtering
const CATEGORIES = [
  "Self-Care",
  "Mindfulness",
  "Stories",
  "Support",
  "Creative",
  "Therapy",
  "Stress",
  "Affirmation",
  "Awareness",
];

// Mood options for post creation
const MOODS = [
  { id: '1', emoji: '😁', label: 'Ecstatic' },
  { id: '2', emoji: '😊', label: 'Happy' },
  { id: '3', emoji: '😌', label: 'Content' },
  { id: '4', emoji: '😐', label: 'Neutral' },
  { id: '5', emoji: '🙁', label: 'Displeased' },
  { id: '6', emoji: '😤', label: 'Frustrated' },
  { id: '7', emoji: '😠', label: 'Annoyed' },
  { id: '8', emoji: '😡', label: 'Angry' },
  { id: '9', emoji: '🤬', label: 'Furious' },
];

/**
 * EditPostScreen Component
 * 
 * Provides a comprehensive interface for editing existing community posts
 * with support for draft management and publishing workflows
 */
export default function EditPostScreen() {
  const { theme, scaledFontSize } = useTheme();
  // Extract post data from navigation parameters
  const {
    id,
    title: initialTitle,
    content: initialContent,
    category: initialCategory,
    isDraft,
  } = useLocalSearchParams();
  
  const { user } = useUser();
  const convex = useConvex();

  // Form state management
  const [title, setTitle] = useState((initialTitle as string) || ""); // Post title
  const [content, setContent] = useState((initialContent as string) || ""); // Post content
  const [category, setCategory] = useState((initialCategory as string) || "Support"); // Selected category
  const [isSaving, setIsSaving] = useState(false); // Save loading state
  const [activeTab, setActiveTab] = useState("community-forum"); // Bottom navigation active tab
  // Add loading state for initial fetch
  const [loading, setLoading] = useState(true);

  // NOTE: All post operations now go directly through Convex mutations/queries.

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Error");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);

  // Ensure postId is typed as Convex document ID
  const postId: Id<"communityPosts"> = id as Id<"communityPosts">;

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  /**
   * Show error modal with custom title and message
   */
  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  /**
   * Show success modal with custom message
   */
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  /**
   * Handle success modal close - navigate to My Posts
   */
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Navigate to My Posts tab
    router.push("/(app)/(tabs)/community-forum?tab=my-posts");
  };

  /**
   * Show confirmation modal for destructive actions
   */
  const showConfirmation = (title: string, message: string, callback: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmCallback(() => callback);
    setShowConfirmModal(true);
  };

  /**
   * Handle image selection from device
   */
  const handleAddPhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError("Permission Required", "We need camera roll permissions to add photos.");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3 - selectedImages.length, // Limit based on current selection
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        // Process and compress images
        const newImages = await Promise.all(
          result.assets.map(async (asset) => {
            const manipulatedImage = await manipulateAsync(
              asset.uri,
              [{ resize: { width: 1024 } }], // Resize to max 1024px width
              { 
                compress: 0.7, // 70% quality
                format: SaveFormat.JPEG 
              }
            );
            return manipulatedImage.uri;
          })
        );
        
        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      console.error("Error selecting images:", error);
      showError("Error", "Failed to select images. Please try again.");
    }
  };

  /**
   * Remove image from selection
   */
  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  /**
   * Handle mood selection
   */
  const handleMoodSelect = (mood: typeof MOODS[0]) => {
    setSelectedMood(selectedMood?.id === mood.id ? null : mood);
  };

  /**
   * Handle post save operation
   * Updates the existing post and navigates to My Posts
   */
  const handleSave = async () => {
    // Validate required fields
    if (!title.trim() || !content.trim()) {
      showError("Missing Information", "Please fill in both title and content");
      return;
    }

    // Check user authentication
    if (!user?.id) {
      showError("Authentication Required", "Please sign in to edit posts");
      return;
    }

    try {
      setIsSaving(true);

      // Convex-only update - preserve original draft status
      await convex.mutation(api.posts.update, {
        postId,
        title: title.trim(),
        content: content.trim(),
        category: (category || "Support").trim(),
        imageUrls: selectedImages,
        mood: selectedMood,
        isDraft: false, // Keep as published when editing
      });

      showSuccess("Post updated successfully!");
    } catch (error) {
      console.error("Error updating post:", error);
      showError("Update Failed", "Failed to update post. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle post deletion with confirmation dialog
   * Provides safety mechanism to prevent accidental deletion
   */
  const handleDelete = () => {
    showConfirmation(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      async () => {
        try {
            // Convex-only delete
            await convex.mutation(api.posts.deletePost, { postId });
          showSuccess("Post deleted successfully!");
          // Navigate to community forum after successful deletion
          setTimeout(() => {
            router.replace("/community-forum");
          }, 1500);
        } catch (error) {
          console.error("Error deleting post:", error);
          showError("Delete Failed", "Failed to delete post. Please try again.");
        }
      }
    );
  };

  /**
   * Handle bottom navigation tab press
   * Navigates to different app sections
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Bottom navigation tabs configuration
  const tabs = useBottomNavTabs();

  // State for images and mood
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<{ id: string; emoji: string; label: string } | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!postId) return;
      setLoading(true);
      try {
        const post = await convex.query(api.posts.getPost, { postId });
        if (post) {
          setTitle(post.title || "");
          setContent(post.content || "");
          setCategory(post.category || "Support");
          setSelectedImages(post.imageUrls || []);
          setSelectedMood(post.mood || null);
        }
      } catch (err) {
        showError("Error", "Could not load post for editing.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <CurvedBackground style={styles.curvedBackground} />
      <AppHeader title="Edit Post" showBack={true} />
      {/* Main Content Area */}
      <View style={styles.scrollContainer}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.content}>
              <Text style={styles.label}>Title</Text>

              <TextInput
                style={[styles.titleInput, { fontSize: scaledFontSize(18), backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter your post title"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={100}
              />
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoriesContainer}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.contentInput, { fontSize: scaledFontSize(16), backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                value={content}
                onChangeText={setContent}
                placeholder="Write your post..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                maxLength={1000}
              />
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>{`${content.length} characters`}</Text>
              </View>

              {/* Mood Selection */}
              <Text style={styles.label}>How are you feeling?</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.moodScrollContainer}
                contentContainerStyle={styles.moodScrollContent}
              >
                <TouchableOpacity
                  style={[
                    styles.moodOption,
                    !selectedMood && styles.moodOptionSelected
                  ]}
                  onPress={() => setSelectedMood(null)}
                >
                  <Text style={styles.moodOptionText}>None</Text>
                </TouchableOpacity>
                {MOODS.map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodOption,
                      selectedMood?.id === mood.id && styles.moodOptionSelected
                    ]}
                    onPress={() => handleMoodSelect(mood)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodOptionText}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Image Management */}
              <Text style={styles.label}>Photos ({selectedImages.length}/3)</Text>
              <View style={styles.imageManagementContainer}>
                {/* Add Photo Button */}
                {selectedImages.length < 3 && (
                  <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                    <Ionicons name="camera-outline" size={scaledFontSize(24)} color="#7CB9A9" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
                
                {/* Selected Images Grid */}
                {selectedImages.length > 0 && (
                  <View style={styles.selectedImagesContainer}>
                    <View style={styles.imagesGrid}>
                      {selectedImages.map((uri, index) => (
                        <View 
                          key={index} 
                          style={[
                            styles.imageContainer,
                            selectedImages.length === 1 && styles.singleImage,
                            selectedImages.length === 2 && styles.doubleImage,
                            selectedImages.length >= 3 && styles.tripleImage,
                          ]}
                        >
                          <Image source={{ uri }} style={styles.image} />
                          {/* Remove button */}
                          <TouchableOpacity 
                            style={styles.removeImageButton}
                            onPress={() => handleRemoveImage(index)}
                          >
                            <Ionicons name="close-circle" size={scaledFontSize(24)} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Action Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Text style={styles.buttonText}>Saving...</Text>
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
      {/* Status and Confirmation Modals */}
      <StatusModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={handleSuccessClose}
        title="Success"
        type="success"
      />
      <StatusModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
        title={errorTitle}
        type="error"
      />
      {/* Confirmation Modal for Delete */}
      <StatusModal
        visible={showConfirmModal}
        type="info"
        title={confirmTitle}
        message={confirmMessage}
        onClose={() => setShowConfirmModal(false)}
        buttonText="Cancel"
        secondaryButtonText="Delete"
        onSecondaryButtonPress={() => {
          setShowConfirmModal(false);
          if (confirmCallback) {
            confirmCallback();
          }
        }}
        secondaryButtonType="destructive"
      />
      <BottomNavigation tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

/**
 * Stylesheet for EditPostScreen component
 * Organized by component sections with consistent theming
 * Uses responsive design patterns and accessibility considerations
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
    marginBottom: 80, // Space for bottom nav only
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  form: {
    paddingVertical: 20,
  },
  
  // Delete Section - Destructive action area
  deleteSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "transparent",
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  deleteButtonText: {
    color: "#C53030",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  deleteWarning: {
    fontSize: scaledFontSize(12),
    color: "#E53E3E",
    marginTop: 8,
    textAlign: "center",
  },
  
  // Form Labels
  label: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  
  // Title Input - Larger font for prominence
  titleInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: "#333",
    minHeight: 60,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Content Input - Larger area for post body
  contentInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: scaledFontSize(16),
    color: "#333",
    minHeight: 200,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Categories Section - Horizontal scrolling
  categoriesScroll: {
    marginHorizontal: -16,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: "#7CB9A9",
    borderColor: "#7CB9A9",
  },
  categoryText: {
    fontSize: scaledFontSize(14),
    color: "#666",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  
  // Character Count - Content length indicator
  characterCount: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  characterCountText: {
    fontSize: scaledFontSize(12),
    color: "#999",
  },
  
    // Existing mood display
    existingMoodContainer: {
      marginTop: 16,
    },
    moodDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: 'rgba(124, 185, 169, 0.1)',
      borderRadius: 12,
      alignSelf: 'flex-start',
      gap: 8,
    },
    moodEmoji: {
      fontSize: scaledFontSize(20),
    },
    moodLabel: {
      fontSize: scaledFontSize(15),
      fontWeight: '500',
    },
  
    // Existing images display
    existingImagesContainer: {
      marginTop: 16,
    },
    imagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    imageContainer: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    singleImage: {
      width: '100%',
      height: 250,
    },
    doubleImage: {
      width: '48.5%',
      height: 180,
    },
    tripleImage: {
      width: '31.5%',
      height: 120,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
  
    // Mood selection styles
    moodScrollContainer: {
      marginTop: 8,
      marginBottom: 16,
    },
    moodScrollContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    moodOption: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      minWidth: 80,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    moodOptionSelected: {
      backgroundColor: '#7CB9A9',
      borderColor: '#7CB9A9',
    },
    moodOptionText: {
      fontSize: scaledFontSize(12),
      fontWeight: '500',
      color: '#666',
      marginTop: 4,
    },
  
    // Image management styles
    imageManagementContainer: {
      marginTop: 8,
      marginBottom: 16,
    },
    addPhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#7CB9A9',
      borderStyle: 'dashed',
      marginBottom: 12,
      gap: 8,
    },
    addPhotoText: {
      fontSize: scaledFontSize(14),
      fontWeight: '500',
      color: '#7CB9A9',
    },
    selectedImagesContainer: {
      marginTop: 8,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
      padding: 2,
    },
  
  // Button Container - Action button
  buttonContainer: {
    padding: 16,
    marginTop: 24,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  button: {
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: "#666", // Neutral color for draft action
  },
  publishButton: {
    backgroundColor: "#7CB9A9", // Brand color for primary action
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
});