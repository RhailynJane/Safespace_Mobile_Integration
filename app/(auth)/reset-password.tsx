// app/(auth)/reset-password.tsx
import { useState, useEffect } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSignIn } from "@clerk/clerk-expo";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import { useTheme } from "../../contexts/ThemeContext";

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error states
  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const { isLoaded, signIn, setActive } = useSignIn();

  // Initialize the reset password flow when component mounts
  useEffect(() => {
    if (isLoaded && email && !signIn) {
      initializeResetPassword();
    }
  }, [isLoaded, email]);

  const initializeResetPassword = async () => {
    if (!isLoaded || !email) return;

    try {
      // Create the reset password flow
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
    } catch (err: any) {
      console.error("Failed to initialize reset password:", err);
      Alert.alert("Error", "Failed to initialize password reset. Please try again.");
    }
  };

  // Validate password strength
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const handleResetPassword = async () => {
    setCodeError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate code
    if (!code.trim()) {
      setCodeError("Verification code is required");
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    if (!isLoaded || !signIn) {
      Alert.alert("Error", "Authentication service is not ready");
      return;
    }

    setLoading(true);

    try {
      // Complete the reset password flow in one step
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        Alert.alert(
          "Password Reset Successful",
          "Your password has been reset successfully.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(app)/(tabs)/home"),
            },
          ]
        );
      } else {
        throw new Error("Password reset failed");
      }
    } catch (err: any) {
      console.error("Password reset error:", err);

      if (err.errors) {
        const clerkError = err.errors[0];
        if (clerkError.code === "form_identifier_not_found") {
          setCodeError("Reset session expired. Please request a new code.");
        } else if (clerkError.code === "form_code_incorrect") {
          setCodeError("Invalid verification code");
        } else if (clerkError.code === "form_code_expired") {
          setCodeError("Verification code has expired");
        } else if (clerkError.code === "form_param_format_invalid") {
          setCodeError("Invalid code format");
        } else {
          setCodeError(clerkError.message || "Failed to reset password");
        }
      } else {
        setCodeError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !email) return;

    setLoading(true);
    setCodeError("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      Alert.alert("Code Resent", "A new verification code has been sent to your email.");
    } catch (err: any) {
      console.error("Resend code error:", err);
      setCodeError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={218} />
          </View>

          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to {email} and your new password.
          </Text>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Verification Code</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="key-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setCodeError("");
                }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>

            {codeError ? (
              <Text style={styles.errorText}>{codeError}</Text>
            ) : null}

            <Text style={styles.inputLabel}>New Password</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <Text style={styles.inputLabel}>Confirm Password</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setConfirmPasswordError("");
                }}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading || !isLoaded}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Resetting..." : "Reset Password"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleResendCode}
              disabled={loading || !isLoaded}
            >
              <Text style={styles.secondaryButtonText}>
                Didn&apos;t receive the code? Resend
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              disabled={loading}
            >
              <Text style={styles.footerText}>
                Remember your password?{" "}
                <Text style={styles.linkText}>Back to Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  keyboardContainer: { flex: 1 },
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
  logoContainer: { alignItems: "center", marginBottom: 20 },
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
  formContainer: { width: "100%" },
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
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 12, color: "#333" },
  primaryButton: {
    backgroundColor: "#7BB8A8",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  secondaryButton: {
    alignItems: "center",
    marginBottom: 30,
  },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  secondaryButtonText: {
    color: "#7BB8A8",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  footerContainer: { alignItems: "center", marginTop: 20 },
  footerText: { fontSize: 14, color: "#666", textAlign: "center" },
  linkText: {
    fontWeight: "400",
    color: "#E43232",
    textDecorationLine: "underline",
  },
  errorText: { color: "#FF6B6B", marginTop: 4, marginLeft: 8, fontSize: 13 },
});
