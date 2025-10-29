/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import StatusModal from "./StatusModal";
import { router } from "expo-router";

// Local interface for signup data
interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  phoneNumber: string;
}

// Props interface for the PersonalInfoStep component
interface PersonalInfoStepProps {
  data: SignupData; // Current form data containing all signup fields
  onUpdate: (data: Partial<SignupData>) => void; // Callback to update specific form fields
  onNext: () => void; // Callback to proceed to the next step
  stepNumber: number; // Current step number for progress indication
}

/**
 * PersonalInfoStep - First step of the signup process
 * Collects personal information including name, email, age, and phone number
 * Includes validation for all required fields and email format
 */
export default function PersonalInfoStep({
  data,
  onUpdate,
  onNext,
  stepNumber,
}: PersonalInfoStepProps) {
  const { theme } = useTheme();
  // State to store validation errors for each form field
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal state for age restriction
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'error' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  /**
   * Handles age input changes and checks for minimum age requirement
   */
  const handleAgeChange = (text: string) => {
    // Only allow digits
    const filtered = text.replace(/[^0-9]/g, '');
    onUpdate({ age: filtered });

    // Check if user entered a complete age less than 16
    if (filtered.length >= 2) {
      const ageNum = parseInt(filtered, 10);
      if (!isNaN(ageNum) && ageNum < 16) {
        // Show modal immediately
        setModalConfig({
          type: 'error',
          title: 'Age Requirement',
          message: 'You must be at least 16 years old to create an account. If you need support, please contact Kids Help Phone at 1-800-668-6868 (available 24/7).\n\nNeed Immediate Help? If you or someone you know is in crisis, please call 911 or contact a 24/7 crisis line in your area. For urgent mental health support, reach out to the Distress Centre at 403-266-HELP (4357) or visit distresscentre.com.',
        });
        setShowModal(true);
      }
    }
  };

  /**
   * Handles modal close and redirects to login
   */
  const handleModalClose = () => {
    setShowModal(false);
    // Clear age field
    onUpdate({ age: '' });
    // Navigate back to login after a short delay
    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 300);
  };

  /**
   * Validates all form fields for required data and correct formats
   * @returns boolean indicating whether all validations passed
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate first name - required field, must contain only letters
    if (!data.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (!/^[a-zA-Z\s'-]+$/.test(data.firstName.trim())) {
      newErrors.firstName = "First name can only contain letters";
    } else if (data.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Validate last name - required field, must contain only letters
    if (!data.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!/^[a-zA-Z\s'-]+$/.test(data.lastName.trim())) {
      newErrors.lastName = "Last name can only contain letters";
    } else if (data.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Validate email - required and must match proper email format
    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate age - required field, must be a number and 16 or above
    if (!data.age.trim()) {
      newErrors.age = "Age is required";
    } else {
      const ageNum = parseInt(data.age.trim(), 10);
      if (isNaN(ageNum) || !/^\d+$/.test(data.age.trim())) {
        newErrors.age = "Age must be a valid number";
      } else if (ageNum < 16) {
        newErrors.age = "You must be at least 16 years old";
      } else if (ageNum > 120) {
        newErrors.age = "Please enter a valid age";
      }
    }

    // Validate phone number - required field, must be exactly 10 digits
    if (!data.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else {
      const cleanedPhone = data.phoneNumber.replace(/\D/g, '');
      if (cleanedPhone.length !== 10) {
        newErrors.phoneNumber = "Phone number must be exactly 10 digits";
      } else if (!/^\d{10}$/.test(cleanedPhone)) {
        newErrors.phoneNumber = "Phone number must contain only digits";
      }
    }

    // Update error state and return validation status
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * Validates all fields and proceeds to next step if validation passes
   */
  const handleSubmit = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      {/* Step header */}
      <Text style={[styles.title, { color: theme.colors.text }]}>Personal Information</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Step {stepNumber} of 3</Text>

      <View style={styles.formContainer}>
        {/* First Name Input Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>First Name</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight
          }]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter your First Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={data.firstName}
              onChangeText={(text) => {
                // Only allow letters, spaces, hyphens, and apostrophes
                const filtered = text.replace(/[^a-zA-Z\s'-]/g, '');
                onUpdate({ firstName: filtered });
              }}
              autoCapitalize="words" // Capitalize first letter of each word
              maxLength={50}
            />
          </View>
          {/* Show error message if validation fails */}
          {errors.firstName && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.firstName}</Text>
          )}
        </View>

        {/* Last Name Input Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Last Name</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight
          }]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter your Last Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={data.lastName}
              onChangeText={(text) => {
                // Only allow letters, spaces, hyphens, and apostrophes
                const filtered = text.replace(/[^a-zA-Z\s'-]/g, '');
                onUpdate({ lastName: filtered });
              }}
              autoCapitalize="words"
              maxLength={50}
            />
          </View>
          {errors.lastName && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.lastName}</Text>
          )}
        </View>

        {/* Email Address Input Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email Address</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight
          }]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter your Email Address"
              placeholderTextColor={theme.colors.textSecondary}
              value={data.email}
              onChangeText={(text) => onUpdate({ email: text.trim().toLowerCase() })}
              autoCapitalize="none" // No capitalization for email addresses
              keyboardType="email-address" // Show email-optimized keyboard
              maxLength={100}
            />
          </View>
          {errors.email && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.email}</Text>}
        </View>

        {/* Age Input Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Age</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight
          }]}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter your Age (16+)"
              placeholderTextColor={theme.colors.textSecondary}
              value={data.age}
              onChangeText={handleAgeChange}
              keyboardType="numeric" // Show numeric keyboard for age input
              maxLength={3}
            />
          </View>
          {errors.age && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.age}</Text>}
        </View>

        {/* Phone Number Input Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Phone Number</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight
          }]}>
            <Ionicons
              name="call-outline"
              size={20}
              color={theme.colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter your Phone Number (10 digits)"
              placeholderTextColor={theme.colors.textSecondary}
              value={data.phoneNumber}
              onChangeText={(text) => {
                // Only allow digits and limit to 10
                const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
                onUpdate({ phoneNumber: filtered });
              }}
              keyboardType="phone-pad" // Show phone number keyboard
              maxLength={10}
            />
          </View>
          {errors.phoneNumber && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.phoneNumber}</Text>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={[styles.continueButton, { backgroundColor: theme.colors.primary }]} onPress={handleSubmit}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Age Restriction Modal */}
      <StatusModal
        visible={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container - centers content vertically and horizontally
  container: {
    flex: 1,
    alignItems: "center",
  },

  // Main step title styling
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },

  // Step progress indicator
  subtitle: {
    fontSize: 12,
    color: "#666", // Medium gray for secondary text
    textAlign: "center",
    marginBottom: 32, // Large margin before form content
  },

  // Container for all form elements
  formContainer: {
    width: "100%",
  },

  // Container for each input field with label and error message
  inputContainer: {
    marginBottom: 20, // Consistent spacing between input fields
  },

  // Input field label styling
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,

  },

  // Wrapper for input field with icon and background
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Rounded corners for modern look
    paddingHorizontal: 16,
    height: 50, // Consistent height for all inputs
    shadowColor: "#000", // Subtle shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
  },

  // Icon positioning within input wrapper
  inputIcon: {
    marginRight: 12, // Space between icon and text input
  },

  // Text input field styling
  input: {
    flex: 1, // Take remaining space after icons
    fontSize: 12,
    color: "#757575",
  },

  // Error message text styling
  errorText: {
    color: "#FF6B6B", // Red color for error messages
    fontSize: 12, // Small font for error text
    marginTop: 4, // Small margin above error text
  },

  // Primary continue button styling
  continueButton: {
    backgroundColor: "#7BB8A8", // Teal brand color
    borderRadius: 25, // Highly rounded corners
    paddingVertical: 16, // Comfortable touch target
    alignItems: "center",
    marginTop: 20, // Space above button
  },

  // Continue button text styling
  continueButtonText: {
    color: "#FFFFFF", // White text on teal background
    fontSize: 18,
    fontWeight: "600", // Semi-bold for emphasis
  },
});