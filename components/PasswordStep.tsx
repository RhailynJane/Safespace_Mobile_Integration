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

// Props interface for the PasswordStep component
interface PasswordStepProps {
  data: SignupData; // Current form data containing all signup fields
  onUpdate: (data: Partial<SignupData>) => void; // Callback to update password field
  onNext: () => void; // Callback to proceed to next step (account creation)
  onBack: () => void; // Callback to go back to previous step
  stepNumber: number; // Current step number for progress indication
  loading?: boolean; // Optional loading state during account creation
}

/**
 * PasswordStep - Second step of the signup process
 * Handles password creation with real-time validation and visual feedback
 * Shows password requirements and validates them as user types
 */
export default function PasswordStep({
  data,
  onUpdate,
  onNext,
  onBack,
  stepNumber,
  loading = false,
}: PasswordStepProps) {
  // State to toggle password visibility (show/hide password text)
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validates password against all security requirements
   * @returns boolean indicating if password meets all requirements
   */
  const validatePassword = () => {
    const requirements = [
      { test: data.password.length >= 8, message: "8 characters minimum" },
      { test: /\d/.test(data.password), message: "a number" }, // Must contain at least one digit
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(data.password), // Must contain special character
        message: "a symbol",
      },
    ];

    // Check if any requirements are not met
    const failedRequirements = requirements.filter((req) => !req.test);
    return failedRequirements.length === 0;
  };

  /**
   * Handles form submission
   * Validates password and either proceeds or shows error message
   */
  const handleSubmit = () => {
    if (validatePassword()) {
      onNext(); // Proceed to account creation
    } else {
      // Show alert if password doesn't meet requirements
      Alert.alert(
        "Password Requirements",
        "Please ensure your password meets all requirements"
      );
    }
  };

  /**
   * Returns password requirements with their current validation status
   * Used for real-time visual feedback as user types
   * @returns array of requirement objects with test results and messages
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

  return (
    <View style={styles.container}>
      {/* Step header */}
      <Text style={styles.title}>Account Setup</Text>
      <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

      <View style={styles.formContainer}>
        {/* Password Input Field with visibility toggle */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            {/* Lock icon to indicate password field */}
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

        {/* Password Requirements with real-time validation feedback */}
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
              {/* Requirement text with dynamic color based on validation */}
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

        {/* Create Account Button with loading state */}
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading} // Disable button during account creation
        >
          <Text style={styles.continueButtonText}>
            {loading ? "Creating Account..." : "Create an Account"}
          </Text>
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
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },

  // Step progress indicator
  subtitle: {
    fontSize: 16,
    color: "#666", // Medium gray for secondary text
    textAlign: "center",
    marginBottom: 32, // Large margin before form content
  },

  // Container for all form elements
  formContainer: {
    width: "100%",
  },

  // Container for password input with label
  inputContainer: {
    marginBottom: 20,
  },

  // Password input label styling
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },

  // Wrapper for password input with icons and background
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Rounded corners for modern look
    paddingHorizontal: 16,
    height: 50, // Consistent height with other input fields
    shadowColor: "#000", // Subtle shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
  },

  // Lock icon positioning within input wrapper
  inputIcon: {
    marginRight: 12, // Space between icon and text input
  },

  // Password text input field styling
  input: {
    flex: 1, // Take remaining space after icons
    fontSize: 12,
    color: "#757575",
  },

  // Eye icon for password visibility toggle
  eyeIcon: {
    padding: 4, // Larger touch target for better usability
  },

  // Primary create account button styling
  continueButton: {
    backgroundColor: "#7BB8A8", // Teal brand color
    borderRadius: 25, // Highly rounded corners
    paddingVertical: 16, // Comfortable touch target
    alignItems: "center",
    marginTop: 20, // Space above button
  },

  // Create account button text styling
  continueButtonText: {
    color: "#FFFFFF", // White text on teal background
    fontSize: 18,
    fontWeight: "600", // Semi-bold for emphasis
  },

  // Container for password requirements list
  requirementsContainer: {
    marginTop: 16, // Space below password input
    marginBottom: 20, // Space before button
  },

  // Individual password requirement row
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12, // Consistent spacing between requirements
  },

  // Colored dot showing requirement validation status
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4, // Perfect circle
    marginRight: 12, // Space between dot and text
  },

  // Password requirement text styling
  requirementText: {
    fontSize: 14,
  },

  // Styling for disabled button state during loading
  disabledButton: {
    opacity: 0.6, // Reduced opacity to indicate disabled state
  },
});
