import type React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Define the available navigation tabs
type NavItem = "home" | "appointments" | "messages" | "profile";

// Props interface for the BottomNavigation component
interface BottomNavigationProps {
  activeTab?: NavItem; // Optional prop to indicate which tab is currently active
}

/**
 * BottomNavigation - Main navigation component for the app
 * Provides tab-based navigation with visual feedback for active state
 * Uses Expo Router for navigation between different app sections
 */
const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = "home", // Default to home tab if not specified
}) => {
  /**
   * Handles navigation when a tab is pressed
   * Routes to different screens based on the selected tab
   * @param tab - The navigation item that was pressed
   */
  const handleNavPress = (tab: NavItem) => {
    switch (tab) {
      case "home":
        router.push("/(app)"); // Navigate to main app screen
        break;
      case "appointments":
        console.log("Appointments pressed"); // Placeholder - implement navigation
        break;
      case "messages":
        console.log("Messages pressed"); // Placeholder - implement navigation
        break;
      case "profile":
        console.log("Profile pressed"); // Placeholder - implement navigation
        break;
    }
  };

  /**
   * Renders a single navigation item with icon and label
   * Applies active styling based on current tab state
   * @param tab - The navigation item identifier
   * @param iconName - Ionicons icon name to display
   * @param label - Text label to display under the icon
   * @returns JSX element for the navigation item
   */
  const renderNavItem = (tab: NavItem, iconName: string, label: string) => {
    const isActive = activeTab === tab; // Check if this tab is currently active

    return (
      <TouchableOpacity
        key={tab}
        style={styles.navItem}
        onPress={() => handleNavPress(tab)}
      >
        {/* Icon container with conditional active styling */}
        <View
          style={[styles.iconContainer, isActive && styles.activeIconContainer]}
        >
          <Ionicons
            name={iconName as any} // Type assertion for Ionicons name
            size={24}
            color={isActive ? "#7FDBDA" : "#666"} // Teal for active, gray for inactive
          />
        </View>
        {/* Label with conditional active styling */}
        <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {/* Render all navigation items */}
        {renderNavItem("home", "home", "Home")}
        {renderNavItem("appointments", "calendar", "Book Appointments")}
        {renderNavItem("messages", "chatbubble", "Messages")}
        {renderNavItem("profile", "person", "Profile")}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container with top border to separate from content
  container: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0", // Light gray border
  },

  // Navigation bar container with padding and layout
  navBar: {
    flexDirection: "row", // Horizontal layout for nav items
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 20, // Extra bottom padding for safe area
  },

  // Individual navigation item styling
  navItem: {
    flex: 1, // Equal width distribution across all items
    alignItems: "center",
    justifyContent: "center",
  },

  // Container for the icon with spacing
  iconContainer: {
    marginBottom: 4, // Space between icon and label
  },

  // Active icon container (placeholder for future enhancements)
  activeIconContainer: {
    // Could add background circle or other active styling here
  },

  // Navigation label text styling
  navLabel: {
    fontSize: 11, // Small font size for tab labels
    color: "#666", // Default gray color
    textAlign: "center",
  },

  // Active navigation label styling
  activeNavLabel: {
    color: "#7FDBDA", // Teal brand color for active state
    fontWeight: "600", // Semi-bold for emphasis
  },
});

export default BottomNavigation;
