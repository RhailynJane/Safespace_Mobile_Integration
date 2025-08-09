// Enable client-side rendering for Next.js compatibility
"use client";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

/**
 * ProfileScreen Component
 *
 * Displays user profile information and navigation menu.
 * Includes user avatar, name, email, and menu items for
 * profile management, settings, help, and sign out functionality.
 */
export default function ProfileScreen() {
  // Get user data and logout function from authentication context
  const { user, logout } = useAuth();

  /**
   * Handles user logout process
   * Attempts to log out the user and handles any potential errors
   */
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    // SafeAreaView prevents content from overlapping with system UI
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Information Section */}
        <View style={styles.profileSection}>
          {/* User profile image with fallback placeholder */}
          <Image
            source={{ uri: user?.photoURL || "https://via.placeholder.com/80" }}
            style={styles.profileImage}
          />
          {/* Display user's name with fallback */}
          <Text style={styles.name}>{user?.displayName || "User"}</Text>
          {/* Display user's email address */}
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Menu Items Section */}
        <View style={styles.menuSection}>
          {/* Edit Profile Menu Item */}
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Settings Menu Item */}
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Help & Support Menu Item */}
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Sign Out Menu Item - styled differently with red color */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
            <Text style={[styles.menuText, styles.logoutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container - fills screen with light gray background
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  // Content wrapper - adds horizontal padding and top spacing
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Profile card container - white background with shadow and centered content
  profileSection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 30,
    marginBottom: 20,
    // iOS shadow properties
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android shadow property
    elevation: 3,
  },
  // Circular profile image styling
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Makes image circular (half of width/height)
    marginBottom: 15,
  },
  // User name styling - large, bold text
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  // Email text styling - smaller, lighter color
  email: {
    fontSize: 14,
    color: "#666",
  },
  // Menu container - white background with shadow
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Individual menu item styling - horizontal layout with border
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0", // Light gray separator line
  },
  // Menu item text - takes up available space between icons
  menuText: {
    flex: 1, // Expands to fill space between icons
    fontSize: 16,
    color: "#333",
    marginLeft: 15, // Space between left icon and text
  },
  // Logout item specific styling - removes bottom border
  logoutItem: {
    borderBottomWidth: 0, // No border on last item
  },
  // Logout text color - red to indicate destructive action
  logoutText: {
    color: "#FF6B6B", // Red color for sign out text
  },
});
