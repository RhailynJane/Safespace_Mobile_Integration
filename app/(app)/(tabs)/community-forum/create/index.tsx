/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useMemo, useEffect } from "react";
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
import StatusModal from "../../../../../components/StatusModal";
import { useAuth } from "@clerk/clerk-expo";
// Removed local Convex client; use shared provider elsewhere when needed

const CATEGORIES = [
  "Self-Care",
  "Mindfulness",
  "Stories",
  "Support",
  "Creative",
  "Therapy",
  "Stress",
  "Affirmation",
  "Awareness",
];

// Image sources mapped to categories
const CATEGORY_IMAGES: Record<string, any> = {
  "Self-Care": require('../../../../../assets/images/self-care.png'),
  "Mindfulness": require('../../../../../assets/images/mindfulness.png'),
  "Stories": require('../../../../../assets/images/stories.png'),
  "Support": require('../../../../../assets/images/support.png'),
  "Creative": require('../../../../../assets/images/creative.png'),
  "Therapy": require('../../../../../assets/images/therapy.png'),
  "Stress": require('../../../../../assets/images/stressed.png'),
  "Affirmation": require('../../../../../assets/images/affirmation.png'),
  "Awareness": require('../../../../../assets/images/awareness.png'),
};

const getCategoryIcon = (category: string) => {
  return CATEGORY_IMAGES[category] || null;
};

export default function SelectCategoryScreen() {
  const { theme, scaledFontSize, isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("community-forum");
  const { getToken, isSignedIn } = useAuth();
  
  // Modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("");

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // No local Convex client needed on this selection screen

  const handleContinue = () => {
    if (selectedCategory) {
      router.push({
        pathname: "/(app)/(tabs)/community-forum/create/content",
        params: { category: selectedCategory },
      });
    } else {
      showError("Selection Required", "Please select a category to continue");
    }
  };

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
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
            <View style={styles.titleContainer}>
              <Text style={[styles.mainTitle, { color: theme.colors.text }]}>Add New Post</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Select a category to get started</Text>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryCard,
                  selectedCategory === category 
                    ? {
                        backgroundColor: isDarkMode ? "#2A4A42" : "#E8F5F1",
                        shadowColor: "#7CB9A9",
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 6,
                      }
                    : { backgroundColor: theme.colors.surface },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Image
                  source={getCategoryIcon(category)}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
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
          {selectedCategory && (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-forward" size={24} color="white" />
                <Text style={styles.floatingButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        {/* Error Modal */}
        <StatusModal
          visible={showErrorModal}
          type="error"
          title={errorTitle}
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
          buttonText="OK"
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Dynamic styles with text size scaling
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
    fontSize: scaledFontSize(11),
    fontWeight: "600",
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center"
  },
  titleContainer: {
    alignItems: "center",
    gap: 8,
  },
  mainTitle: {
    fontSize: scaledFontSize(28),
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
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
    fontSize: scaledFontSize(20),
    fontWeight: "500",
    color: "#000",
  },
  content: {
    flexGrow: 1,
    backgroundColor: "#F2F2F7",
    padding: 10,
  },
  subtitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "400",
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 22,
  },
  title: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: "#212121",
    marginBottom: 24,
    textAlign: "center",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 100,
    maxWidth: 390,
    alignSelf: "center",
  },
  iconImage: {
    width: 87,
    height: 87,
    marginBottom: 8,
  },
  categoryCard: {
    width: "30%",
    height: 150,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginHorizontal: "1.66%",
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: scaledFontSize(12),
    textAlign: "center",
    fontWeight: "500",
    marginTop: 4,
    width: "100%",
  },
  categoryTextActive: {
    color: "#7CB9A9",
    fontWeight: "600",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  floatingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    gap: 8,
  },
  floatingButtonText: {
    color: "white",
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});