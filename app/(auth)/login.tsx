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

export default function LoginScreen() {
  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error state management for form validation
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  /**
   * Mock authentication function for demo purposes
   * In a real application, this would connect to a backend API
   * to validate user credentials and return authentication tokens
   */
  const signIn = async (email: string, password: string) => {
    // Simulate API call delay (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Demo simulation - always return success
    // In production, this would validate credentials against a database
    return { error: null };
  };

  /**
   * Handles the sign-in process with validation and authentication
   * Validates input fields, calls authentication function, and handles errors
   */
  const handleSignIn = async () => {
    // Clear previous error messages before validation
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // Basic client-side validation
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    // Set loading state to show progress and disable inputs
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    // Handle authentication errors
    if (result.error) {
      setGeneralError("Login failed. Please try again.");
      return;
    }

    // Navigate to the main app screen on successful authentication
    router.replace("/(app)/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Keyboard handling for iOS/Android to ensure inputs remain visible */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Decorative background element */}
          <View style={styles.topEllipse}></View> 

          {/* Application logo display */}
          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={218} />
          </View>

          {/* Page title */}
          <Text style={styles.title}>Sign In To SafeSpace</Text>

          {/* Toggle between Sign In and Sign Up modes */}
          <View style={styles.toggleContainer}>
            <View style={[styles.toggleButton, styles.activeToggle]}>
              <Text style={styles.activeToggleText}>Sign In</Text>
            </View>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text style={styles.inactiveToggleText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Main form container */}
          <View style={styles.formContainer}>
            {/* Email input field with icon and validation */}
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
                placeholder="Enter your email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(""); // Clear error when user starts typing
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Password input field with toggle visibility and validation */}
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
                placeholder="Enter your password..."
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(""); // Clear error when user starts typing
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              {/* Toggle password visibility button */}
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
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* General authentication error message */}
            {generalError ? <Text style={styles.errorText}>{generalError}</Text> : null}

            {/* Sign in button with loading state */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.signInButtonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Footer navigation links */}
            <View style={styles.footerContainer}>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                disabled={loading}
              >
                <Text style={styles.footerText}>
                  Don't have an account?{" "}
                  <Text style={styles.linkText}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              {/* Forgot password navigation */}
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
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardContainer: {
    flex: 1,
  },
  // Decorative ellipse at the top of the screen
  topEllipse: {
    position: 'absolute',
    top: 0,
    left: -50,
    right: -50,
    height: 200,
    backgroundColor: '#B87B7B',
    opacity: 0.10,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    zIndex: -1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 2,
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
  // Container for Sign In/Sign Up toggle buttons
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: "#7BB8A8", // Brand color for active state
  },
  activeToggleText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  inactiveToggleText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 16,
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
  // Wrapper for input fields with icon and styling
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
  eyeIcon: {
    padding: 4,
  },
  // Primary action button
  signInButton: {
    backgroundColor: "#7BB8A8", // Brand color
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6, // Visual indicator for disabled state
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    alignItems: "center",
    gap: 10,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  // Style for clickable text links
  linkText: {
    fontWeight: "400",
    color: "#E43232", // Error/attention color for links
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    marginTop: 5,
  },
  // Error message styling
  errorText: {
    color: "#E43232",
    marginTop: 4,
    marginLeft: 8,
    fontSize: 13,
  },
});