/* eslint-disable react-hooks/exhaustive-deps */
// app/(app)/(tabs)/profile/edit.tsx
/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import profileAPI, { ClientProfileData } from "../../../../utils/profileApi";
import avatarEvents from "../../../../utils/avatarEvents";
import { locationService } from "../../../../utils/locationService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../../../contexts/ThemeContext";
import OptimizedImage from "../../../../components/OptimizedImage";
import { ConvexReactClient } from "convex/react";
import { useConvexProfile } from "../../../../utils/hooks/useConvexProfile";

// Gender options for the form
const GENDER_OPTIONS = [
  "Woman",
  "Man",
  "Non-Binary",
  "Agender",
  "Gender-fluid",
  "Genderqueer",
  "Gender Variant",
  "Intersex",
  "Non-Conforming",
  "Questioning",
  "Transgender Man",
  "Transgender Woman",
  "Two-Spirit",
  "I don't identify with any gender",
  "I do not know",
  "Prefer not to answer",
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
  const { theme, scaledFontSize } = useTheme();
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
  const [showCanadaDatePicker, setShowCanadaDatePicker] = useState(false);
  const [tempCanadaDate, setTempCanadaDate] = useState(new Date());
  const [canadaDateDisplay, setCanadaDateDisplay] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Error");
  // Add a ref for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    pronouns: "",
    isLGBTQ: "",
    primaryLanguage: "",
    ethnoculturalBackground: "",
    mentalHealthConcerns: "",
    supportNeeded: "",
    canadaStatus: "",
    dateCameToCanada: "",
    streetAddress: "",
    location: "",
    postalCode: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    emergencyContactRelationship: "",
  });

  // Get user data from Clerk
  const { user } = useUser();
  const { getToken } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "", // This ensures it's always a string, not undefined
    gender: "",
    pronouns: "",
    // Address
    streetAddress: "",
    city: "",
    postalCode: "",
    location: "",
    // Emergency Contact
    emergencyContactName: "",
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

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Initialize Convex client with Clerk auth for profile sync
  const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);
  useEffect(() => {
    if (!convexClient && process.env.EXPO_PUBLIC_CONVEX_URL) {
      const client = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL, { unsavedChangesWarning: false });
      client.setAuth(async () => {
        try {
          const token = await (getToken?.({ template: 'convex' }) ?? Promise.resolve(undefined));
          return token ?? undefined;
        } catch {
          return undefined;
        }
      });
      setConvexClient(client);
    }
  }, [convexClient, getToken]);

  const { updateProfileImage: convexUpdateProfileImage, syncProfile: convexSyncProfile, isUsingConvex } = useConvexProfile(user?.id, convexClient);

  // Load existing profile data when screen loads
  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user]);

  /**
   * Opens the Canada date picker and initializes with existing date
   */
  const handleCanadaDatePress = () => {
    if (formData.dateCameToCanada) {
      let dateToParse: string = formData.dateCameToCanada;

      // Handle both MM/DD/YYYY and YYYY-MM-DD formats
      let year: string, month: string, day: string;

      if (dateToParse.includes("/")) {
        // MM/DD/YYYY format
        const dateParts = dateToParse.split("/");
        month = dateParts[0] || "1";
        day = dateParts[1] || "1";
        year = dateParts[2] || "2020";
      } else if (dateToParse.includes("-")) {
        // YYYY-MM-DD format
        if (dateToParse.includes("T")) {
          const splitResult = dateToParse.split("T")[0];
          dateToParse = splitResult || dateToParse;
        }
        const dateParts = dateToParse.split("-");
        year = dateParts[0] || "2020";
        month = dateParts[1] || "1";
        day = dateParts[2] || "1";
      } else {
        year = "2020";
        month = "1";
        day = "1";
      }

      const parsedDate = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );
      setTempCanadaDate(parsedDate);

      const displayDate = `${String(parsedDate.getMonth() + 1).padStart(2, "0")}/${String(parsedDate.getDate()).padStart(2, "0")}/${parsedDate.getFullYear()}`;
      setCanadaDateDisplay(displayDate);
    } else {
      setTempCanadaDate(new Date());
      setCanadaDateDisplay("");
    }
    setShowCanadaDatePicker(true);
  };

  /**
   * Loads profile data from local storage and Clerk
   */
  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0]?.emailAddress || "",
        phoneNumber: user.phoneNumbers[0]?.phoneNumber || "",
      }));

      const profileData = await profileAPI.getClientProfile(user.id);

      // Handle Date of Birth
      if (profileData?.dateOfBirth) {
        let dateString: string = profileData.dateOfBirth;
        if (dateString.includes("T")) {
          const splitResult = dateString.split("T")[0];
          dateString = splitResult || dateString;
        }

        const dateParts = dateString.split("-");
        const year: string = dateParts[0] || "";
        const month: string = dateParts[1] || "";
        const day: string = dateParts[2] || "";
        const displayDate = `${month}/${day}/${year}`;
        setDateDisplay(displayDate);

        setFormData((prev) => ({
          ...prev,
          dateOfBirth: dateString,
        }));
      }

      if (user.imageUrl) {
        setProfileImage(user.imageUrl);
      }

      const savedImage = await AsyncStorage.getItem("profileImage");
      if (savedImage) {
        setProfileImage(savedImage);
      }

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

      const savedCmhaData = await AsyncStorage.getItem("cmhaProfileData");
      if (savedCmhaData) {
        const cmhaData = JSON.parse(savedCmhaData);
        setFormData((prev) => ({
          ...prev,
          ...cmhaData,
        }));
      }

      try {
        const profileData = await profileAPI.getClientProfile(user.id);

        if (profileData) {
          setFormData((prev) => ({
            ...prev,
            firstName:
              profileData.firstName || user.firstName || prev.firstName || "",
            lastName:
              profileData.lastName || user.lastName || prev.lastName || "",
            email:
              profileData.email ||
              user.emailAddresses[0]?.emailAddress ||
              prev.email ||
              "",
            phoneNumber: profileData.phoneNumber || prev.phoneNumber || "",
            location: profileData.city || prev.location || "",
            dateOfBirth: profileData.dateOfBirth || prev.dateOfBirth || "",
            gender: profileData.gender || prev.gender || "",
            streetAddress: profileData.address || prev.streetAddress || "",
            postalCode: profileData.postalCode || prev.postalCode || "",
            emergencyContactName:
              profileData.emergencyContactName ||
              prev.emergencyContactName ||
              "",
            emergencyContactNumber:
              profileData.emergencyContactPhone ||
              prev.emergencyContactNumber ||
              "",
            emergencyContactRelationship:
              profileData.emergencyContactRelationship ||
              prev.emergencyContactRelationship ||
              "",
            pronouns: profileData.pronouns || prev.pronouns || "",
            isLGBTQ: profileData.isLGBTQ || prev.isLGBTQ || "",
            primaryLanguage:
              profileData.primaryLanguage || prev.primaryLanguage || "",
            mentalHealthConcerns:
              profileData.mentalHealthConcerns ||
              prev.mentalHealthConcerns ||
              "",
            supportNeeded:
              profileData.supportNeeded || prev.supportNeeded || "",
            ethnoculturalBackground:
              profileData.ethnoculturalBackground ||
              prev.ethnoculturalBackground ||
              "",
            canadaStatus: profileData.canadaStatus || prev.canadaStatus || "",
            dateCameToCanada:
              profileData.dateCameToCanada || prev.dateCameToCanada || "",
          }));

          if (profileData.city) {
            setLocationQuery(profileData.city);
          }

          // ✅ Handle Date Came to Canada display
          if (profileData.dateCameToCanada) {
            let dateString: string = profileData.dateCameToCanada;
            if (dateString.includes("T")) {
              const splitResult = dateString.split("T")[0];
              dateString = splitResult || dateString;
            }

            const dateParts = dateString.split("-");
            const year: string = dateParts[0] || "";
            const month: string = dateParts[1] || "";
            const day: string = dateParts[2] || "";

            if (year && month && day) {
              const displayDate = `${month}/${day}/${year}`;
              setCanadaDateDisplay(displayDate);
            }
          }

          if (profileData.profileImage) {
            setProfileImage(profileData.profileImage);
            // Also save to local storage for offline access
            await AsyncStorage.setItem("profileImage", profileData.profileImage);
          }
        }
      } catch (apiError) {
        console.log("API fetch failed, using local/Clerk data:", apiError);
      }
    } catch (error) {
      console.log("Error loading profile data:", error);
      setErrorTitle("Error");
      setErrorMessage("Failed to load profile data");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles Canada date selection changes
   */
  const handleCanadaDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowCanadaDatePicker(false);
    }

    if (selectedDate) {
      if (Platform.OS === "android") {
        // For Android, confirm immediately
        const year = selectedDate.getUTCFullYear();
        const month = String(selectedDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getUTCDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        const displayDate = `${month}/${day}/${year}`;

        setFormData({ ...formData, dateCameToCanada: formattedDate });
        setCanadaDateDisplay(displayDate);
      } else {
        // For iOS, just update tempDate
        setTempCanadaDate(selectedDate);
      }
    }
  };

  /**
   * Confirms the Canada date selection (iOS only)
   */
  const handleCanadaDateConfirm = () => {
    const year = tempCanadaDate.getFullYear();
    const month = String(tempCanadaDate.getMonth() + 1).padStart(2, "0");
    const day = String(tempCanadaDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    const displayDate = `${month}/${day}/${year}`;

    setFormData({
      ...formData,
      dateCameToCanada: formattedDate,
    });
    setCanadaDateDisplay(displayDate);
    setShowCanadaDatePicker(false);
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

  /**
   * Opens the date picker modal and initializes the temporary date state
   * with the current date of birth from the form, handling both ISO and YYYY-MM-DD formats.
   */
  const handleDatePress = () => {
    if (formData.dateOfBirth) {
      let dateToParse: string = formData.dateOfBirth;

      if (dateToParse.includes("T")) {
        const splitResult = dateToParse.split("T")[0];
        dateToParse = splitResult || dateToParse;
      }

      const dateParts = dateToParse.split("-");
      const year: string = dateParts[0] || "0";
      const month: string = dateParts[1] || "1";
      const day: string = dateParts[2] || "1";

      const parsedDate = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );
      setTempDate(parsedDate);

      const displayDate = `${String(parsedDate.getMonth() + 1).padStart(2, "0")}/${String(parsedDate.getDate()).padStart(2, "0")}/${parsedDate.getFullYear()}`;
      setDateDisplay(displayDate);
    } else {
      setTempDate(new Date());
      setDateDisplay("");
    }
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    // Format date as YYYY-MM-DD for database (without timezone)
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, "0");
    const day = String(tempDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    // Format for display as MM/DD/YYYY
    const displayDate = `${month}/${day}/${year}`;

    console.log("📅 Date selected:", {
      tempDate,
      formattedDate,
      displayDate,
    });

    setFormData({
      ...formData,
      dateOfBirth: formattedDate,
    });
    setDateDisplay(displayDate);
    setShowDatePicker(false);
  };

  // For Android, handle the native date picker - FIXED VERSION
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      if (Platform.OS === "android") {
        // For Android, confirm immediately - use UTC methods
        const year = selectedDate.getUTCFullYear();
        const month = String(selectedDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getUTCDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        const displayDate = `${month}/${day}/${year}`;

        setFormData({ ...formData, dateOfBirth: formattedDate });
        setDateDisplay(displayDate);
      } else {
        // For iOS, just update tempDate (user will confirm with button)
        setTempDate(selectedDate);
      }
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
      setErrorTitle("Error");
      setErrorMessage("User not available");
      setShowErrorModal(true);
      return;
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setErrorTitle("Permission Required");
        setErrorMessage("Sorry, we need camera roll permissions to change your profile picture.");
        setShowErrorModal(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduced from 0.8 to compress more
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;

        try {
          // Upload image to backend (returns URL, not base64)
          const imageUrl = await profileAPI.uploadProfileImage(user.id, imageUri);
          console.log('📸 Profile edit: Uploaded image URL:', imageUrl);
          
          // ✅ FIX: Store URL instead of base64 to prevent memory issues
          // Base64 images can be 66MB+ causing OOM errors
          await AsyncStorage.setItem("profileImage", imageUrl);
          setProfileImage(imageUrl);
          // Notify app header and other listeners immediately
          console.log('📸 Profile edit: Emitting avatar event with URL:', imageUrl);
          avatarEvents.emit(imageUrl);

          // Best-effort Convex profile image update
          try {
            if (isUsingConvex && imageUrl) {
              await convexUpdateProfileImage(imageUrl);
            }
          } catch (_e) { /* ignore convex image sync errors */ }

          setSuccessMessage("Profile picture updated!");
          setShowSuccessModal(true);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          setErrorTitle("Error");
          setErrorMessage("Failed to upload profile picture. Please try again.");
          setShowErrorModal(true);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      setUploadingImage(false);
      setErrorTitle("Error");
      setErrorMessage("Failed to update profile picture. Please try again.");
      setShowErrorModal(true);
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
      setErrorTitle("Error");
      setErrorMessage("User not available");
      setShowErrorModal(true);
      return;
    }

    try {
      setSaving(true);

      // Comprehensive validation for all required fields
      const missingFields: string[] = [];

      // Personal Information
      if (!formData.firstName?.trim()) missingFields.push("First Name");
      if (!formData.lastName?.trim()) missingFields.push("Last Name");
      if (!formData.email?.trim()) missingFields.push("Email Address");
      if (!formData.phoneNumber?.trim()) missingFields.push("Phone Number");
      if (!formData.dateOfBirth?.trim()) missingFields.push("Date of Birth");

      // Demographics
      if (!formData.gender?.trim()) missingFields.push("Gender");
      if (!formData.pronouns?.trim()) missingFields.push("Pronouns");
      if (!formData.isLGBTQ?.trim()) missingFields.push("LGBTQ+ Identification");
      if (!formData.primaryLanguage?.trim()) missingFields.push("Primary Language");

      // CMHA Demographics
      if (!formData.ethnoculturalBackground?.trim()) missingFields.push("Ethnocultural Background");
      if (!formData.mentalHealthConcerns?.trim()) missingFields.push("Mental Health/Medical Concerns");
      if (!formData.supportNeeded?.trim()) missingFields.push("Support Needed");
      if (!formData.canadaStatus?.trim()) missingFields.push("Status in Canada");
      if (!formData.dateCameToCanada?.trim()) missingFields.push("Date Came to Canada");

      // Address
      if (!formData.streetAddress?.trim()) missingFields.push("Street Address");
      if (!formData.location?.trim()) missingFields.push("City");
      if (!formData.postalCode?.trim()) missingFields.push("Postal Code");

      // Emergency Contact
      if (!formData.emergencyContactName?.trim()) missingFields.push("Emergency Contact Name");
      if (!formData.emergencyContactNumber?.trim()) missingFields.push("Emergency Contact Phone");
      if (!formData.emergencyContactRelationship?.trim()) missingFields.push("Emergency Contact Relationship");

      if (missingFields.length > 0) {
        const fieldsList = missingFields.join("\n• ");
        setErrorTitle("Required Fields Missing");
        setErrorMessage(`Please fill in all required fields:\n\n• ${fieldsList}`);
        setShowErrorModal(true);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setErrorTitle("Invalid Email");
        setErrorMessage("Please enter a valid email address");
        setShowErrorModal(true);
        return;
      }

      // Phone number validation (basic)
      const phoneRegex = /^\d{10}$/;
      const cleanedPhone = formData.phoneNumber.replace(/\D/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        setErrorTitle("Invalid Phone Number");
        setErrorMessage("Please enter a valid 10-digit phone number");
        setShowErrorModal(true);
        return;
      }

      // Postal code validation (Canadian format)
      const postalRegex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
      if (!postalRegex.test(formData.postalCode.trim())) {
        setErrorTitle("Invalid Postal Code");
        setErrorMessage("Please enter a valid Canadian postal code (e.g., A1A 1A1)");
        setShowErrorModal(true);
        return;
      }

      // Prepare data for backend API - FIXED VERSION
      const profileData: Partial<ClientProfileData> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth?.trim() || undefined,
        gender: formData.gender?.trim() || undefined,
        address: formData.streetAddress?.trim() || undefined,
        city: formData.location?.trim() || undefined,
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
          // Save to local storage as backup
          await saveProfileDataToStorage();
          await saveCmhaDataToStorage();

          try {
            const currentProfileData =
              await AsyncStorage.getItem("profileData");
            const parsedProfileData = currentProfileData
              ? JSON.parse(currentProfileData)
              : {};

            const updatedProfileData = {
              ...parsedProfileData,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phoneNumber: formData.phoneNumber,
              location: formData.location,
              profileImageUrl: profileImage, // ✅ Include the image URL
            };

            await AsyncStorage.setItem(
              "profileData",
              JSON.stringify(updatedProfileData)
            );
            console.log("✅ Updated profileData in AsyncStorage");
            // Emit again to ensure any subscribers update
            avatarEvents.emit(profileImage);
          } catch (syncError) {
            console.error("Error syncing profileData:", syncError);
          }
          // ✅ END OF NEW CODE

          // Best-effort Convex sync (subset of fields)
          try {
            if (isUsingConvex) {
              await convexSyncProfile({
                phoneNumber: formData.phoneNumber?.trim(),
                location: formData.location?.trim(),
                profileImageUrl: profileImage || undefined,
              });
            }
          } catch (_e) { /* ignore convex sync errors */ }

          setSuccessMessage("Profile updated successfully!");
          setShowSuccessModal(true);
          
          // Navigate back after a short delay
          setTimeout(() => {
            router.back();
          }, 1500);
        } else {
          throw new Error(result.message);
        }
      } catch (apiError) {
        console.log("API update failed, saving locally:", apiError);
  // If API fails, save to local storage only
        await saveProfileDataToStorage();
        await saveCmhaDataToStorage();

        try {
          const currentProfileData = await AsyncStorage.getItem("profileData");
          const parsedProfileData = currentProfileData
            ? JSON.parse(currentProfileData)
            : {};

          const updatedProfileData = {
            ...parsedProfileData,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            location: formData.location,
            profileImageUrl: profileImage,
          };

          await AsyncStorage.setItem(
            "profileData",
            JSON.stringify(updatedProfileData)
          );
          console.log(
            "✅ Updated profileData in AsyncStorage (local fallback)"
          );
        } catch (syncError) {
          console.error("Error syncing profileData:", syncError);
        }
        // ✅ END OF NEW CODE

        // Best-effort Convex sync even if REST failed
        try {
          if (isUsingConvex) {
            await convexSyncProfile({
              phoneNumber: formData.phoneNumber?.trim(),
              location: formData.location?.trim(),
              profileImageUrl: profileImage || undefined,
            });
          }
        } catch (_e) { /* ignore */ }

        setSuccessMessage("Profile updated locally!");
        setShowSuccessModal(true);
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error) {
      console.error("Error in handleSaveChanges:", error);
      setErrorTitle("Error");
      setErrorMessage("Failed to update profile. Please try again.");
      setShowErrorModal(true);
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
    const firstName = formData.firstName || "";
    const lastName = formData.lastName || "";
    return `${firstName} ${lastName}`.trim();
  };

  /**
   * Validate individual field
   */
  const validateField = (fieldName: string, value: string) => {
    let error = "";

    switch (fieldName) {
      case "firstName":
      case "lastName":
        if (!value.trim()) {
          error = "This field is required";
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "phoneNumber":
        if (!value.trim()) {
          error = "Phone number is required";
        } else if (!/^\d{10}$/.test(value.replace(/\D/g, ""))) {
          error = "Phone number must be 10 digits";
        }
        break;
      case "postalCode":
        if (!value.trim()) {
          error = "Postal code is required";
        } else if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(value)) {
          error = "Invalid postal code format (e.g., A1A 1A1)";
        }
        break;
      case "emergencyContactNumber":
        if (!value.trim()) {
          error = "Emergency contact number is required";
        } else if (!/^\d{10}$/.test(value.replace(/\D/g, ""))) {
          error = "Phone number must be 10 digits";
        }
        break;
      case "dateOfBirth":
      case "gender":
      case "pronouns":
      case "isLGBTQ":
      case "primaryLanguage":
      case "ethnoculturalBackground":
      case "mentalHealthConcerns":
      case "supportNeeded":
      case "canadaStatus":
      case "dateCameToCanada":
      case "streetAddress":
      case "location":
      case "emergencyContactName":
      case "emergencyContactRelationship":
        if (!value.trim()) {
          error = "This field is required";
        }
        break;
    }

    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error === "";
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
              { 
                backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8',
                borderColor: theme.colors.border
              },
              selectedValue === option && styles.optionButtonSelected,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.optionText,
                { color: theme.colors.textSecondary },
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
                  <Text style={styles.loadingSuggestionsText}>Searching locations...</Text>
                </View>
              ) : (
            <View style={styles.suggestionsContainer}>
              {locationSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={styles.suggestionItem}
                  onPress={() => selectLocation(item)}
                >
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Edit Profile" showBack={true} />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Section */}
          <View style={styles.profilePhotoSection}>
            <View style={styles.profilePhotoContainer}>
              {profileImage ? (
                <OptimizedImage
                  source={{ uri: profileImage }}
                  style={styles.profilePhoto}
                  cache="force-cache"
                  loaderSize="large"
                  loaderColor="#4CAF50"
                  showErrorIcon={false}
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
          <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personal Information</Text>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>First Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.firstName}
                  onChangeText={(text) => {
                    setFormData({ ...formData, firstName: text });
                    validateField("firstName", text);
                  }}
                  onBlur={() => validateField("firstName", formData.firstName)}
                  placeholder="Enter your first name"
                  placeholderTextColor={theme.colors.textSecondary}
                  numberOfLines={1}
                />
              </View>
              {validationErrors.firstName ? (
                <Text style={styles.errorText}>{validationErrors.firstName}</Text>
              ) : null}
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Last Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.lastName}
                  onChangeText={(text) => {
                    setFormData({ ...formData, lastName: text });
                    validateField("lastName", text);
                  }}
                  onBlur={() => validateField("lastName", formData.lastName)}
                  placeholder="Enter your last name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              {validationErrors.lastName ? (
                <Text style={styles.errorText}>{validationErrors.lastName}</Text>
              ) : null}
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Email Address *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    validateField("email", text);
                  }}
                  onBlur={() => validateField("email", formData.email)}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              {validationErrors.email ? (
                <Text style={styles.errorText}>{validationErrors.email}</Text>
              ) : null}
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Phone Number *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.phoneNumber}
                  onChangeText={(text) => {
                    // Only allow digits and limit to 10
                    const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData({ ...formData, phoneNumber: filtered });
                    validateField("phoneNumber", filtered);
                  }}
                  onBlur={() => validateField("phoneNumber", formData.phoneNumber)}
                  placeholder="Enter your phone number (10 digits)"
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.textSecondary}
                  maxLength={10}
                />
              </View>
              {validationErrors.phoneNumber ? (
                <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>
              ) : null}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Date of Birth *</Text>
              <TouchableOpacity
                style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}
                onPress={handleDatePress}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <Text
                  style={[styles.input, { color: dateDisplay ? theme.colors.text : theme.colors.textSecondary }]}
                >
                  {dateDisplay || "Tap to select date"}
                </Text>
              </TouchableOpacity>

              {/* Date Picker - SIMPLIFIED VERSION */}
              {showDatePicker &&
                (Platform.OS === "ios" ? (
                  // iOS: Use modal with native iOS picker behavior (no buttons needed)
                  <Modal
                    visible={showDatePicker}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.modalContainer}>
                      <View style={styles.datePickerContainer}>
                        <View style={styles.datePickerHeader}>
                          <Text style={styles.datePickerTitle}>
                            Select Date of Birth
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                          >
                            <Ionicons name="close" size={24} color="#666" />
                          </TouchableOpacity>
                        </View>

                        <DateTimePicker
                          value={tempDate}
                          mode="date"
                          display="spinner"
                          onChange={handleDateChange}
                          maximumDate={new Date()}
                          style={styles.datePicker}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  // Android: Use native date picker
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                ))}
            </View>
          </View>

          {/* Demographics Section */}
          <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Demographics</Text>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Gender *</Text>
              {renderOptionButtons(GENDER_OPTIONS, formData.gender, (value) =>
                setFormData({ ...formData, gender: value })
              )}
            </View>

            {/* Pronouns */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Pronouns *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.pronouns}
                  onChangeText={(text) =>
                    setFormData({ ...formData, pronouns: text })
                  }
                  placeholder="e.g., they/them, he/him, she/her"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            {/* LGBTQ+ Identification */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Do you identify as LGBTQ+? *</Text>
              {renderOptionButtons(
                ["Yes", "No", "I do not know", "Prefer not to answer"],
                formData.isLGBTQ,
                (value) => setFormData({ ...formData, isLGBTQ: value })
              )}
            </View>

            {/* Primary Language */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Primary Language *</Text>
              <TouchableOpacity
                style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}
                onPress={() => setShowLanguagePicker(true)}
              >
                <Ionicons
                  name="language-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    { color: formData.primaryLanguage ? theme.colors.text : theme.colors.textSecondary }
                  ]}
                >
                  {formData.primaryLanguage || "Select your primary language"}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.icon} />
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

                    <ScrollView style={styles.optionsList}>
                      {LANGUAGE_OPTIONS.map((item) => (
                        <TouchableOpacity
                          key={item}
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
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </View>
          </View>

          {/* Address Information */}
          <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Address Information</Text>

            {/* Street Address */}
            {/* Street Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Street Address *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="home-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.streetAddress}
                  onChangeText={handleStreetSearch}
                  placeholder="Enter your street address"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              {showStreetSuggestions && streetSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {streetSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id.toString()}
                      style={styles.suggestionItem}
                      onPress={() => {
                        // Parse the full address to extract all components
                        const addressParts = item.description.split(",");
                        const street = addressParts[0]?.trim() || "";
                        
                        // Extract city and postal code from the address object if available
                        const city = item.address?.city || item.address?.town || item.address?.village || "";
                        const postalCode = item.address?.postcode || "";
                        
                        // Update form with all extracted data
                        setFormData({
                          ...formData,
                          streetAddress: street,
                          location: city,
                          postalCode: postalCode,
                        });
                        
                        // Also update location query to show the city in the field
                        if (city) {
                          setLocationQuery(city);
                        }
                        
                        setShowStreetSuggestions(false);
                        
                        console.log('📍 Auto-populated address:', { street, city, postalCode });
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
                  ))}
                </View>
              )}
            </View>

            {/* Location/City */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>City *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={locationQuery || formData.location}
                  onChangeText={handleLocationSearch}
                  placeholder="Enter your city"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              {/* Location Suggestions Dropdown */}
              {renderLocationSuggestions()}
            </View>

            {/* Postal Code */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Postal Code *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="navigate-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.postalCode}
                  onChangeText={(text) => {
                    handlePostalSearch(text);
                    validateField("postalCode", text);
                  }}
                  onBlur={() => validateField("postalCode", formData.postalCode)}
                  placeholder="Enter your postal code"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              {validationErrors.postalCode ? (
                <Text style={styles.errorText}>{validationErrors.postalCode}</Text>
              ) : null}
              {showPostalSuggestions && postalSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {postalSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id.toString()}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setFormData({
                          ...formData,
                          postalCode: item.postalCode,
                        });
                        validateField("postalCode", item.postalCode);
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
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Emergency Contact Section */}
          <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Emergency Contact</Text>

            {/* Emergency Contact Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Emergency Contact Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.emergencyContactName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, emergencyContactName: text })
                  }
                  placeholder="Enter emergency contact name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            {/* Emergency Contact Relationship */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Relationship *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.emergencyContactRelationship}
                  onChangeText={(text) =>
                    setFormData({ ...formData, emergencyContactRelationship: text })
                  }
                  placeholder="e.g., Parent, Sibling, Friend"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            {/* Emergency Contact Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Emergency Contact Number *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={formData.emergencyContactNumber}
                  onChangeText={(text) => {
                    // Only allow digits and limit to 10
                    const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData({ ...formData, emergencyContactNumber: filtered });
                    validateField("emergencyContactNumber", filtered);
                  }}
                  onBlur={() => validateField("emergencyContactNumber", formData.emergencyContactNumber)}
                  placeholder="Emergency contact number (10 digits)"
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.textSecondary}
                  maxLength={10}
                />
              </View>
              {validationErrors.emergencyContactNumber ? (
                <Text style={styles.errorText}>{validationErrors.emergencyContactNumber}</Text>
              ) : null}
            </View>
          </View>

          {/* Health Information Section */}
          <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Health Information</Text>

            {/* Mental Health/Medical Concerns */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Mental Health/Medical Concerns *</Text>
              {renderOptionButtons(
                HEALTH_CONCERNS_OPTIONS,
                formData.mentalHealthConcerns,
                (value) =>
                  setFormData({ ...formData, mentalHealthConcerns: value })
              )}
            </View>

            {/* Support Needed */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Support Needed *</Text>
              <TextInput
                style={[
                  styles.textArea,
                  styles.borderedInput,
                  { 
                    backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8',
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }
                ]}
                value={formData.supportNeeded}
                onChangeText={(text) =>
                  setFormData({ ...formData, supportNeeded: text })
                }
                placeholder="Any access needs or accommodations you'd like us to know about"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>

          {/* Additional Information */}
          <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Additional Information</Text>

            {/* Ethnocultural Background */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Ethnocultural Background *</Text>
              <TouchableOpacity
                style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}
                onPress={() => setShowEthnoculturalPicker(true)}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={theme.colors.icon}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    { color: formData.ethnoculturalBackground ? theme.colors.text : theme.colors.textSecondary }
                  ]}
                >
                  {formData.ethnoculturalBackground ||
                    "Select ethnocultural background"}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.icon} />
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

                    <ScrollView style={styles.optionsList}>
                      {ETHNOCULTURAL_OPTIONS.map((item) => (
                        <TouchableOpacity
                          key={item}
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
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </View>

            {/* Status in Canada */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Status in Canada *</Text>
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
                <Text style={[styles.label, { color: theme.colors.text }]}>Date Came to Canada *</Text>
                <TouchableOpacity
                  style={[styles.inputContainer, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F8F8' }]}
                  onPress={handleCanadaDatePress}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.colors.icon}
                    style={styles.inputIcon}
                  />
                  <Text
                    style={[
                      styles.input,
                      { color: canadaDateDisplay ? theme.colors.text : theme.colors.textSecondary }
                    ]}
                  >
                    {canadaDateDisplay || "Tap to select date"}
                  </Text>
                </TouchableOpacity>

                {/* Canada Date Picker */}
                {showCanadaDatePicker &&
                  (Platform.OS === "ios" ? (
                    <Modal
                      visible={showCanadaDatePicker}
                      transparent={true}
                      animationType="slide"
                      onRequestClose={() => setShowCanadaDatePicker(false)}
                    >
                      <View style={styles.modalContainer}>
                        <View style={styles.datePickerContainer}>
                          <View style={styles.datePickerHeader}>
                            <Text style={styles.datePickerTitle}>
                              Select Date Came to Canada
                            </Text>
                            <TouchableOpacity
                              onPress={() => setShowCanadaDatePicker(false)}
                              hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                              }}
                            >
                              <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                          </View>

                          <DateTimePicker
                            value={tempCanadaDate}
                            mode="date"
                            display="spinner"
                            onChange={handleCanadaDateChange}
                            maximumDate={new Date()}
                            style={styles.datePicker}
                          />
                        </View>
                      </View>
                    </Modal>
                  ) : (
                    <DateTimePicker
                      value={tempCanadaDate}
                      mode="date"
                      display="default"
                      onChange={handleCanadaDateChange}
                      maximumDate={new Date()}
                    />
                  ))}
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

          {/* Privacy Settings Section */}
          <View style={[styles.notificationSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy Settings</Text>
            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="shield-outline" size={16} color="#4CAF50" />
                </View>
                <Text style={[styles.notificationText, { color: theme.colors.text }]}>
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

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>Success!</Text>
              <Text style={styles.successMessage}>{successMessage}</Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.successButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowErrorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="close-circle" size={80} color="#FF3B30" />
              </View>
              <Text style={styles.errorTitle}>{errorTitle}</Text>
              <Text style={styles.successMessage}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => setShowErrorModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.successButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: scaledFontSize(16),
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
    fontSize: scaledFontSize(36),
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
    fontSize: scaledFontSize(12),
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
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    marginBottom: 8,
  },
  errorText: {
    fontSize: scaledFontSize(12),
    color: "#FF3B30",
    marginTop: 5,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    overflow: "hidden",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: scaledFontSize(16),
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionButtonSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  optionText: {
    fontSize: scaledFontSize(12),
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
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  notificationSection: {
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
    fontSize: scaledFontSize(14),
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
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  suggestionText: {
    fontSize: scaledFontSize(14),
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
  loadingSuggestionsText: {
    marginLeft: 10,
    fontSize: scaledFontSize(14),
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
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: "#333",
  },
  pickerTitle: {
    fontSize: scaledFontSize(18),
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
    fontSize: scaledFontSize(16),
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
    fontSize: scaledFontSize(16),
    color: "#333",
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  successIconContainer: {
    marginBottom: 20,
    transform: [{ scale: 1 }],
  },
  errorIconContainer: {
    marginBottom: 20,
    transform: [{ scale: 1 }],
  },
  successTitle: {
    fontSize: scaledFontSize(28),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  errorTitle: {
    fontSize: scaledFontSize(28),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  successMessage: {
    fontSize: scaledFontSize(16),
    textAlign: "center",
    marginBottom: 28,
    color: "#6B7280",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  successButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 140,
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 140,
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(17),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});