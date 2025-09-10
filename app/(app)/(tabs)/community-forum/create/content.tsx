import { useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import { useAuth } from "../../../../../context/AuthContext";

export default function CreatePostScreen() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("community-forum");
  const [postContent, setPostContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const { user, profile, logout } = useAuth();

  const handleSaveDraft = () => {
    setIsDraft(true);
    Alert.alert("Draft Saved", "Your post has been saved as a draft.");
  };

  const handlePublish = () => {
    console.log("Publishing post:", {
      category: selectedCategory,
      content: postContent,
      isPrivate,
      isDraft,
    });

    router.push("/community-forum/create/success");
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

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Profile Summary with Post Card Inside */}
        <View style={styles.profileCard}>
          <View style={styles.profileSection}>
            <View style={styles.profileContainer}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{
                    uri: "https://randomuser.me/api/portraits/women/17.jpg",
                  }}
                  style={styles.profileImage}
                />
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
            />

            <Text style={styles.charCount}>{postContent.length}/300</Text>
          </View>
        </View>

        <View style={styles.divider} />

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
      </ScrollView>

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
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: "#d7e0e9",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  divider: {
    height: 1,
    backgroundColor: "#F8F8F8",
    marginVertical: 16,
  },
  privacyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  privacyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 16,
    color: "#212121",
  },
  privacyNote: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF",
    gap: 12,
  },
  draftButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  draftButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  publishButton: {
    flex: 2,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  publishButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
