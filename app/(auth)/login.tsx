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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import { useAuth } from "../../context/AuthContext";

/**
 * LoginScreen Component
 *
 * A comprehensive authentication screen featuring both email/password login
 * and social authentication options. Includes form validation, error handling,
 * loading states, and smooth navigation between auth screens.
 *
 * Features:
 * - Email and password input with validation
 * - Password visibility toggle
 * - Sign In/Sign Up toggle navigation
 * - Social login buttons (Facebook, Google, Instagram)
 * - Comprehensive error handling with specific field validation
 * - Loading states and disabled interactions during authentication
 * - Keyboard-aware interface with scroll support
 * - Links to forgot password and signup screens
 */
export default function LoginScreen() {
  // FORM INPUT STATE
  const [email, setEmail] = useState(""); // User's email input
  const [password, setPassword] = useState(""); // User's password input
  const [showPassword, setShowPassword] = useState(false); // Password visibility toggle
  const [loading, setLoading] = useState(false); // Loading state during authentication

  // ERROR STATE MANAGEMENT
  // Separate error states for specific field validation and user feedback
  const [emailError, setEmailError] = useState(""); // Email-specific error messages
  const [passwordError, setPasswordError] = useState(""); // Password-specific error messages
  const [generalError, setGeneralError] = useState(""); // General authentication errors

  // AUTH CONTEXT
  // Access the signIn function from authentication context
  const { signIn } = useAuth();

  /**
   * Handles the sign-in process
   * - Validates required fields (email and password)
   * - Calls authentication service
   * - Manages error states with specific field targeting
   * - Navigates to app on successful authentication
   */
  const handleSignIn = async () => {
    // Clear all previous error messages
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // VALIDATION: Check for missing required fields
    if (!email.trim()) {
      setEmailError("Email is missing, please input to login");
      return;
    }
    if (!password.trim()) {
      setPasswordError("Password is missing, please input to login");
      return;
    }

    // API CALL: Authenticate user
    setLoading(true); // Show loading state
    const result = await signIn(email.trim(), password);
    setLoading(false); // Hide loading state

    // HANDLE AUTHENTICATION RESULT
    if (result.error) {
      // Route specific errors to appropriate fields for better UX
      if (result.error === "Invalid email address.") {
        setEmailError(result.error);
      } else if (result.error === "Email or password is incorrect.") {
        // Show as general error since Firebase doesn't distinguish for security
        setGeneralError(result.error);
      } else {
        // Catch-all for other authentication errors
        setGeneralError(result.error);
      }
      return; // Stop here, no navigation on error
    }

    // SUCCESSFUL LOGIN: Navigate to main app
    router.replace("/(app)/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar configuration for consistent appearance */}
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* 
        KEYBOARD AVOIDING VIEW
        Ensures form remains accessible when keyboard is open
        Different behavior for iOS (padding) vs Android (height)
      */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 
          SCROLLABLE CONTAINER
          Allows scrolling when content exceeds screen height
          Centers content vertically when space allows
        */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* 
            LOGO SECTION
            SafeSpace branding at top of login form
            Provides visual identity and professional appearance
          */}
          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={80} />
          </View>

          {/* SCREEN TITLE */}
          <Text style={styles.title}>Sign In To SafeSpace</Text>

          {/* 
            SIGN IN / SIGN UP TOGGLE
            Visual toggle showing current screen (Sign In active)
            Allows easy navigation between login and registration
          */}
          <View style={styles.toggleContainer}>
            {/* Active Sign In button - highlighted */}
            <View style={[styles.toggleButton, styles.activeToggle]}>
              <Text style={styles.activeToggleText}>Sign In</Text>
            </View>
            {/* Inactive Sign Up button - navigates to signup */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text style={styles.inactiveToggleText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* 
            MAIN FORM CONTAINER
            Contains all form inputs, validation messages, and action buttons
          */}
          <View style={styles.formContainer}>
            {/* EMAIL INPUT SECTION */}
            <Text style={styles.inputLabel}>Email Address</Text>

            {/* 
              EMAIL INPUT WITH ICON
              Styled input wrapper with mail icon and real-time validation
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
                  setEmailError(""); // Clear email error when user types
                }}
                autoCapitalize="none" // Prevent auto-capitalization for emails
                keyboardType="email-address" // Show email-optimized keyboard
                editable={!loading} // Disable input during authentication
              />
            </View>
            {/* Email validation error message */}
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {/* PASSWORD INPUT SECTION */}
            <Text style={styles.inputLabel}>Password</Text>

            {/* 
              PASSWORD INPUT WITH ICONS
              Lock icon on left, eye toggle on right for password visibility
            */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password..."
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(""); // Clear password error when user types
                }}
                secureTextEntry={!showPassword} // Hide/show password based on state
                editable={!loading} // Disable input during authentication
              />
              {/* 
                PASSWORD VISIBILITY TOGGLE
                Eye icon that toggles password visibility
                Changes icon based on current visibility state
              */}
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
            {/* Password validation error message */}
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            {/* 
              GENERAL ERROR MESSAGE
              Displays authentication errors that don't belong to specific fields
              Such as "Email or password is incorrect" for security reasons
            */}
            {generalError ? (
              <Text style={styles.errorText}>{generalError}</Text>
            ) : null}

            {/* 
              SIGN IN BUTTON
              Primary action button with loading state
              Disabled during authentication to prevent multiple submissions
            */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.signInButtonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* 
              SOCIAL LOGIN SECTION
              Alternative authentication methods via social platforms
              Currently displays UI buttons (functionality would be implemented separately)
            */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
              </TouchableOpacity>
            </View>

            {/* 
              FOOTER NAVIGATION LINKS
              Links to other authentication screens
              Disabled during loading to prevent navigation conflicts
            */}
            <View style={styles.footerContainer}>
              {/* Link to signup screen for new users */}
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                disabled={loading}
              >
                <Text style={styles.footerText}>
                  Don't have an account?{" "}
                  <Text style={styles.linkText}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              {/* Link to forgot password screen */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={styles.linkText}>Forgot Password</Text>
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

  // BRANDING SECTION
  // Logo container with appropriate spacing
  logoContainer: {
    alignItems: "center", // Center logo horizontally
    marginBottom: 30, // Space below logo
  },

  // Screen title styling
  title: {
    fontSize: 20,
    fontWeight: "600", // Semi-bold weight
    color: "#333", // Dark gray for good contrast
    textAlign: "center",
    marginBottom: 30, // Space before toggle
  },

  // SIGN IN/SIGN UP TOGGLE
  // Container for the toggle switch between login and signup
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF", // White background
    borderRadius: 25, // Fully rounded corners
    padding: 4, // Internal padding around buttons
    marginBottom: 30, // Space below toggle
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },

  // Individual toggle button styling
  toggleButton: {
    flex: 1, // Equal width for both buttons
    paddingVertical: 12, // Vertical padding
    alignItems: "center", // Center text horizontally
    borderRadius: 20, // Rounded corners for active state
  },

  // Active toggle button (Sign In)
  activeToggle: {
    backgroundColor: "#7FDBDA", // Teal background for active state
  },

  // Active toggle text styling
  activeToggleText: {
    color: "#FFF", // White text on teal background
    fontWeight: "600", // Semi-bold
    fontSize: 16,
  },

  // Inactive toggle text styling
  inactiveToggleText: {
    color: "#666", // Gray text for inactive state
    fontWeight: "500", // Medium weight
    fontSize: 16,
  },

  // FORM LAYOUT
  // Container for all form elements
  formContainer: {
    width: "100%", // Full width within padding
  },

  // Input field labels
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8, // Small space before input
    marginTop: 16, // Space above label (except first)
  },

  // INPUT FIELD STYLING
  // Wrapper for input with icons
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

  // Left icon styling within inputs
  inputIcon: {
    marginRight: 12, // Space between icon and text input
  },

  // Text input field
  input: {
    flex: 1, // Take remaining space after icons
    fontSize: 16,
    color: "#333",
  },

  // Password visibility toggle button
  eyeIcon: {
    padding: 4, // Touch target padding
  },

  // BUTTON STYLES
  // Primary sign in button
  signInButton: {
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

  // Sign in button text styling
  signInButtonText: {
    color: "#FFFFFF", // White text for contrast
    fontSize: 16,
    fontWeight: "600", // Semi-bold for emphasis
  },

  // SOCIAL LOGIN SECTION
  // Container for social media login buttons
  socialContainer: {
    flexDirection: "row", // Horizontal layout
    justifyContent: "center", // Center buttons
    gap: 20, // Space between buttons
    marginBottom: 30, // Space below social buttons
  },

  // Individual social login button
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25, // Circular buttons
    backgroundColor: "#FFF", // White background
    alignItems: "center",
    justifyContent: "center",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },

  // FOOTER SECTION
  // Container for footer links
  footerContainer: {
    alignItems: "center", // Center footer content
    gap: 10, // Space between footer elements
  },

  // Footer text styling
  footerText: {
    fontSize: 14,
    color: "#666", // Medium gray for secondary text
    textAlign: "center",
  },

  // Highlighted link text within footer and buttons
  linkText: {
    fontWeight: "600",
    color: "#FF6B6B", // Red accent color for links
  },

  // Forgot password link spacing
  forgotPassword: {
    marginTop: 5, // Small additional space above forgot password
  },

  // ERROR MESSAGE STYLING
  // Error text for validation messages
  errorText: {
    color: "#FF6B6B", // Red color for errors
    marginTop: 4, // Small space above error
    marginLeft: 8, // Align with input content
    fontSize: 13, // Slightly smaller than main text
  },
});
