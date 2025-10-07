/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Image,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from "@clerk/clerk-expo";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import profileAPI from '../../../../utils/profileApi'; 
import * as Location from 'expo-location';
import settingsApi from "../../../../utils/settingsApi";


/**
 * EditProfileScreen Component
 * 
 * Screen for editing user profile information including photo, name, email,
 * location, and notification preferences. Features image upload functionality
 * and location autocomplete suggestions.
 */
export default function EditProfileScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const GOOGLE_PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
  const GOOGLE_PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  // Sample cities for autocomplete
  const sampleCities = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
    "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
    "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
    "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Boston, MA",
    "Toronto, ON", "Vancouver, BC", "Montreal, QC", "Calgary, AB", "Ottawa, ON"
  ];

  // Get user data from Clerk
  const { user } = useUser();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    notifications: true,
    shareWithSupportWorker: false, // NEW FIELD
  });

    /**
   * Fetches location suggestions from Google Places API
   */
    const fetchGooglePlacesSuggestions = async (input: string) => {
      if (input.length < 2) {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          input: input,
          key: GOOGLE_PLACES_API_KEY,
          types: '(cities)', // Restrict to cities
          language: 'en',
        });

        const response = await fetch(`${GOOGLE_PLACES_AUTOCOMPLETE_URL}?${params}`);
        const data = await response.json();

        if (data.status === 'OK' && data.predictions) {
          const suggestions = data.predictions.map((prediction: any) => ({
            description: prediction.description,
            place_id: prediction.place_id,
            main_text: prediction.structured_formatting?.main_text || '',
            secondary_text: prediction.structured_formatting?.secondary_text || '',
          }));
          
          setLocationSuggestions(suggestions);
          setShowLocationSuggestions(true);
        } else {
          console.log('Google Places API error:', data.status);
          setLocationSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching places:', error);
        // Fallback to your sample cities if API fails
        const filtered = sampleCities.filter(city =>
          city.toLowerCase().includes(input.toLowerCase())
        ).slice(0, 5);
        setLocationSuggestions(filtered.map(city => ({ description: city })));
        setShowLocationSuggestions(filtered.length > 0);
      }
    };

    /**
   * Gets detailed place information including coordinates
   */
  const fetchPlaceDetails = async (placeId: string) => {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: GOOGLE_PLACES_API_KEY,
        fields: 'geometry,formatted_address,address_components',
      });

      const response = await fetch(`${GOOGLE_PLACES_DETAILS_URL}?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          formatted_address: data.result.formatted_address,
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
          address_components: data.result.address_components,
        };
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
    return null;
  };

  // Update your handleLocationSearch function
  const handleLocationSearch = (text: string) => {
    setLocationQuery(text);
    setFormData({ ...formData, location: text });
    
    // Cancel previous timeout if exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce the API call
    searchTimeoutRef.current = setTimeout(() => {
      fetchGooglePlacesSuggestions(text);
    }, 300); // Wait 300ms after user stops typing
  };

  // Add a ref for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Update your selectLocation function
  const selectLocation = async (location: any) => {
    if (typeof location === 'string') {
      // Fallback for sample cities
      setLocationQuery(location);
      setFormData({ ...formData, location });
    } else {
      // Google Places result
      setLocationQuery(location.description);
      setFormData({ ...formData, location: location.description });
      
      // Optionally fetch more details
      if (location.place_id) {
        const details = await fetchPlaceDetails(location.place_id);
        if (details) {
          // You can store coordinates or other details if needed
          console.log('Place details:', details);
          // Store in formData or separate state as needed
        }
      }
    }
    setShowLocationSuggestions(false);
  };

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Load existing profile data when screen loads
  useEffect(() => {
    loadProfileData();
  }, []);

  /**
   * Loads profile data from local storage and Clerk
   */
  const loadProfileData = async () => {
    try {
      // First, load from Clerk user object (primary source of truth)
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.emailAddresses[0]?.emailAddress || "",
          location: formData.location,
          notifications: formData.notifications,
          shareWithSupportWorker: formData.shareWithSupportWorker, // NEW
        });
        
        // Also set profile image from Clerk if available
        if (user.imageUrl) {
          setProfileImage(user.imageUrl);
        }
      }
      
      // Then load any additional data from local storage (like custom profile image)
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }
      
      // Load saved profile data for location and other custom fields
      const savedProfileData = await AsyncStorage.getItem('profileData');
      if (savedProfileData) {
        const parsedData = JSON.parse(savedProfileData);
        setFormData(prev => ({
          ...prev,
          location: parsedData.location || prev.location,
          notifications: parsedData.notifications !== undefined ? parsedData.notifications : prev.notifications,
          shareWithSupportWorker: parsedData.shareWithSupportWorker !== undefined ? parsedData.shareWithSupportWorker : prev.shareWithSupportWorker, // NEW
        }));
        
        if (parsedData.location) {
          setLocationQuery(parsedData.location);
        }
      }

      // Finally, try to fetch from backend API if available
      try {
        const profileData = await profileAPI.getClientProfile();
        
        if (profileData) {
          setFormData(prev => ({
            firstName: user?.firstName || profileData.firstName || prev.firstName,
            lastName: user?.lastName || profileData.lastName || prev.lastName,
            email: user?.emailAddresses[0]?.emailAddress || profileData.email || prev.email,
            location: profileData.location || prev.location,
            notifications: profileData.notifications !== false,
            shareWithSupportWorker: profileData.shareWithSupportWorker !== undefined ? profileData.shareWithSupportWorker : prev.shareWithSupportWorker, // NEW
          }));
          
          if (profileData.location) {
            setLocationQuery(profileData.location);
          }
        }
      } catch (apiError) {
        console.log('API fetch failed, using local/Clerk data:', apiError);
      }
      
    } catch (error) {
      console.log('Error loading profile data:', error);
      Alert.alert("Error", "Failed to load profile data");
    }
  };

  /**
   * Saves image to local storage
   */
  const saveImageToStorage = async (imageUri: string) => {
    try {
      await AsyncStorage.setItem('profileImage', imageUri);
      console.log('Profile image saved successfully');
    } catch (error) {
      console.log('Error saving profile image:', error);
      Alert.alert("Error", "Failed to save profile image");
    }
  };

  /**
   * Saves profile data to local storage as backup
   */
  const saveProfileDataToStorage = async () => {
    try {
      await AsyncStorage.setItem('profileData', JSON.stringify(formData));
      console.log('Profile data saved to storage');
    } catch (error) {
      console.log('Error saving profile data to storage:', error);
    }
  };

  /**
   * Saves profile changes to backend API and local storage
   */
  const handleSaveChanges = async () => {
    try {
      // Validate required fields
      if (!formData.firstName || !formData.email) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Note: We don't update firstName, lastName, or email in Clerk
      // Those should be updated through Clerk's user management
      // We only save additional profile data like location and notifications
      
      // Save to backend API if available
      try {
        const result = await profileAPI.updateClientProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          location: formData.location,
          notifications: formData.notifications,
          shareWithSupportWorker: formData.shareWithSupportWorker, // NEW
          profileImage: profileImage || undefined,
        });

      // Save notification setting separately to SettingsAPI
      const settingsResult = await settingsApi.saveSettings({
        notificationsEnabled: formData.notifications,
        shareWithSupportWorker: formData.shareWithSupportWorker, // NEW
      });

        if (result.success) {
          // Also save to local storage as backup
          await saveProfileDataToStorage();
          
          Alert.alert("Success", "Profile updated successfully!");
          router.back();
        } else {
          // If API fails, still save to local storage
          await saveProfileDataToStorage();
          Alert.alert("Success", "Profile updated locally!");
          router.back();
        }
      } catch (apiError) {
        // If API is not available, just save to local storage
        console.log('API update failed, saving locally:', apiError);
        await saveProfileDataToStorage();
        Alert.alert("Success", "Profile updated locally!");
        router.back();
      }
    } catch (error) {
      console.error('Error in handleSaveChanges:', error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  /**
   * Handles tab navigation
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else if (tabId === "profile") {
      router.back();
    } else if (tabId === "messages") {
      router.push("/(app)/(tabs)/messages");
    } else if (tabId === "appointments") {
      router.push("/(app)/(tabs)/appointments");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Opens image picker options for profile photo
   */
  const handleEditPhoto = () => {
    Alert.alert(
      "Edit Profile Photo",
      "Choose an option",
      [
        { text: "Camera", onPress: openCamera },
        { text: "Gallery", onPress: openGallery },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  /**
   * Opens camera to take a new profile photo
   */
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      await saveImageToStorage(imageUri);
    }
  };

  /**
   * Opens gallery to select an existing photo
   */
  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      await saveImageToStorage(imageUri);
    }
  };

  /**
   * Generates initials for avatar fallback
   */
  const getInitials = () => {
    const firstName = formData.firstName || "";
    const lastName = formData.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  /**
   * Returns full name for display
   */
  const getFullName = () => {
    return `${formData.firstName} ${formData.lastName}`.trim() || "User";
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Edit Profile" showBack={true} />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Profile Photo Section */}
          <View style={styles.profilePhotoSection}>
            <View style={styles.profilePhotoContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.profilePhoto}>
                  <Text style={styles.initialsText}>{getInitials()}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.editPhotoButton} onPress={handleEditPhoto}>
                <Text style={styles.editPhotoText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={getFullName()}
                  onChangeText={(text) => {
                    const names = text.split(" ");
                    setFormData({
                      ...formData,
                      firstName: names[0] || "",
                      lastName: names.slice(1).join(" ") || "",
                    });
                  }}
                  placeholder="Enter your full name"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value="••••••••••"
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  editable={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={locationQuery || formData.location}
                  onChangeText={handleLocationSearch}
                  placeholder="Enter your city"
                  placeholderTextColor="#999"
                  onFocus={() => {
                    if (formData.location) {
                      setLocationQuery(formData.location);
                      handleLocationSearch(formData.location);
                    }
                  }}
                />
              </View>
              {/* Location Suggestions Dropdown */}
            </View>
            {showLocationSuggestions && locationSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={locationSuggestions}
                keyExtractor={(item, index) => item.place_id || item.description || index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => selectLocation(item)}
                  >
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.suggestionText}>
                      {item.description || item}  {/* Handle both objects and strings */}
                    </Text>
                  </TouchableOpacity>
                )}
                style={styles.suggestionsList}
                nestedScrollEnabled={true}
              />
            </View>
            )}

            {/* Save Changes Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
              <Text style={styles.saveButtonText}>Save Change</Text>
            </TouchableOpacity>
          </View>

          {/* Notification Section */}
          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Notification</Text>
            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="notifications-outline" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.notificationText}>Sign up for Notifications</Text>
              </View>
              <Switch
                value={formData.notifications}
                onValueChange={(value) => setFormData({ ...formData, notifications: value })}
                trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Privacy Settings Section - NEW */}
          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="shield-outline" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.notificationText}>Share info with support worker</Text>
              </View>
              <Switch
                value={formData.shareWithSupportWorker}
                onValueChange={(value) => setFormData({ ...formData, shareWithSupportWorker: value })}
                trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Other Section */}
          <View style={styles.otherSection}>
            <Text style={styles.sectionTitle}>Other</Text>
            
            <TouchableOpacity style={styles.otherItem}>
              <View style={styles.otherLeft}>
                <View style={styles.otherIcon}>
                  <Ionicons name="call-outline" size={16} color="#666" />
                </View>
                <Text style={styles.otherText}>Contact Us</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.otherItem}>
              <View style={styles.otherLeft}>
                <View style={styles.otherIcon}>
                  <Ionicons name="shield-outline" size={16} color="#666" />
                </View>
                <Text style={styles.otherText}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.otherItem, styles.lastOtherItem]}>
              <View style={styles.otherLeft}>
                <View style={styles.otherIcon}>
                  <Ionicons name="settings-outline" size={16} color="#666" />
                </View>
                <Text style={styles.otherText}>Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  profilePhotoSection: {
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 30,
    marginBottom: 20,
  },
  profilePhotoContainer: {
    position: "relative",
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  editPhotoButton: {
    position: "absolute",
    bottom: -10,
    right: -10,
    backgroundColor: "#8B4513",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  editPhotoText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  notificationSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  notificationText: {
    fontSize: 14,
    color: "#333",
  },
  otherSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
  },
  otherItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  lastOtherItem: {
    borderBottomWidth: 0,
  },
  otherLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  otherIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  otherText: {
    fontSize: 14,
    color: "#333",
  },
  suggestionsContainer: {
    position: "relative",
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
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