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

interface EmailVerificationStepProps {
  data: SignupData;
  onUpdate: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onBack: () => void;
  stepNumber: number;
}

export default function EmailVerificationStep({
  data,
  onUpdate,
  onNext,
  onBack,
  stepNumber,
}: EmailVerificationStepProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        Alert.alert(
          "Verification Email Sent",
          `Check your inbox at ${data.email}`
        );
      } catch (err) {
        Alert.alert("Error", "Failed to resend verification email.");
      }
    }
  };

  const checkEmailVerified = async () => {
    if (!user) return;

    setChecking(true);
    setError("");

    try {
      await reload(user);
      if (user.emailVerified) {
        onNext(); // Move to next step
      } else {
        setError(
          "Email not verified yet. Please click the link in your inbox."
        );
      }
    } catch (err) {
      setError("Failed to check verification status. Try again.");
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
        <Text style={styles.email}>{data.email}</Text>. Please check your inbox
        and click the link to verify your account.
      </Text>

      <TouchableOpacity
        style={[styles.verifyButton, checking && styles.disabledButton]}
        onPress={checkEmailVerified}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>I've Verified My Email</Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: "#333",
  },
  verifyButton: {
    backgroundColor: "#7FDBDA",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 16,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
  },
  resendLink: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
