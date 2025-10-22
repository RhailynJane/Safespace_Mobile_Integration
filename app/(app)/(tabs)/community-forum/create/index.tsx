/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import { AppHeader } from "../../../../../components/AppHeader";
import Svg, { Path } from 'react-native-svg';
import CurvedBackground from "../../../../../components/CurvedBackground";
import { useTheme } from "../../../../../contexts/ThemeContext";

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
      return require('../../../../../assets/images/self-care.png');
    case "Mindfulness":
      return require('../../../../../assets/images/mindfulness.png');
    case "Stories":
      return require('../../../../../assets/images/stories.png');
    case "Support":
      return require('../../../../../assets/images/support.png');
    case "Creative":
      return require('../../../../../assets/images/creative.png');
    case "Therapy":
      return require('../../../../../assets/images/therapy.png');
    case "Stress":
      return require('../../../../../assets/images/stressed.png');
    case "Affirmation":
      return require('../../../../../assets/images/affirmation.png');
    case "Awareness":
      return require('../../../../../assets/images/awareness.png');
    default:
      return "help-outline";
  }
};

export default function SelectCategoryScreen() {
  const { theme } = useTheme();
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
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <AppHeader title="Community Forum" showBack={true} />   
          
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.mainTitle, { color: theme.colors.text }]}>Add New Post</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>Select post category</Text>

          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryCard,
                  { backgroundColor: theme.colors.surface },
                  selectedCategory === category && styles.categoryCardActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <View style={styles.categoryIcon}>
                  <Image
                    source={getCategoryIcon(category)}
                    style={styles.iconImage}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.categoryText,
                    { color: theme.colors.textSecondary },
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
    </CurvedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
  titleSection: {
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center"
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    // color moved to theme.colors.text via inline override
    justifyContent: "center",
    alignItems: "center"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000",
  },
  content: {
    flexGrow: 1,
    backgroundColor: "#F2F2F7",
    padding: 10,
  },
  subtitle: {
  fontSize: 16,
  fontWeight: "300",
  // color moved to theme.colors.text via inline override
  marginTop: 10,
  marginBottom: 24,
  textAlign: "center",
  paddingHorizontal: 20,
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
  iconImage: {
  width: 87,
  height: 87,
  marginBottom: 8,
  },
  categoryCard: {
    width: 100,
    height: 150,
    // backgroundColor moved to theme.colors.surface via inline override
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#000",
    shadowColor: "#999",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryCardActive: {
    width: 100,
    height: 150,
    backgroundColor: "#EDE7EC",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 2,
    borderColor: "#D36500",
    shadowColor: "#999",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    // color moved to theme.colors.textSecondary via inline override
    textAlign: "center",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#666",
    fontWeight: "500",
  },
  footer: {
    backgroundColor: "transparent",
    borderTopColor: "#transparent",
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: "#7CB9A9",
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor:"white",
    alignItems: "center",
    marginRight: 30,
    marginLeft: 30,
    marginBottom: 50,
    shadowColor: "#999",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: "#B6D5CF",
  },
  continueButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
});

 