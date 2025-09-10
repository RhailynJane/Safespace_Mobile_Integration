import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SignupData } from "../app/(auth)/signup";

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
  // State to store validation errors for each form field
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validates all form fields for required data and correct formats
   * @returns boolean indicating whether all validations passed
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate first name - required field
    if (!data.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Validate last name - required field
    if (!data.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Validate email - required and must match basic email format
    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      // Basic regex for email validation (name@domain.extension)
      newErrors.email = "Please enter a valid email";
    }

    // Validate age - required field
    if (!data.age.trim()) {
      newErrors.age = "Age is required";
    }

    // Validate phone number - required field
    if (!data.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
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
      <Text style={styles.title}>Personal Information</Text>
      <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

      <View style={styles.formContainer}>
        {/* First Name Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your First Name"
              value={data.firstName}
              onChangeText={(text) => onUpdate({ firstName: text })}
              autoCapitalize="words" // Capitalize first letter of each word
            />
          </View>
          {/* Show error message if validation fails */}
          {errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          )}
        </View>

        {/* Last Name Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your Last Name"
              value={data.lastName}
              onChangeText={(text) => onUpdate({ lastName: text })}
              autoCapitalize="words"
            />
          </View>
          {errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          )}
        </View>

        {/* Email Address Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your Email Address"
              value={data.email}
              onChangeText={(text) => onUpdate({ email: text })}
              autoCapitalize="none" // No capitalization for email addresses
              keyboardType="email-address" // Show email-optimized keyboard
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Age Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Age</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your Age"
              value={data.age}
              onChangeText={(text) => onUpdate({ age: text })}
              keyboardType="numeric" // Show numeric keyboard for age input
            />
          </View>
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
        </View>

        {/* Phone Number Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your Phone Number"
              value={data.phoneNumber}
              onChangeText={(text) => onUpdate({ phoneNumber: text })}
              keyboardType="phone-pad" // Show phone number keyboard
            />
          </View>
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleSubmit}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
