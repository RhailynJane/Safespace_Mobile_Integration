/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import type React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SignupData } from "../app/(auth)/signup";

// Props interface for the SignUpDetailsForm component
interface SignUpDetailsFormProps {
  step: "personal" | "password"; // Current step in the signup process
  data: SignupData; // Current form data state
  onUpdate: (data: Partial<SignupData>) => void; // Callback to update form data
  onNext: () => void; // Callback to proceed to next step
  onBack?: () => void; // Optional callback to go back (currently unused)
  stepNumber: number; // Current step number for progress indication
}

/**
 * SignUpDetailsForm - Multi-step form component for user registration
 * Handles both personal information collection and password setup
 * with validation and visual feedback
 */
const SignUpDetailsForm: React.FC<SignUpDetailsFormProps> = ({
  step,
  data,
  onUpdate,
  onNext,
  onBack,
  stepNumber,
}) => {
  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  // State to store validation errors for form fields
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validates personal information fields
   * Checks for required fields and email format
   * @returns boolean indicating if validation passed
   */
  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {};

    // Required field validations
    if (!data.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!data.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      // Basic email format validation
      newErrors.email = "Please enter a valid email";
    }
    if (!data.age.trim()) {
      newErrors.age = "Age is required";
    }
    if (!data.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    setErrors(newErrors);
    // Return true if no errors found
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validates password against security requirements
   * Checks for minimum length, numbers, and special characters
   * @returns boolean indicating if password meets all requirements
   */
  const validatePassword = () => {
    const requirements = [
      { test: data.password.length >= 8, message: "8 characters minimum" },
      { test: /\d/.test(data.password), message: "a number" },
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(data.password),
        message: "a symbol",
      },
    ];

    // Filter out requirements that are not met
    const failedRequirements = requirements.filter((req) => !req.test);
    return failedRequirements.length === 0;
  };

  /**
   * Handles form submission for both steps
   * Validates current step and proceeds if validation passes
   */
  const handleSubmit = () => {
    if (step === "personal") {
      if (validatePersonalInfo()) {
        onNext();
      }
    } else if (step === "password") {
      if (validatePassword()) {
        onNext();
      } else {
        // Show alert if password doesn't meet requirements
        Alert.alert(
          "Password Requirements",
          "Please ensure your password meets all requirements"
        );
      }
    }
  };

  /**
   * Returns password requirements with their current status
   * Used to display real-time validation feedback
   * @returns array of requirement objects with test results
   */
  const getPasswordRequirements = () => {
    return [
      { test: data.password.length >= 8, message: "8 characters minimum" },
      { test: /\d/.test(data.password), message: "a number" },
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(data.password),
        message: "a symbol",
      },
    ];
  };

  // Render personal information step
  if (step === "personal") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

        <View style={styles.formContainer}>
          {/* First Name Input */}
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

          {/* Last Name Input */}
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

          {/* Email Address Input */}
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
                autoCapitalize="none" // No auto-capitalization for emails
                keyboardType="email-address" // Show email-optimized keyboard
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Age Input */}
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
                keyboardType="numeric" // Show numeric keyboard
              />
            </View>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          {/* Phone Number Input */}
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
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleSubmit}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render password setup step
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Setup</Text>
      <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

      <View style={styles.formContainer}>
        {/* Password Input with visibility toggle */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={data.password}
              onChangeText={(text) => onUpdate({ password: text })}
              secureTextEntry={!showPassword} // Hide/show password based on state
            />
            {/* Eye icon to toggle password visibility */}
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements with real-time validation */}
        <View style={styles.requirementsContainer}>
          {getPasswordRequirements().map((requirement, index) => (
            <View key={index} style={styles.requirementRow}>
              {/* Colored dot indicating requirement status */}
              <View
                style={[
                  styles.requirementDot,
                  { backgroundColor: requirement.test ? "#4CAF50" : "#E0E0E0" },
                ]}
              />
              {/* Requirement text with dynamic color */}
              <Text
                style={[
                  styles.requirementText,
                  { color: requirement.test ? "#4CAF50" : "#666" },
                ]}
              >
                {requirement.message}
              </Text>
            </View>
          ))}
        </View>

        {/* Create Account Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleSubmit}>
          <Text style={styles.continueButtonText}>Create an Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container - centers content
  container: {
    flex: 1,
    alignItems: "center",
  },

  // Main title styling
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },

  // Step indicator subtitle
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },

  // Container for all form elements
  formContainer: {
    width: "100%",
  },

  // Container for each input field with label and error
  inputContainer: {
    marginBottom: 20,
  },

  // Input field label styling
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },

  // Wrapper for input with icon and styling
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: "#000", // Subtle shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
  },

  // Icon positioning inside input
  inputIcon: {
    marginRight: 12,
  },

  // Text input styling
  input: {
    flex: 1, // Take remaining space after icons
    fontSize: 12,
    color: "#757575",
  },

  // Eye icon for password visibility toggle
  eyeIcon: {
    padding: 4, // Larger touch target
  },

  // Error message text styling
  errorText: {
    color: "#FF6B6B", // Red color for errors
    fontSize: 12,
    marginTop: 4,
  },

  // Primary action button styling
  continueButton: {
    backgroundColor: "#7FDBDA", // Teal brand color
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },

  // Button text styling
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  // Container for password requirements list
  requirementsContainer: {
    marginTop: 16,
    marginBottom: 20,
  },

  // Individual password requirement row
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  // Colored dot showing requirement status
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4, // Perfect circle
    marginRight: 12,
  },

  // Password requirement text
  requirementText: {
    fontSize: 14,
  },
});

export default SignUpDetailsForm;
