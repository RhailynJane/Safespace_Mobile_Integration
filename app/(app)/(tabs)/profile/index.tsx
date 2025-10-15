import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useUser } from "@clerk/clerk-expo";
import CurvedBackground from "../../../../components/CurvedBackground";
import BottomNavigation from "../../../../components/BottomNavigation";
import { syncUserWithDatabase } from '../../../../utils/userSync';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  profileImageUrl?: string;
}

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
  });
  const [loading, setLoading] = useState(true);

  const { signOut } = useAuth();
  const { user } = useUser();

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Use the existing sync function from userSync.ts
  const syncUserWithBackend = async (): Promise<boolean> => {
    if (!user) {
      console.log('❌ No user available for sync');
      return false;
    }

    try {
      console.log('🔄 Using userSync.ts to sync user...');
      await syncUserWithDatabase(user);
      console.log('✅ User synced successfully via userSync.ts');
      return true;
    } catch (error) {
      console.error('❌ Error syncing user via userSync.ts:', error);
      return false;
    }
  };

  // Simple function to fetch client profile directly
  const fetchClientProfile = async (clerkUserId: string): Promise<any> => {
    try {
      console.log('📋 Fetching client profile for:', clerkUserId);
      
      const response = await fetch(`${API_URL}/api/client-profile/${clerkUserId}`);
      
      console.log('Profile response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Profile not found, might be new user');
          return null;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const result = await response.json();
      console.log('Profile API result:', result);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
  };

  // Fetch profile data from backend
  const fetchProfileData = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📋 Starting profile data fetch...');
      
      // First try to sync user (but don't block if it fails)
      const syncSuccess = await syncUserWithBackend();
      console.log('Sync success:', syncSuccess);
      
      // Try to load from backend API using direct function call
      try {
        const backendProfile = await fetchClientProfile(user.id);
        console.log('Backend profile data:', backendProfile);
        
        if (backendProfile) {
          setProfileData(prev => ({
            ...prev,
            firstName: backendProfile.firstName || user.firstName || "User",
            lastName: backendProfile.lastName || user.lastName || "",
            email: backendProfile.email || user.emailAddresses[0]?.emailAddress || "",
            phoneNumber: backendProfile.phoneNumber || user.phoneNumbers[0]?.phoneNumber,
            profileImageUrl: backendProfile.profileImage || user.imageUrl || prev.profileImageUrl,
          }));
        } else {
          // Fallback to Clerk data
          console.log('Using Clerk data as fallback');
          setProfileData(prev => ({
            ...prev,
            firstName: user.firstName || prev.firstName || "User",
            lastName: user.lastName || prev.lastName || "",
            email: user.emailAddresses[0]?.emailAddress || prev.email || "",
            phoneNumber: user.phoneNumbers[0]?.phoneNumber || prev.phoneNumber,
            profileImageUrl: user.imageUrl || prev.profileImageUrl,
          }));
        }
      } catch (apiError) {
        console.error('❌ API error, using Clerk data:', apiError);
        // Use Clerk data as final fallback
        setProfileData(prev => ({
          ...prev,
          firstName: user.firstName || prev.firstName || "User",
          lastName: user.lastName || prev.lastName || "",
          email: user.emailAddresses[0]?.emailAddress || prev.email || "",
          phoneNumber: user.phoneNumbers[0]?.phoneNumber || prev.phoneNumber,
          profileImageUrl: user.imageUrl || prev.profileImageUrl,
        }));
      }

      // Load local storage data
      try {
        const savedProfileData = await AsyncStorage.getItem('profileData');
        if (savedProfileData) {
          const parsedData = JSON.parse(savedProfileData);
          setProfileData(prev => ({
            ...prev,
            ...parsedData
          }));
        }
      } catch (storageError) {
        console.error('Error loading local storage:', storageError);
      }

    } catch (error) {
      console.error('❌ Error in fetchProfileData:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Signout initiated...');
      
      if (signOut) {
        await signOut();
        console.log('Clerk signout successful');
      }
      
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared');
      
      router.replace("/(auth)/login");
      console.log('Navigation to login completed');
      
    } catch (error) {
      console.error("Signout error:", error);
      Alert.alert("Sign Out Failed", "Unable to sign out. Please try again.");
    }
  };

  const getFullName = () => {
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`.trim();
    }
    return profileData.firstName || "User";
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

  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Profile Information Section */}
          <View style={styles.profileSection}>
            {profileData.profileImageUrl ? (
              <Image 
                source={{ uri: profileData.profileImageUrl }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileInitials}>
                <Text style={styles.initialsText}>{getInitials()}</Text>
              </View>
            )}
            <Text style={styles.name}>{getFullName()}</Text>
            <Text style={styles.email}>{profileData.email}</Text>
            {profileData.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.location}>{profileData.location}</Text>
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

// Your styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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