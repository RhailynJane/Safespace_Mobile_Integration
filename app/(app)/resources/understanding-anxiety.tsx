import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";

const { width } = Dimensions.get("window");

export default function UnderstandingAnxietyScreen() {
  // State to track the currently active tab in the bottom navigation
  const [activeTab, setActiveTab] = useState("resources");

  // Configuration for bottom navigation tabs
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Handler for tab press in bottom navigation
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Handler for when user completes reading the article
  const handleComplete = () => {
    console.log("Article completed");
    router.back();
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Resources" showBack={true} />

        {/* Main scrollable content area */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title section with background color */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Understanding Anxiety</Text>
          </View>

          {/* Content section with article text and illustrations */}
          <View style={styles.contentSection}>
            {/* Illustration container with emoji graphics */}
            <View style={styles.illustrationContainer}>
              <Text style={styles.illustration}>🧠💭</Text>
            </View>

            {/* Main explanatory text about anxiety */}
            <Text style={styles.mainText}>
              Anxiety is a natural human response to stress or perceived danger.
              It's your body's way of staying alert and protecting you from
              potential harm. However, when anxiety becomes overwhelming or
              persistent, it can interfere with daily life—and that's when it's
              important to understand it better and seek support.
            </Text>

            {/* Section title for symptoms */}
            <Text style={styles.sectionTitle}>
              What Does Anxiety Feel Like?
            </Text>

            {/* Introductory text for symptoms section */}
            <Text style={styles.sectionIntro}>
              Anxiety can look and feel different for everyone, but common
              symptoms include:
            </Text>

            {/* List of anxiety symptoms with numbered items */}
            <View style={styles.symptomsList}>
              <View style={styles.symptomItem}>
                <Text style={styles.symptomNumber}>1.</Text>
                <Text style={styles.symptomText}>
                  Racing thoughts or constant worrying
                </Text>
              </View>
              <View style={styles.symptomItem}>
                <Text style={styles.symptomNumber}>2.</Text>
                <Text style={styles.symptomText}>
                  A fast heartbeat or tight chest
                </Text>
              </View>
              <View style={styles.symptomItem}>
                <Text style={styles.symptomNumber}>3.</Text>
                <Text style={styles.symptomText}>
                  Restlessness or feeling "on edge"
                </Text>
              </View>
              <View style={styles.symptomItem}>
                <Text style={styles.symptomNumber}>4.</Text>
                <Text style={styles.symptomText}>Difficulty concentrating</Text>
              </View>
              <View style={styles.symptomItem}>
                <Text style={styles.symptomNumber}>5.</Text>
                <Text style={styles.symptomText}>
                  Trouble sleeping or changes in appetite
                </Text>
              </View>
            </View>

            {/* Encouraging reminder section */}
            <Text style={styles.rememberTitle}>Remember:</Text>

            <Text style={styles.rememberText}>
              Anxiety is common, and you're not alone. There is no shame in
              seeking support. Whether you're exploring what anxiety means or
              already on your healing journey, taking that first step is a sign
              of strength.
            </Text>

            {/* Completion button to mark article as read */}
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Completed</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom navigation component */}
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#F8F9FA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  notificationButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5722",
  },
  content: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: "#B8E6D3",
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  contentSection: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 120,
  },
  illustrationContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  illustration: {
    fontSize: 60,
    opacity: 0.8,
  },
  mainText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  sectionIntro: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 15,
  },
  symptomsList: {
    marginBottom: 25,
  },
  symptomItem: {
    flexDirection: "row",
    marginBottom: 12,
    paddingLeft: 10,
  },
  symptomNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    width: 25,
  },
  symptomText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    flex: 1,
  },
  rememberTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  rememberText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 30,
  },
  completeButton: {
    backgroundColor: "#81C784",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
