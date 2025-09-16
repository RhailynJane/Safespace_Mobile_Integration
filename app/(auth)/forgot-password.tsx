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

// Forgot password screen with email validation and reset flow
export default function ForgotPasswordScreen() {
  // State management for form data and UI status
  const [email, setEmail] = useState(""); // User's email input
  const [loading, setLoading] = useState(false); // Loading state during mock API call
  const [emailError, setEmailError] = useState(""); // Email validation errors
  const [successMessage, setSuccessMessage] = useState(""); // Success feedback message

  // Mock password reset function - simulates API call for frontend demo
  const resetPassword = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    return { error: null }; // Always return success for demo purposes
  };

  // Handle password reset request with validation
  const handleResetPassword = async () => {
    // Clear previous messages before validation
    setEmailError("");
    setSuccessMessage("");

    // Validate email presence
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    // Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Simulate API call with loading state
    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);

    // Handle API response
    if (result.error) {
      setEmailError(result.error); // Show error message
    } else {
      // Show success state and confirmation alert
      setSuccessMessage("Password reset email sent! Check your inbox.");
      Alert.alert(
        "Reset Email Sent",
        "We've sent a password reset link to your email address.",
        [{ text: "OK", onPress: () => router.back() }] // Navigate back on confirmation
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Keyboard handling to ensure form remains visible */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Back navigation button - top left corner */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          {/* Logo and header section */}
          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={218} />
          </View>

          {/* Page title and instructions */}
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Main form container */}
          <View style={styles.formContainer}>
            {/* Email input label */}
            <Text style={styles.inputLabel}>Email Address</Text>
            
            {/* Email input field with icon */}
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
                  setEmailError(""); // Clear error when typing
                  setSuccessMessage(""); // Clear success when editing
                }}
                autoCapitalize="none" // Important for email fields
                keyboardType="email-address" // Optimize keyboard for email
                editable={!loading} // Disable during loading
              />
            </View>

            {/* Validation messages - conditionally rendered */}
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            {/* Primary action button */}
            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>
                {loading ? "Sending..." : "Send Reset Email"}
              </Text>
            </TouchableOpacity>

            {/* Footer navigation link */}
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
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  logoContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700", 
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "#333",
    marginBottom: 20,
    marginTop: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: "#",
  },
  resetButton: {
    backgroundColor: "#7BB8A8", // Brand primary color
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6, // Visual indicator for disabled state
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  linkText: {
    fontWeight: "400",
    color: "#E43232", // Error/attention color for links
    textDecorationLine: 'underline',
  },
  errorText: {
    color: "#FF6B6B", // Red color for errors
    marginTop: 4,
    marginLeft: 8,
    fontSize: 13,
  },
  successText: {
    color: "#4CAF50", // Green color for success
    marginTop: 4,
    marginLeft: 8,
    fontSize: 13,
  },
});