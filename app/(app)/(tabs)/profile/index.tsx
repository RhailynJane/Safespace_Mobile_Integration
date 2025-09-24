import React, { useState, useEffect } from "react";
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
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "@clerk/clerk-expo"; // Import Clerk auth hook
import CurvedBackground from "../../../../components/CurvedBackground";
import BottomNavigation from "../../../../components/BottomNavigation";

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    location: string;
  }>({
    firstName: "Demo",
    lastName: "User",
    location: "Calgary, AB",
  });

  // Use Clerk's useAuth hook to get signOut function
  const { signOut, isSignedIn } = useAuth();

  const MOCK_USER = {
    email: "demo@gmail.com",
    displayName: "Demo User"
  };

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }

      const savedProfileData = await AsyncStorage.getItem('profileData');
      if (savedProfileData) {
        const parsedData = JSON.parse(savedProfileData);
        setProfileData(parsedData);
      }
    } catch (error) {
      console.log('Error loading profile data:', error);
    }
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Fixed signout function with Clerk integration
   */
  const handleLogout = async () => {
    try {
      console.log('Signout initiated...');
      
      // Sign out from Clerk
      if (signOut) {
        await signOut();
        console.log('Clerk signout successful');
      }
      
      // Clear local storage
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared');
      
      // Navigate to auth screen - use absolute path
      router.replace("/(auth)/login");
      console.log('Navigation to login completed');
      
    } catch (error) {
      console.error("Signout error:", error);
      Alert.alert("Sign Out Failed", "Unable to sign out. Please try again.");
    }
  };

  const getGreetingName = () => {
    return profileData.firstName || "User";
  };

  const getFullName = () => {
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`.trim();
    }
    return getGreetingName();
  };

  const getLocation = () => {
    return profileData.location || "";
  };

  const getInitials = () => {
    const firstName = profileData.firstName || "";
    const lastName = profileData.lastName || "";
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    return "U";
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Profile Information Section */}
          <View style={styles.profileSection}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileInitials}>
                <Text style={styles.initialsText}>{getInitials()}</Text>
              </View>
            )}
            <Text style={styles.name}>{getFullName()}</Text>
            <Text style={styles.email}>{MOCK_USER.email}</Text>
            {getLocation() && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.location}>{getLocation()}</Text>
              </View>
            )}
          </View>

          {/* Menu Items Section */}
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/profile/edit")}
            >
              <Ionicons name="person-outline" size={24} color="#666" />
              <Text style={styles.menuText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/profile/settings")}
            >
              <Ionicons name="settings-outline" size={24} color="#666" />
              <Text style={styles.menuText}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/profile/help-support")}
            >
              <Ionicons name="help-circle-outline" size={24} color="#666" />
              <Text style={styles.menuText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.menuText, styles.logoutText]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Space for bottom navigation
  },
  profileSection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 30,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 50,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  profileInitials: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  initialsText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: "#FF6B6B",
  },
});

const bottomNavStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    alignItems: "center",
    padding: 8,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
  },
});