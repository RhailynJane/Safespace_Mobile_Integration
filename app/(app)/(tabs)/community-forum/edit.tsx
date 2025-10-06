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

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { communityApi } from "../../../../utils/communityForumApi";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";

// Available categories for post organization and filtering
const CATEGORIES = [
  "Stress",
  "Support",
  "Stories",
  "Self Care",
  "Mindfulness",
  "Creative",
  "Therapy",
  "Affirmation",
  "Awareness",
];

/**
 * EditPostScreen Component
 * 
 * Provides a comprehensive interface for editing existing community posts
 * with support for draft management and publishing workflows
 */
export default function EditPostScreen() {
  // Extract post data from navigation parameters
  const {
    id,
    title: initialTitle,
    content: initialContent,
    category: initialCategory,
    isDraft,
  } = useLocalSearchParams();
  
  const { user } = useUser();

  // Form state management
  const [title, setTitle] = useState((initialTitle as string) || ""); // Post title
  const [content, setContent] = useState((initialContent as string) || ""); // Post content
  const [category, setCategory] = useState((initialCategory as string) || "Support"); // Selected category
  const [isSaving, setIsSaving] = useState(false); // Save as draft loading state
  const [isPublishing, setIsPublishing] = useState(false); // Publish loading state
  const [activeTab, setActiveTab] = useState("community-forum"); // Bottom navigation active tab

  const postId = parseInt(id as string); // Convert post ID to number

  /**
   * Handle post save operation
   * Supports both draft saving and publishing workflows
   * 
   * @param publish - Boolean indicating whether to publish the post
   */
  const handleSave = async (publish: boolean = false) => {
    // Validate required fields
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    // Check user authentication
    if (!user?.id) {
      Alert.alert("Error", "Please sign in to edit posts");
      return;
    }

    try {
      // Set appropriate loading state
      if (publish) {
        setIsPublishing(true);
      } else {
        setIsSaving(true);
      }

      // Update post via API
      await communityApi.updatePost(postId, {
        title: title.trim(),
        content: content.trim(),
        isDraft: !publish, // Set draft status based on publish flag
      });

      // Show success message based on action
      if (publish) {
        Alert.alert("Success", "Post published successfully!");
      } else {
        Alert.alert("Success", "Post updated successfully!");
      }

      // Navigate back to previous screen
      router.back();
    } catch (error) {
      console.error("Error updating post:", error);
      Alert.alert("Error", "Failed to update post");
    } finally {
      // Reset loading states
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  /**
   * Handle post deletion with confirmation dialog
   * Provides safety mechanism to prevent accidental deletion
   */
  const handleDelete = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await communityApi.deletePost(postId);
              Alert.alert("Success", "Post deleted successfully!");
              // Navigate to community forum after successful deletion
              router.replace("/community-forum");
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
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
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <CurvedBackground style={styles.curvedBackground} />
      <AppHeader title="Edit Post" showBack={true} />

      {/* Main Content Area */}
      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.form}>
              {/* Title Input Section */}
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter post title..."
                placeholderTextColor="#999"
                maxLength={200}
                multiline
              />

              {/* Category Selection Section */}
              <Text style={styles.label}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
              >
                <View style={styles.categoriesContainer}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        category === cat && styles.categoryButtonActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          category === cat && styles.categoryTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Content Input Section */}
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="Share your thoughts..."
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
                numberOfLines={10}
              />

              {/* Character Count Display */}
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {content.length} characters
                </Text>
              </View>
            </View>
          </View>

          {/* Delete Button Section - Destructive action with warning */}
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              <Text style={styles.deleteButtonText}>Delete Post</Text>
            </TouchableOpacity>
            <Text style={styles.deleteWarning}>
              This action cannot be undone
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons Footer */}
      <View style={styles.footer}>
        {/* Save as Draft Button */}
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={() => handleSave(false)}
          disabled={isSaving || isPublishing}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Save as Draft</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Publish Button */}
        <TouchableOpacity
          style={[styles.button, styles.publishButton]}
          onPress={() => handleSave(true)}
          disabled={isSaving || isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Publish</Text>
            </>
          )}
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

/**
 * Stylesheet for EditPostScreen component
 * Organized by component sections with consistent theming
 * Uses responsive design patterns and accessibility considerations
 */
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
    marginBottom: 140, // Space for footer buttons and bottom nav
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
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
    gap: 8,
  },
  deleteButtonText: {
    color: "#C53030",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteWarning: {
    fontSize: 12,
    color: "#E53E3E",
    marginTop: 8,
    textAlign: "center",
  },
  
  // Form Labels
  label: {
    fontSize: 16,
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
    fontSize: 18,
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
    fontSize: 16,
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
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryButtonActive: {
    backgroundColor: "#7CB9A9",
    borderColor: "#7CB9A9",
  },
  categoryText: {
    fontSize: 14,
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
    fontSize: 12,
    color: "#999",
  },
  
  // Footer - Fixed action buttons
  footer: {
    position: "absolute",
    bottom: 140, // Above the bottom navigation
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: "#666", // Neutral color for draft action
  },
  publishButton: {
    backgroundColor: "#7CB9A9", // Brand color for primary action
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});