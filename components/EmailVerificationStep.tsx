import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

interface EmailVerificationStepProps {
  email: string;
  verificationCode: string;
  onUpdate: (data: { verificationCode: string }) => void;
  onNext: () => void;
  onBack: () => void;
  stepNumber: number;
  loading?: boolean;
  onResendCode?: () => Promise<void>;
}

export default function EmailVerificationStep({
  email,
  verificationCode,
  onUpdate,
  onNext,
  onBack,
  stepNumber,
  loading = false,
  onResendCode,
}: EmailVerificationStepProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  // Handle cooldown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  const handleCodeChange = (code: string) => {
    const numericCode = code.replace(/[^0-9]/g, "").substring(0, 6);
    onUpdate({ verificationCode: numericCode });
    setError("");
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;

    try {
      setResendLoading(true);
      setError("");

      if (onResendCode) {
        await onResendCode();
      } else {
        // Fallback - this should ideally be provided via props
        console.warn("No resend function provided");
      }

      setCooldown(30);
      Alert.alert("Verification Code Sent", `A new 6-digit code has been sent to ${email}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend code";
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>Step {stepNumber} of 4</Text>

      <Text style={styles.description}>
        We've sent a 6-digit verification code to{" "}
        <Text style={styles.email}>{email}</Text>
      </Text>

      {/* Code Input */}
      <View style={styles.codeInputContainer}>
        <TextInput
          style={[styles.codeInput, error && styles.errorInput]}
          value={verificationCode}
          onChangeText={handleCodeChange}
          placeholder="000000"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus={true}
          editable={!loading}
        />
        <Text style={styles.codeHint}>Enter the 6-digit code</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.button,
          (loading || verificationCode.length !== 6) && styles.disabledButton,
        ]}
        onPress={onNext}
        disabled={loading || verificationCode.length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify Email</Text>
        )}
      </TouchableOpacity>

      {/* Resend Code Section */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendLoading || cooldown > 0}
        >
          <Text
            style={[
              styles.resendLink,
              (resendLoading || cooldown > 0) && styles.disabledLink,
            ]}
          >
            {resendLoading
              ? "Sending..."
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend Code"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        disabled={loading}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
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
    color: "#333",
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
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: "#7BB8A8",
  },
  codeInputContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  codeInput: {
    width: 200,
    height: 50,
    borderWidth: 2,
    borderColor: "#7BB8A8",
    borderRadius: 8,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    backgroundColor: "#FFF",
    letterSpacing: 8, // Better visual spacing for codes
  },
  codeHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  errorInput: {
    borderColor: "#FF6B6B",
  },
  button: {
    backgroundColor: "#7BB8A8",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  resendPrompt: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  resendLink: {
    color: "#7BB8A8",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledLink: {
    opacity: 0.6,
    color: "#999",
  },
  errorText: {
    color: "#FF6B6B",
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  backButton: {
    marginTop: 24,
    padding: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 16,
  },
});
