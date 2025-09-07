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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams  } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import { useAuth } from "../../../../../context/AuthContext";



export default function SelectCategoryScreen() {
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
      isDraft
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
              {/* User Profile Summary */}
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
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 24,
    textAlign: "center",
  },
  profileSection: {
    padding: 20,
    backgroundColor: "#d9ead3",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileTextContainer: {
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
});

