import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";

const CATEGORIES = [
  "Self Care",
  "Mindfulness",
  "Stories",
  "Support",
  "Creative",
  "Therapy",
  "Stress",
  "Affirmation",
  "Awareness",
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Self Care":
      return "heart-outline";
    case "Mindfulness":
      return "leaf-outline";
    case "Stories":
      return "book-outline";
    case "Support":
      return "people-outline";
    case "Creative":
      return "color-palette-outline";
    case "Therapy":
      return "medical-outline";
    case "Stress":
      return "flash-outline";
    case "Affirmation":
      return "chatbubble-ellipses-outline";
    case "Awareness":
      return "eye-outline";
    default:
      return "help-outline";
  }
};

export default function SelectCategoryScreen() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("community-forum");

  const handleContinue = () => {
    if (selectedCategory) {
      router.push({
        pathname: "/community-forum/create/content",
        params: { category: selectedCategory },
      });
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
  
});
