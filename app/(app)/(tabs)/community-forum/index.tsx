/**
 * LLM Prompt: Add concise comments to this React Native component.
 * Reference: chat.deepseek.com
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import BottomNavigation from "../../../../components/BottomNavigation";
import { AppHeader } from "../../../../components/AppHeader";

const { width } = Dimensions.get("window");

/**
 * CommunityScreen Component
 *
 * Main community forum entry screen that provides an introduction to the community features.
 * Features a welcoming interface with a curved background and navigation options.
 * This is a standalone UI component with no backend dependencies.
 */
export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState("community");

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Handles tab navigation
   * @param tabId - The ID of the tab to navigate to
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
   * Navigates to the main community forum
   */
  const handleStartPress = () => {
    router.push("../community-forum/main");
  };

  return (
    <CurvedBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* AppHeader component with menu and notifications */}
        <AppHeader 
          showBack={false}
          showMenu={true}
          showNotifications={true}
        />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Community illustration */}
          {/* Image Reference: https://share.google/images/81eVPYnbEonHp6pR8 */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../../../assets/images/community-forum.png")}
              style={styles.appointmentImage}
              resizeMode="contain"
            />
          </View>

          {/* Main content with welcome message */}
          <View style={styles.content}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome to Our</Text>
              <Text style={styles.welcomeTitle}>Community!</Text>

              <Text style={styles.welcomeSubtitle}>
                Our community is a place of warmth and acceptance, where
                everyone&apos;s voice is valued and respected.
              </Text>

              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartPress}
              >
                <Text style={styles.startButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom navigation bar */}
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
  },
  safeArea: {
    flex: 1,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    height: 200,
  },
  appointmentImage: {
    width: width * 0.9,
    height: 350,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    alignItems: "center",
    padding: 20,
    marginTop: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#462401ff",
    textAlign: "center",
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 25,
  },
  startButton: {
    backgroundColor: "#7CB9A9",
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
    borderColor: "#FFF",
    borderWidth: 3,
    marginTop: 70,
    marginBottom: 10,
    paddingBottom: 15,
  },
  startButtonText: {
    color: "#412100ff",
    fontSize: 18,
    fontWeight: "700",
  },
});