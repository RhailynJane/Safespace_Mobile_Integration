"use client";

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
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
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    onUpdate({ verificationCode: newCode.join("") });
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    // For demo purposes, we'll accept "123456" as valid
    // In a real app, you'd verify this code with your backend
    if (fullCode === "123456") {
      // Move to success step
      onNext();
    } else {
      setError("Invalid verification code. Please try again.");
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        Alert.alert(
          "Code Resent",
          "Verification code has been resent to your email!"
        );
      } catch (error) {
        Alert.alert(
          "Error",
          "Failed to resend verification code. Please try again."
        );
      }
    } else {
      Alert.alert(
        "Code Resent",
        "Verification code has been resent to your email!"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Verification</Text>
      <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

      <View style={styles.formContainer}>
        <Text style={styles.description}>
          We just sent 6-digit code to{"\n"}
          <Text style={styles.email}>{data.email}</Text>, enter it below:
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Code</Text>
          <View style={styles.codeInputContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(value) => handleInputChange(index, value)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(index, nativeEvent.key)
                }
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.verifyButtonText}>
            {loading ? "Verifying..." : "Verify Email"}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
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
  formContainer: {
    width: "100%",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: "#333",
  },
  codeContainer: {
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 16,
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  codeInput: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#7FDBDA",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
  disabledButton: {
    opacity: 0.6,
  },
  codeInputFilled: {
    borderColor: "#7FDBDA",
    backgroundColor: "#F0FFFE",
  },
});
