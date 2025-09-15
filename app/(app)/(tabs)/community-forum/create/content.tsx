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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";

/**
 * CreatePostScreen Component
 * 
 * Screen for creating new community posts with options for privacy settings,
 * draft saving, and content creation. Features a curved background and
 * intuitive post creation interface.
 */
export default function CreatePostScreen() {
  // State management
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("community-forum");
  const [postContent, setPostContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Mock user data (replaces backend auth context)
  const mockUser = {
    displayName: "John Doe",
    email: "john.doe@example.com",
  };
  
  const mockProfile = {
    firstName: "John",
    lastName: "Doe"
  };

  /**
   * Handles saving post as draft
   * Shows alert confirmation and updates draft state
   */
  const handleSaveDraft = () => {
    setIsDraft(true);
    Alert.alert("Draft Saved", "Your post has been saved as a draft.");
  };

  /**
   * Handles post publishing
   * Logs post data and navigates to success screen
   */
  const handlePublish = () => {
    console.log("Publishing post:", {
      category: selectedCategory,
      content: postContent,
      isPrivate,
      isDraft,
    });

    router.push("/community-forum/create/success");
  };

  // Bottom navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Handles bottom tab navigation
   * @param tabId - ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Gets display name from available user data
   * @returns String with user's display name or fallback
   */
  const getDisplayName = () => {
    if (mockProfile?.firstName) return mockProfile.firstName;
    if (mockUser?.displayName) return mockUser.displayName.split(" ")[0];
    if (mockUser?.email) return mockUser.email.split("@")[0];
    return "User";
  };

  /**
   * Generates user initials from profile data
   * @returns String containing user initials
   */
  const getInitials = () => {
    const firstName = mockProfile?.firstName || "";
    const lastName = mockProfile?.lastName || "";
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    const displayName = getDisplayName() ?? "";
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Curved background component */}
      <CurvedBackground style={styles.curvedBackground} />
      
      <ScrollView style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            
            <View style={styles.communityPostButton}>
              <Text style={styles.communityPostButtonText}>Community Post</Text>
            </View>
            
            <View style={styles.headerRight} />
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Post Content</Text>
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
          
          {/* Post Content Card (inside user card) */}
          <View style={styles.postCard}>
            <TextInput
              style={styles.postInput}
              multiline
              placeholder="Share your thoughts, experiences, or questions..."
              value={postContent}
              onChangeText={setPostContent}
              textAlignVertical="top"
              maxLength={300}
            />

            {/* Icons and Character Count Row */}
            <View style={styles.postActions}>
              <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="mic-outline" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="camera-outline" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="images-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.charCount}>{postContent.length}/300</Text>
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
            <Text style={styles.privacyNote}>This post will be private.</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.draftButton}
            onPress={handleSaveDraft}
          >
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.publishButton,
              !postContent.trim() && styles.publishButtonDisabled
            ]}
            onPress={handlePublish}
            disabled={!postContent.trim()}
          >
            <Text style={styles.publishButtonText}>Continue</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    backgroundColor: "#F8F9FA",
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
    backgroundColor: "#F2F2F7",
    paddingVertical: 16,
  },
  mainTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#000",
    textAlign: "left",
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F2F2F7",
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
    backgroundColor: "#F2F2F7",
    marginVertical: 16,
  },
  privacyContainer: {
    backgroundColor: "#F2F2F7",
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
    backgroundColor: "#F2F2F7",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
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
});