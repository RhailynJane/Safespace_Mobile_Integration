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
import { AppHeader } from "../../../../../components/AppHeader";

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
      <AppHeader title="Add New Post" showBack={true} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Select post category</Text>

        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryCard,
                selectedCategory === category && styles.categoryCardActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <View style={styles.categoryIcon}>
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={24}
                  color={selectedCategory === category ? "#FFFFFF" : "#4CAF50"}
                />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedCategory && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedCategory}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
    fontWeight: "800",
    color: "#000",
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
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
    marginTop: 15,
  },
  categoryCard: {
    width: 100,
    height: 150,
    backgroundColor: "#d7e0e9",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF",
  },
  continueButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 30,
    marginLeft: 30,
  },
  continueButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

 