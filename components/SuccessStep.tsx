/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeSpaceLogo from "./SafeSpaceLogo";

// Props interface for the SuccessStep component
interface SuccessStepProps {
  onSignIn: () => void; // Callback function when user taps the sign-in button
}

/**
 * SuccessStep - Email verification success screen component
 * Displays confirmation that email verification was successful and provides
 * a call-to-action to sign in to the app
 */
export default function SuccessStep({ onSignIn }: SuccessStepProps) {
  return (
    <View style={styles.container}>
      {/* App logo at the top */}
      <SafeSpaceLogo size={80} />

      {/* Success checkmark icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
      </View>

      {/* Main success message */}
      <Text style={styles.title}>Your email was successfully verified!</Text>

      {/* Encouraging subtitle to proceed */}
      <Text style={styles.subtitle}>Only one click to explore SafeSpace</Text>

      {/* Primary call-to-action button */}
      <TouchableOpacity style={styles.signInButton} onPress={onSignIn}>
        <Text style={styles.signInButtonText}>Sign in</Text>
      </TouchableOpacity>

      {/* Terms and privacy policy disclaimer */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By using this platform, you agree to the{" "}
          <Text style={styles.termsLink}>Terms</Text> and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container - centers all content vertically and horizontally
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24, // Side padding for mobile screens
  },

  // Container for the success checkmark icon
  iconContainer: {
    marginTop: 32, // Space between logo and icon
    marginBottom: 24, // Space between icon and title
  },

  // Main success title styling
  title: {
    fontSize: 24,
    fontWeight: "600", // Semi-bold weight
    color: "#333", // Dark gray for good readability
    textAlign: "center",
    marginBottom: 8, // Small gap between title and subtitle
  },

  // Subtitle text styling
  subtitle: {
    fontSize: 16,
    color: "#666", // Medium gray for secondary text
    textAlign: "center",
    marginBottom: 40, // Larger gap before the button
  },

  // Primary sign-in button styling
  signInButton: {
    width: "100%", // Full width button
    backgroundColor: "#7FDBDA", // Teal brand color
    borderRadius: 25, // Rounded corners for modern look
    paddingVertical: 16, // Comfortable touch target height
    alignItems: "center",
    marginBottom: 32, // Space before terms text
  },

  // Sign-in button text styling
  signInButtonText: {
    color: "#FFFFFF", // White text on teal background
    fontSize: 18,
    fontWeight: "600", // Semi-bold for emphasis
  },

  // Container for terms and privacy text
  termsContainer: {
    paddingHorizontal: 20, // Additional padding for text wrapping
  },

  // Terms and privacy policy text styling
  termsText: {
    fontSize: 14, // Smaller font for legal text
    color: "#666", // Medium gray
    textAlign: "center",
    lineHeight: 20, // Better readability for multi-line text
  },

  // Styling for clickable terms links within the text
  termsLink: {
    color: "#333", // Darker color to indicate clickability
    fontWeight: "600", // Bold to distinguish from regular text
  },
});
