"use client";

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { sendEmailVerification, reload } from "firebase/auth";
import type { SignupData } from "../app/(auth)/signup";

// Props interface for the EmailVerificationStep component
interface EmailVerificationStepProps {
  data: SignupData; // Current form data containing user's email address
  onUpdate: (data: Partial<SignupData>) => void; // Callback to update form data (not used in this step)
  onNext: () => void; // Callback to proceed to next step after verification
  onBack: () => void; // Callback to go back to previous step
  stepNumber: number; // Current step number for progress indication
}

/**
 * EmailVerificationStep - Third step of the signup process
 * Handles email verification by allowing users to check verification status
 * and resend verification emails if needed
 */
export default function EmailVerificationStep({
  data,
  onUpdate,
  onNext,
  onBack,
  stepNumber,
}: EmailVerificationStepProps) {
  // Get current authenticated user from auth context
  const { user } = useAuth();

  // State for general loading operations
  const [loading, setLoading] = useState(false);
  // State specifically for checking email verification status
  const [checking, setChecking] = useState(false);
  // State for displaying error messages to user
  const [error, setError] = useState("");

  /**
   * Handles resending verification email to the user
   * Shows success/error alerts based on the result
   */
  const handleResend = async () => {
    if (user) {
      try {
        // Send new verification email via Firebase
        await sendEmailVerification(user);
        Alert.alert(
          "Verification Email Sent",
          `Check your inbox at ${data.email}`
        );
      } catch (err) {
        // Show error alert if resend fails
        Alert.alert("Error", "Failed to resend verification email.");
      }
    }
  };

  /**
   * Checks if the user's email has been verified
   * Reloads user data from Firebase and checks verification status
   */
  const checkEmailVerified = async () => {
    if (!user) return;

    setChecking(true); // Show loading indicator
    setError(""); // Clear any previous errors

    try {
      // Reload user data from Firebase to get latest verification status
      await reload(user);

      if (user.emailVerified) {
        onNext(); // Email verified - proceed to next step
      } else {
        // Email not verified yet - show helpful message
        setError(
          "Email not verified yet. Please click the link in your inbox."
        );
      }
    } catch (err) {
      // Handle errors during verification check
      setError("Failed to check verification status. Try again.");
    } finally {
      setChecking(false); // Hide loading indicator
    }
  };

  return (
    <View style={styles.container}>
      {/* Step header */}
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

      {/* Instructions with user's email address highlighted */}
      <Text style={styles.description}>
        We've sent a verification link to{" "}
        <Text style={styles.email}>{data.email}</Text>. Please check your inbox
        and click the link to verify your account.
      </Text>

      {/* Primary verification check button */}
      <TouchableOpacity
        style={[styles.verifyButton, checking && styles.disabledButton]}
        onPress={checkEmailVerified}
        disabled={checking} // Disable during verification check
      >
        {checking ? (
          // Show loading spinner while checking verification status
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>I've Verified My Email</Text>
        )}
      </TouchableOpacity>

      {/* Display error message if verification check fails */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Resend email option */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the email? </Text>
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendLink}>Resend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container - centers content and provides padding
  container: {
    flex: 1,
    paddingHorizontal: 24, // Side padding for mobile screens
    alignItems: "center",
    justifyContent: "center", // Center content vertically
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
    marginBottom: 32, // Large margin before description
  },

  // Instructional text explaining the verification process
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22, // Better readability for multi-line text
  },

  // Highlighted email address within description
  email: {
    fontWeight: "600", // Bold to emphasize the email address
    color: "#333", // Darker color for emphasis
  },

  // Primary verification button styling
  verifyButton: {
    backgroundColor: "#7FDBDA", // Teal brand color
    borderRadius: 25, // Highly rounded corners
    paddingVertical: 16,
    paddingHorizontal: 32, // Horizontal padding for button width
    alignItems: "center",
    marginBottom: 16,
  },

  // Verification button text styling
  verifyButtonText: {
    color: "#FFFFFF", // White text on teal background
    fontSize: 16,
    fontWeight: "600", // Semi-bold for emphasis
  },

  // Styling for disabled button state during checking
  disabledButton: {
    opacity: 0.6, // Reduced opacity to indicate disabled state
  },

  // Container for resend email option
  resendContainer: {
    flexDirection: "row", // Horizontal layout for text and link
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  // Regular text before resend link
  resendText: {
    fontSize: 14,
    color: "#666", // Medium gray
  },

  // Resend link styling
  resendLink: {
    fontSize: 14,
    color: "#FF6B6B", // Red/coral color to indicate clickable link
    fontWeight: "600", // Bold to distinguish from regular text
  },

  // Error message text styling
  errorText: {
    color: "#FF6B6B", // Red color for error messages
    fontSize: 14,
    marginTop: 12,
    textAlign: "center", // Center error messages
  },
});
