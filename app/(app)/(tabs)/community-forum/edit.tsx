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

export default function EditPostScreen() {
  const { id, title: initialTitle, content: initialContent, category: initialCategory, isDraft } = useLocalSearchParams();
  const { user } = useUser();
  
  const [title, setTitle] = useState(initialTitle as string || "");
  const [content, setContent] = useState(initialContent as string || "");
  const [category, setCategory] = useState(initialCategory as string || "Support");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState("community-forum");

  const postId = parseInt(id as string);

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Please sign in to edit posts");
      return;
    }

    try {
      if (publish) {
        setIsPublishing(true);
      } else {
        setIsSaving(true);
      }

      await communityApi.updatePost(postId, {
        title: title.trim(),
        content: content.trim(),
        isDraft: !publish,
      });

      if (publish) {
        Alert.alert("Success", "Post published successfully!");
      } else {
        Alert.alert("Success", "Post updated successfully!");
      }
      
      router.back();
    } catch (error) {
      console.error("Error updating post:", error);
      Alert.alert("Error", "Failed to update post");
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

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

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

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

      <View style={styles.scrollContainer}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.form}>
              {/* Delete Button Section */}
              <View style={styles.deleteSection}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  <Text style={styles.deleteButtonText}>Delete Post</Text>
                </TouchableOpacity>
                <Text style={styles.deleteWarning}>
                  This action cannot be undone
                </Text>
              </View>

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

              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {content.length} characters
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
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
  // Delete Section
  deleteSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7D7",
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
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
  characterCount: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: "#999",
  },
  footer: {
    position: "absolute",
    bottom: 80, // Above the bottom navigation
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
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
    backgroundColor: "#666",
  },
  publishButton: {
    backgroundColor: "#7CB9A9",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});