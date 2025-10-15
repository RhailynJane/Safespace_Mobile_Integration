/* eslint-disable react-hooks/exhaustive-deps */
// app/(app)/(tabs)/profile/edit.tsx
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
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@clerk/clerk-expo";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import profileAPI, { ClientProfileData } from "../../../../utils/profileApi";
import settingsApi from "../../../../utils/settingsApi";
import { locationService } from "../../../../utils/locationService";
import DateTimePicker from "@react-native-community/datetimepicker";

// Gender options from CMHA form
const GENDER_OPTIONS = [
  "Agender",
  "Gender-fluid",
  "Genderqueer",
  "Gender Variant",
  "Intersex",
  "Man",
  "Non-Binary",
  "Non-Conforming",
  "Questioning",
  "Transgender Man",
  "Transgender Woman",
  "Two-Spirit",
  "I don't identify with any gender",
  "I do not know",
  "Prefer not to answer",
  "Woman",
];

// Status in Canada options
const CANADA_STATUS_OPTIONS = [
  "Canadian Citizen",
  "Permanent Resident",
  "Refugee",
  "Newcomer",
  "Temporary Resident",
  "Do not know",
  "Prefer not to answer",
  "Other",
];

const ETHNOCULTURAL_OPTIONS = [
  "First Nations",
  "Métis",
  "Inuit",
  "European",
  "Asian",
  "South Asian",
  "Southeast Asian",
  "African",
  "Caribbean",
  "Latin American",
  "Middle Eastern",
  "Mixed Heritage",
  "Prefer not to answer",
  "Other",
];

const LANGUAGE_OPTIONS = [
  "English",
  "French",
  "Spanish",
  "Mandarin",
  "Cantonese",
  "Punjabi",
  "Tagalog",
  "Arabic",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Hindi",
  "Vietnamese",
  "Other",
];

// Mental Health/Medical Concerns options
const HEALTH_CONCERNS_OPTIONS = [
  "I have a disability",
  "I have an illness or mental-health concern",
  "I do not have any ongoing medical conditions",
  "I do not know",
  "Not applicable",
  "Prefer not to answer",
];

export default function EditProfileScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [dateDisplay, setDateDisplay] = useState("");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showEthnoculturalPicker, setShowEthnoculturalPicker] = useState(false);
  const [streetSuggestions, setStreetSuggestions] = useState<any[]>([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [postalSuggestions, setPostalSuggestions] = useState<any[]>([]);
  const [showPostalSuggestions, setShowPostalSuggestions] = useState(false);
  // Add a ref for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user data from Clerk
  const { user } = useUser();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    pronouns: "",
    // Address
    streetAddress: "",
    city: "",
    postalCode: "",
    location: "",
    // Emergency Contact
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    emergencyContactNumber: "",
    // Settings
    notifications: true,
    shareWithSupportWorker: false,
    isLGBTQ: "",
    primaryLanguage: "",
    mentalHealthConcerns: "",
    supportNeeded: "",
    ethnoculturalBackground: "",
    canadaStatus: "",
    dateCameToCanada: "",
  });

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Load existing profile data when screen loads
  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user]);

  /**
   * Loads profile data from local storage and Clerk
   */
  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load from Clerk user object first
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0]?.emailAddress || "",
        phoneNumber: user.phoneNumbers[0]?.phoneNumber || "",
      }));

      // Set profile image from Clerk if available
      if (user.imageUrl) {
        setProfileImage(user.imageUrl);
      }

      // Load additional data from local storage
      const savedImage = await AsyncStorage.getItem("profileImage");
      if (savedImage) {
        setProfileImage(savedImage);
      }

      // Load saved profile data
      const savedProfileData = await AsyncStorage.getItem("profileData");
      if (savedProfileData) {
        const parsedData = JSON.parse(savedProfileData);
        setFormData((prev) => ({
          ...prev,
          ...parsedData,
        }));

        if (parsedData.location) {
          setLocationQuery(parsedData.location);
        }
      }

      // Load CMHA specific data
      const savedCmhaData = await AsyncStorage.getItem("cmhaProfileData");
      if (savedCmhaData) {
        const cmhaData = JSON.parse(savedCmhaData);
        setFormData((prev) => ({
          ...prev,
          ...cmhaData,
        }));
      }

      // Fetch from backend API if available
      try {
        const profileData = await profileAPI.getClientProfile(user.id);

        if (profileData) {
          setFormData((prev) => ({
            ...prev,
            firstName:
              profileData.firstName || user.firstName || prev.firstName,
            lastName: profileData.lastName || user.lastName || prev.lastName,
            email:
              profileData.email ||
              user.emailAddresses[0]?.emailAddress ||
              prev.email,
            phoneNumber: profileData.phoneNumber || prev.phoneNumber,
            location: profileData.city || prev.location, // Note: using city as location
            dateOfBirth: profileData.dateOfBirth || prev.dateOfBirth,
            gender: profileData.gender || prev.gender,
            streetAddress: profileData.address || prev.streetAddress,
            postalCode: profileData.postalCode || prev.postalCode,
            emergencyContactName:
              profileData.emergencyContactName || prev.emergencyContactName,
            emergencyContactPhone:
              profileData.emergencyContactPhone || prev.emergencyContactPhone,
            emergencyContactRelationship:
              profileData.emergencyContactRelationship ||
              prev.emergencyContactRelationship,
          }));

          if (profileData.city) {
            setLocationQuery(profileData.city);
          }

          // Set profile image from backend if available
          if (profileData.profileImage) {
            setProfileImage(profileData.profileImage);
          }
        }
      } catch (apiError) {
        console.log("API fetch failed, using local/Clerk data:", apiError);
      }
    } catch (error) {
      console.log("Error loading profile data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Address search functions
  const handleStreetSearch = async (text: string) => {
    setFormData({ ...formData, streetAddress: text });

    if (text.length < 3) {
      setStreetSuggestions([]);
      setShowStreetSuggestions(false);
      return;
    }

    try {
      const suggestions = await locationService.searchAddresses(text);
      setStreetSuggestions(suggestions);
      setShowStreetSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error("Error fetching street suggestions:", error);
    }
  };

  const handlePostalSearch = async (text: string) => {
    setFormData({ ...formData, postalCode: text });

    if (text.length < 3) {
      setPostalSuggestions([]);
      setShowPostalSuggestions(false);
      return;
    }

    try {
      const suggestions = await locationService.searchPostalCodes(text);
      setPostalSuggestions(suggestions);
      setShowPostalSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error("Error fetching postal suggestions:", error);
    }
  };

  // Date handling functions
  const handleDatePress = () => {
    if (formData.dateOfBirth) {
      // Parse existing date if available
      const [month, day, year] = formData.dateOfBirth.split("/");
      if (year && month && day) {
        setTempDate(
          new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        );
      }
    } else {
      setTempDate(new Date());
    }
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    // Format date as YYYY-MM-DD for database (PostgreSQL format)
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, "0");
    const day = String(tempDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    // Format for display as MM/DD/YYYY
    const displayDate = `${month}/${day}/${year}`;

    setFormData({ ...formData, dateOfBirth: formattedDate });
    setDateDisplay(displayDate);
    setShowDatePicker(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  /**
   * Fetches location suggestions from OpenStreetMap
   */
  const fetchLocationSuggestions = async (input: string) => {
    if (input.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    try {
      setLoadingLocations(true);
      const suggestions = await locationService.searchLocations(input);

      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setLocationSuggestions([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  /**
   * Handles location search with debouncing
   */
  const handleLocationSearch = (text: string) => {
    setLocationQuery(text);
    setFormData({ ...formData, location: text });

    // Cancel previous timeout if exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the API call
    searchTimeoutRef.current = setTimeout(() => {
      fetchLocationSuggestions(text);
    }, 500);
  };

  /**
   * Selects location from suggestions
   */
  const selectLocation = (location: any) => {
    setLocationQuery(location.description);
    setFormData({ ...formData, location: location.description });
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  /**
   * Handles profile photo selection and upload
   */
  const handleSelectImage = async () => {
    if (!user?.id) {
      Alert.alert("Error", "User not available");
      return;
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;

        try {
          // Save to local storage immediately
          await AsyncStorage.setItem("profileImage", imageUri);
          setProfileImage(imageUri);

          Alert.alert("Success", "Profile picture updated successfully!");
        } catch (uploadError) {
          console.error("Error saving image:", uploadError);
          Alert.alert(
            "Error",
            "Failed to save profile picture. Please try again."
          );
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      setUploadingImage(false);
      Alert.alert(
        "Error",
        "Failed to update profile picture. Please try again."
      );
    }
  };

  /**
   * Saves profile data to local storage as backup
   */
  const saveProfileDataToStorage = async () => {
    try {
      await AsyncStorage.setItem("profileData", JSON.stringify(formData));
      console.log("Profile data saved to storage");
    } catch (error) {
      console.log("Error saving profile data to storage:", error);
    }
  };

  /**
   * Saves CMHA specific data to local storage
   */
  const saveCmhaDataToStorage = async () => {
    try {
      await AsyncStorage.setItem("cmhaProfileData", JSON.stringify(formData));
      console.log("CMHA data saved to storage");
    } catch (error) {
      console.log("Error saving CMHA data to storage:", error);
    }
  };

  /**
   * Saves profile changes to backend API and local storage
   */
  const handleSaveChanges = async () => {
    if (!user?.id) {
      Alert.alert("Error", "User not available");
      return;
    }

    try {
      setSaving(true);

      // Validate required fields
      if (!formData.firstName || !formData.email) {
        Alert.alert("Error", "Please fill in First Name and Email Address");
        return;
      }

      // Prepare data for backend API - FIXED VERSION
      const profileData: Partial<ClientProfileData> = {
        firstName: formData.firstName?.trim() || "",
        lastName: formData.lastName?.trim() || "",
        email: formData.email?.trim() || "",
        phoneNumber: formData.phoneNumber?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth?.trim() || undefined,
        gender: formData.gender?.trim() || undefined,
        address: formData.streetAddress?.trim() || undefined,
        city: formData.location?.trim() || undefined, // Make sure this matches your backend expectation
        postalCode: formData.postalCode?.trim() || undefined,
        country: "Canada",
        emergencyContactName:
          formData.emergencyContactName?.trim() || undefined,
        emergencyContactPhone:
          formData.emergencyContactNumber?.trim() || undefined,
        emergencyContactRelationship:
          formData.emergencyContactRelationship?.trim() || undefined,

        // CMHA Demographics
        pronouns: formData.pronouns?.trim() || undefined,
        isLGBTQ: formData.isLGBTQ?.trim() || undefined,
        primaryLanguage: formData.primaryLanguage?.trim() || undefined,
        mentalHealthConcerns:
          formData.mentalHealthConcerns?.trim() || undefined,
        supportNeeded: formData.supportNeeded?.trim() || undefined,
        ethnoculturalBackground:
          formData.ethnoculturalBackground?.trim() || undefined,
        canadaStatus: formData.canadaStatus?.trim() || undefined,
        dateCameToCanada: formData.dateCameToCanada?.trim() || undefined,
      };

      console.log("🎯 Prepared profile data for API:", profileData);

      // Save to backend API
      try {
        const result = await profileAPI.updateClientProfile(
          user.id,
          profileData
        );

        if (result.success) {
          // Save notification settings
          await settingsApi.saveSettings({
            notificationsEnabled: formData.notifications,
            shareWithSupportWorker: formData.shareWithSupportWorker,
          });

          // Save to local storage as backup
          await saveProfileDataToStorage();
          await saveCmhaDataToStorage();

          Alert.alert("Success", "Profile updated successfully!");
          router.back();
        } else {
          throw new Error(result.message);
        }
      } catch (apiError) {
        console.log("API update failed, saving locally:", apiError);
        // If API fails, save to local storage only
        await saveProfileDataToStorage();
        await saveCmhaDataToStorage();
        Alert.alert("Success", "Profile updated locally!");
        router.back();
      }
    } catch (error) {
      console.error("Error in handleSaveChanges:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
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

  /**
   * Renders option buttons for selection fields
   */
  const renderOptionButtons = (
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => {
    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              selectedValue === option && styles.optionButtonSelected,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.optionText,
                selectedValue === option && styles.optionTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Renders location suggestions list
   */
  const renderLocationSuggestions = () => {
    if (!showLocationSuggestions || locationSuggestions.length === 0) {
      return null;
    }

    return (
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionsList}>
          {loadingLocations ? (
            <View style={styles.loadingSuggestions}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.loadingText}>Searching locations...</Text>
            </View>
          ) : (
            <FlatList
              data={locationSuggestions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selectLocation(item)}
                >
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsFlatList}
              nestedScrollEnabled={true}
            />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={styles.container}>
          <AppHeader title="Edit Profile" showBack={true} />
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
        <AppHeader title="Edit Profile" showBack={true} />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Section */}
          <View style={styles.profilePhotoSection}>
            <View style={styles.profilePhotoContainer}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.profilePhoto}>
                  <Text style={styles.initialsText}>{getInitials()}</Text>
                </View>
              )}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
              <TouchableOpacity
                style={styles.editPhotoButton}
                onPress={handleSelectImage}
              >
                <Text style={styles.editPhotoText}>
                  {uploadingImage ? "Uploading..." : "Edit Photo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
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
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phoneNumber: text })
                  }
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={handleDatePress}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <Text
                  style={[styles.input, !dateDisplay && styles.placeholderText]}
                >
                  {dateDisplay || "Tap to select date"}
                </Text>
              </TouchableOpacity>

              {/* Date Picker Modal */}
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
              >
                <View style={styles.modalContainer}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>
                        Select Date of Birth
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Ionicons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>

                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      style={styles.datePicker}
                    />

                    <View style={styles.datePickerActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleDateConfirm}
                      >
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          </View>

          {/* Demographics Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Demographics</Text>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              {renderOptionButtons(GENDER_OPTIONS, formData.gender, (value) =>
                setFormData({ ...formData, gender: value })
              )}
            </View>

            {/* Pronouns */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pronouns</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.pronouns}
                  onChangeText={(text) =>
                    setFormData({ ...formData, pronouns: text })
                  }
                  placeholder="e.g., they/them, he/him, she/her"
                />
              </View>
            </View>

            {/* LGBTQ+ Identification */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Do you identify as LGBTQ+?</Text>
              {renderOptionButtons(
                ["Yes", "No", "I do not know", "Prefer not to answer"],
                formData.isLGBTQ,
                (value) => setFormData({ ...formData, isLGBTQ: value })
              )}
            </View>

            {/* Primary Language */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Language</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowLanguagePicker(true)}
              >
                <Ionicons
                  name="language-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    !formData.primaryLanguage && styles.placeholderText,
                  ]}
                >
                  {formData.primaryLanguage || "Select your primary language"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

              {/* Language Picker Modal */}
              <Modal
                visible={showLanguagePicker}
                transparent={true}
                animationType="slide"
              >
                <View style={styles.modalContainer}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerTitle}>
                        Select Primary Language
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowLanguagePicker(false)}
                      >
                        <Ionicons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>

                    <FlatList
                      data={LANGUAGE_OPTIONS}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.optionItem,
                            formData.primaryLanguage === item &&
                              styles.optionItemSelected,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, primaryLanguage: item });
                            setShowLanguagePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.optionItemText,
                              formData.primaryLanguage === item &&
                                styles.optionItemTextSelected,
                            ]}
                          >
                            {item}
                          </Text>
                          {formData.primaryLanguage === item && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color="#4CAF50"
                            />
                          )}
                        </TouchableOpacity>
                      )}
                      style={styles.optionsList}
                    />
                  </View>
                </View>
              </Modal>
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Address Information</Text>

            {/* Street Address */}
            {/* Street Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="home-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.streetAddress}
                  onChangeText={handleStreetSearch}
                  placeholder="Enter your street address"
                  placeholderTextColor="#999"
                />
              </View>
              {showStreetSuggestions && streetSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={streetSuggestions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          setFormData({
                            ...formData,
                            streetAddress: item.description.split(",")[0], // Get just the street part
                          });
                          setShowStreetSuggestions(false);
                        }}
                      >
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color="#666"
                        />
                        <Text style={styles.suggestionText} numberOfLines={2}>
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                    )}
                    style={styles.suggestionsList}
                  />
                </View>
              )}
            </View>

            {/* Location/City */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={locationQuery || formData.location}
                  onChangeText={handleLocationSearch}
                  placeholder="Enter your city"
                  placeholderTextColor="#999"
                />
              </View>
              {/* Location Suggestions Dropdown */}
              {renderLocationSuggestions()}
            </View>

            {/* Postal Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Postal Code</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="navigate-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.postalCode}
                  onChangeText={handlePostalSearch}
                  placeholder="Enter your postal code"
                  placeholderTextColor="#999"
                />
              </View>
              {showPostalSuggestions && postalSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={postalSuggestions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          setFormData({
                            ...formData,
                            postalCode: item.postalCode,
                          });
                          setShowPostalSuggestions(false);
                        }}
                      >
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color="#666"
                        />
                        <Text style={styles.suggestionText} numberOfLines={2}>
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                    )}
                    style={styles.suggestionsList}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Emergency Contact Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>

            {/* Emergency Contact Name & Relationship */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Emergency Contact Name & Relationship
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.emergencyContactName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, emergencyContactName: text })
                  }
                  placeholder="Name and relationship"
                />
              </View>
            </View>

            {/* Emergency Contact Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Emergency Contact Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.emergencyContactNumber}
                  onChangeText={(text) =>
                    setFormData({ ...formData, emergencyContactNumber: text })
                  }
                  placeholder="Emergency contact phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Health Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Health Information</Text>

            {/* Mental Health/Medical Concerns */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mental Health/Medical Concerns</Text>
              {renderOptionButtons(
                HEALTH_CONCERNS_OPTIONS,
                formData.mentalHealthConcerns,
                (value) =>
                  setFormData({ ...formData, mentalHealthConcerns: value })
              )}
            </View>

            {/* Support Needed */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Support Needed</Text>
              <TextInput
                style={[styles.textArea, styles.borderedInput]}
                value={formData.supportNeeded}
                onChangeText={(text) =>
                  setFormData({ ...formData, supportNeeded: text })
                }
                placeholder="Any access needs or accommodations you'd like us to know about"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            {/* Ethnocultural Background */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ethnocultural Background</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowEthnoculturalPicker(true)}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    !formData.ethnoculturalBackground && styles.placeholderText,
                  ]}
                >
                  {formData.ethnoculturalBackground ||
                    "Select ethnocultural background"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

              {/* Ethnocultural Picker Modal */}
              <Modal
                visible={showEthnoculturalPicker}
                transparent={true}
                animationType="slide"
              >
                <View style={styles.modalContainer}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerTitle}>
                        Select Ethnocultural Background
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowEthnoculturalPicker(false)}
                      >
                        <Ionicons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>

                    <FlatList
                      data={ETHNOCULTURAL_OPTIONS}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.optionItem,
                            formData.ethnoculturalBackground === item &&
                              styles.optionItemSelected,
                          ]}
                          onPress={() => {
                            setFormData({
                              ...formData,
                              ethnoculturalBackground: item,
                            });
                            setShowEthnoculturalPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.optionItemText,
                              formData.ethnoculturalBackground === item &&
                                styles.optionItemTextSelected,
                            ]}
                          >
                            {item}
                          </Text>
                          {formData.ethnoculturalBackground === item && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color="#4CAF50"
                            />
                          )}
                        </TouchableOpacity>
                      )}
                      style={styles.optionsList}
                    />
                  </View>
                </View>
              </Modal>
            </View>

            {/* Status in Canada */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status in Canada</Text>
              {renderOptionButtons(
                CANADA_STATUS_OPTIONS,
                formData.canadaStatus,
                (value) => setFormData({ ...formData, canadaStatus: value })
              )}
            </View>

            {/* Date Came to Canada */}
            {Boolean(
              formData.canadaStatus &&
                formData.canadaStatus !== "Canadian Citizen" &&
                formData.canadaStatus !== "Do not know" &&
                formData.canadaStatus !== "Prefer not to answer"
            ) && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date Came to Canada</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.dateCameToCanada}
                    onChangeText={(text) =>
                      setFormData({ ...formData, dateCameToCanada: text })
                    }
                    placeholder="MM/DD/YYYY"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Save Changes Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* Notification Section */}
          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Notification</Text>
            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name="notifications-outline"
                    size={16}
                    color="#4CAF50"
                  />
                </View>
                <Text style={styles.notificationText}>
                  Sign up for Notifications
                </Text>
              </View>
              <Switch
                value={formData.notifications}
                onValueChange={(value) =>
                  setFormData({ ...formData, notifications: value })
                }
                trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Privacy Settings Section */}
          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="shield-outline" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.notificationText}>
                  Share info with support worker
                </Text>
              </View>
              <Switch
                value={formData.shareWithSupportWorker}
                onValueChange={(value) =>
                  setFormData({ ...formData, shareWithSupportWorker: value })
                }
                trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
                thumbColor="#FFFFFF"
              />
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  formSection: {
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
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  optionButtonSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  optionText: {
    fontSize: 12,
    color: "#666",
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: "#A5D6A7",
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
  suggestionsContainer: {
    position: "relative",
    zIndex: 1000,
    marginTop: 5,
  },
  suggestionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 200,
  },
  suggestionsFlatList: {
    borderRadius: 10,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  loadingSuggestions: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  placeholderText: {
    color: "#999",
  },
  borderedInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  pickerContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  datePicker: {
    height: Platform.OS === "ios" ? 200 : 0,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionItemSelected: {
    backgroundColor: "#F0F8F0",
  },
  optionItemText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  optionItemTextSelected: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  textArea: {
    minHeight: 100,
    borderRadius: 12,
    textAlignVertical: "top",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#F8F8F8",
    fontSize: 16,
    color: "#333",
  },
});
