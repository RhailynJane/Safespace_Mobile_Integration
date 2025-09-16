import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";

/**
 * PostSuccessScreen Component
 *
 * Success confirmation screen shown after a user successfully creates a post.
 * Features a success message, image, and navigation options to view the post
 * or continue browsing. Includes an elegant curved background.
 */
export default function PostSuccessScreen() {
  const [activeTab, setActiveTab] = useState("community-forum");

  /**
   * Handles navigation to view the newly created post
   */
  const handleViewPost = () => {
    router.replace("/(app)/(tabs)/community-forum/main");
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

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Community Forum" showBack={true} />

        <View style={styles.content}>
          {/* Success Card */}
          <View style={styles.successCard}>
            <View>
              <Image
                source={require("../../../../../assets/images/successnew.png")}
              />
            </View>

            <Text style={styles.title}>Post Successful!</Text>

            <Text style={styles.message}>
              You have successfully posted a post.
              {"\n"}Let's see it now!
            </Text>

            <TouchableOpacity
              style={styles.cardButton}
              onPress={handleViewPost}
            >
              <Text style={styles.cardButtonText}>See my post</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  headerContainer: {
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  communityPostButton: {
    backgroundColor: "transparent",
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
  content: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    marginTop: 30,
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderRadius: 20,
    height: 418,
    padding: 30,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#212121",
    marginBottom: 16,
    marginTop: 20,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 12,
    marginBottom: 10,
    marginTop: -5,
  },
  cardButton: {
    backgroundColor: "#7CB9A9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
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
  cardButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
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
  secondaryButton: {
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
  secondaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});
