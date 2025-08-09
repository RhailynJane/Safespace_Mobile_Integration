import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import { useAuth } from "../../context/AuthContext";

/**
 * ForgotPasswordScreen Component
 *
 * A clean, user-friendly password reset screen that allows users to request
 * a password reset email. Features comprehensive validation, loading states,
 * and clear user feedback for both success and error scenarios.
 *
 * Features:
 * - Email validation with regex pattern matching
 * - Loading states during API calls
 * - Error and success message handling
 * - Keyboard-aware interface
 * - Native alert confirmation
 * - Accessible back navigation
 * - Consistent SafeSpace branding
 */
export default function ForgotPasswordScreen() {
  // FORM STATE MANAGEMENT
  const [email, setEmail] = useState(""); // User's email input
  const [loading, setLoading] = useState(false); // Loading state during API call
  const [emailError, setEmailError] = useState(""); // Email validation error message
  const [successMessage, setSuccessMessage] = useState(""); // Success feedback message

  // AUTH CONTEXT
  // Access the resetPassword function from authentication context
  const { resetPassword } = useAuth();

  /**
   * Handles the password reset process
   * - Validates email input and format
   * - Calls authentication service
   * - Manages loading states and user feedback
   * - Shows success alert and navigates back on completion
   */
  const handleResetPassword = async () => {
    // Clear any previous messages
    setEmailError("");
    setSuccessMessage("");

    // VALIDATION: Check for missing email
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    // VALIDATION: Basic email format validation using regex
    // Matches: username@domain.extension format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // API CALL: Send password reset request
    setLoading(true); // Show loading state
    const result = await resetPassword(email.trim());
    setLoading(false); // Hide loading state

    // HANDLE API RESPONSE
    if (result.error) {
      // Show error message from API
      setEmailError(result.error);
    } else {
      // Show success message
      setSuccessMessage("Password reset email sent! Check your inbox.");

      // Show native alert with detailed instructions
      Alert.alert(
        "Reset Email Sent", // Alert title
        "We've sent a password reset link to your email address. Please check your inbox and follow the instructions.", // Alert message
        [
          {
            text: "OK",
            onPress: () => router.back(), // Navigate back to login screen
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar configuration for consistent appearance */}
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* 
        KEYBOARD AVOIDING VIEW
        Ensures form remains visible when keyboard is open
        Different behavior for iOS (padding) vs Android (height)
      */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 
          SCROLLABLE CONTAINER
          Allows scrolling if content exceeds screen height
          Centers content vertically when space allows
        */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* 
            BACK NAVIGATION BUTTON
            Positioned absolutely in top-left corner
            Allows users to return to previous screen
          */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          {/* 
            LOGO SECTION
            Displays SafeSpace branding at top of form
            Provides visual continuity with other auth screens
          */}
          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={80} />
          </View>

          {/* 
            HEADER TEXT SECTION
            Clear title and instructional subtitle
            Explains the password reset process to users
          */}
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>

          {/* 
            MAIN FORM CONTAINER
            Contains all form inputs, validation messages, and action buttons
          */}
          <View style={styles.formContainer}>
            {/* EMAIL INPUT SECTION */}
            <Text style={styles.inputLabel}>Email Address</Text>

            {/* 
              EMAIL INPUT WITH ICON
              Styled input wrapper with mail icon for visual clarity
              Includes validation and real-time error clearing
            */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  // Clear errors when user starts typing
                  setEmailError("");
                  setSuccessMessage("");
                }}
                autoCapitalize="none" // Prevent auto-capitalization for emails
                keyboardType="email-address" // Show email-optimized keyboard
                editable={!loading} // Disable input during loading
              />
            </View>

            {/* 
              VALIDATION MESSAGES
              Conditionally rendered error and success messages
              Provide immediate feedback to user
            */}
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
            {successMessage ? (
              <Text style={styles.successText}>{successMessage}</Text>
            ) : null}

            {/* 
              RESET PASSWORD BUTTON
              Primary action button with loading state
              Disabled during API call to prevent multiple submissions
            */}
            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>
                {loading ? "Sending..." : "Send Reset Email"}
              </Text>
            </TouchableOpacity>

            {/* 
              FOOTER NAVIGATION
              Link back to sign-in screen for users who remember their password
              Disabled during loading to prevent navigation conflicts
            */}
            <View style={styles.footerContainer}>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.footerText}>
                  Remember your password?{" "}
                  <Text style={styles.linkText}>Back to Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // MAIN CONTAINER
  // Light gray background consistent with app theme
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // Light gray background
  },

  // KEYBOARD AVOIDING CONTAINER
  // Full height container for keyboard avoidance behavior
  keyboardContainer: {
    flex: 1,
  },

  // SCROLLABLE CONTENT CONTAINER
  // Centers content vertically when space allows, enables scrolling when needed
  scrollContainer: {
    flexGrow: 1, // Allow growth beyond screen height
    paddingHorizontal: 24, // Side padding for content
    paddingVertical: 20, // Top/bottom padding
    justifyContent: "center", // Center content vertically when possible
  },

  // NAVIGATION ELEMENTS
  // Back button positioned absolutely in top-left corner
  backButton: {
    position: "absolute",
    top: 50, // Distance from top of safe area
    left: 24, // Distance from left edge
    zIndex: 1, // Ensure button stays above other content
    padding: 8, // Touch target padding
  },

  // BRANDING SECTION
  // Logo container with appropriate spacing
  logoContainer: {
    alignItems: "center", // Center logo horizontally
    marginBottom: 30, // Space below logo
    marginTop: 60, // Space above logo (accounts for back button)
  },

  // HEADER TEXT STYLES
  // Main title for the screen
  title: {
    fontSize: 24,
    fontWeight: "600", // Semi-bold weight
    color: "#333", // Dark gray for good contrast
    textAlign: "center",
    marginBottom: 16,
  },

  // Instructional subtitle text
  subtitle: {
    fontSize: 16,
    color: "#666", // Medium gray for secondary text
    textAlign: "center",
    marginBottom: 40, // Large bottom margin before form
    lineHeight: 22, // Better readability
    paddingHorizontal: 20, // Extra side padding for subtitle
  },

  // FORM LAYOUT
  // Container for all form elements
  formContainer: {
    width: "100%", // Full width within padding
  },

  // Input field label
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8, // Small space before input
  },

  // INPUT FIELD STYLING
  // Wrapper for input with icon
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // White background for contrast
    borderRadius: 12, // Rounded corners
    paddingHorizontal: 16, // Internal padding
    height: 50, // Fixed height for consistency
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
    marginBottom: 8, // Space for error messages
  },

  // Icon styling within input
  inputIcon: {
    marginRight: 12, // Space between icon and text input
  },

  // Text input field
  input: {
    flex: 1, // Take remaining space after icon
    fontSize: 16,
    color: "#333",
  },

  // BUTTON STYLES
  // Primary reset button
  resetButton: {
    backgroundColor: "#7FDBDA", // Teal color matching app theme
    borderRadius: 25, // Fully rounded corners
    paddingVertical: 16, // Vertical padding for touch target
    alignItems: "center", // Center text horizontally
    marginTop: 20, // Space above button
    marginBottom: 30, // Space below button
  },

  // Disabled button state
  disabledButton: {
    opacity: 0.6, // Reduce opacity when disabled
  },

  // Button text styling
  resetButtonText: {
    color: "#FFFFFF", // White text for contrast
    fontSize: 16,
    fontWeight: "600", // Semi-bold for emphasis
  },

  // FOOTER SECTION
  // Container for footer links
  footerContainer: {
    alignItems: "center", // Center footer content
    marginTop: 20, // Space above footer
  },

  // Footer text styling
  footerText: {
    fontSize: 14,
    color: "#666", // Medium gray for secondary text
    textAlign: "center",
  },

  // Highlighted link text within footer
  linkText: {
    fontWeight: "600",
    color: "#FF6B6B", // Red accent color for links
  },

  // MESSAGE STYLES
  // Error message styling
  errorText: {
    color: "#FF6B6B", // Red color for errors
    marginTop: 4, // Small space above error
    marginLeft: 8, // Align with input content
    fontSize: 13, // Slightly smaller than main text
  },

  // Success message styling
  successText: {
    color: "#4CAF50", // Green color for success
    marginTop: 4, // Small space above message
    marginLeft: 8, // Align with input content
    fontSize: 13, // Slightly smaller than main text
  },
});
