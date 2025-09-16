/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

interface EmailVerificationStepProps {
  email: string;
  onNext: () => void;
  onBack?: () => void;
  stepNumber: number;
}

export default function EmailVerificationStep({
  email,
  onNext,
  onBack,
  stepNumber,
}: EmailVerificationStepProps) {
  const [loading, setLoading] = useState(false); // Loading state for resend operation
  const [checking, setChecking] = useState(false); // Loading state for verification check
  const [error, setError] = useState(""); // Error message display
  const [cooldown, setCooldown] = useState(0); // Cooldown timer for resend button
  const [isVerified, setIsVerified] = useState(false); // Track verification status

  // Handle cooldown timer for resend button
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000); // Decrement cooldown every second
    }
    return () => {
      if (timer !== null) {
        clearTimeout(timer as any); // Cleanup timer on unmount
      }
    };
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return; // Prevent resend during cooldown

    try {
      setLoading(true);
      // Simulate sending verification email (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCooldown(30); // 30-second cooldown before allowing resend
      Alert.alert(
        "Verification Email Sent",
        `A new verification link has been sent to ${email}`
      );
    } catch (err) {
      setError("Failed to resend verification email");
      console.error("Resend error:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      setChecking(true);
      setError(""); // Clear previous errors
      
      // Simulate checking verification status (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, simulate successful verification
      const verified = true; 
      
      if (verified) {
        setIsVerified(true);
        onNext(); // Proceed to next step after verification
      } else {
        setError("Email not verified yet. Please check your inbox.");
      }
    } catch (err) {
      setError("Failed to check verification status");
      console.error("Verification check error:", err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

      <Text style={styles.description}>
        We've sent a verification link to{" "}
        <Text style={styles.email}>{email}</Text>. Please:
      </Text>

      <View style={styles.instructions}>
        <Text style={styles.instruction}>1. Check your inbox</Text>
        <Text style={styles.instruction}>2. Click the verification link</Text>
        <Text style={styles.instruction}>3. Return to this app</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (checking || isVerified) && styles.disabledButton, // Disable when checking or verified
        ]}
        onPress={checkVerificationStatus}
        disabled={checking || isVerified}
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isVerified ? "Verified! Continue" : "I've Verified My Email"}
          </Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.resendContainer}>
        <TouchableOpacity
          onPress={handleResend}
          disabled={loading || cooldown > 0} // Disable during loading or cooldown
        >
          <Text
            style={[
              styles.resendLink,
              (loading || cooldown > 0) && styles.disabledLink, // Visual disabled state
            ]}
          >
            {loading
              ? "Sending..."
              : cooldown > 0
              ? `Resend in ${cooldown}s` // Show cooldown timer
              : "Resend Email"}
          </Text>
        </TouchableOpacity>
      </View>

      {onBack && ( // Only show back button if onBack prop provided
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  email: {
    fontWeight: "600",
    color: "#333",
  },
  instructions: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  instruction: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#7BB8A8", // Primary brand color
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6, // Visual indicator for disabled state
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  resendContainer: {
    marginTop: 16,
  },
  resendLink: {
    color: "#FF6B6B", // Attention-grabbing color for resend
    fontWeight: "600",
    textAlign: "center",
  },
  disabledLink: {
    opacity: 0.6,
    color: "#999", // Muted color when disabled
  },
  errorText: {
    color: "#FF6B6B", // Error color
    marginTop: 8,
    textAlign: "center",
  },
  backButton: {
    marginTop: 24,
    padding: 12,
  },
  backButtonText: {
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
});