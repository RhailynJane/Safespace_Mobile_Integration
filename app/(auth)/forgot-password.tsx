// app/(auth)/forgot-password.tsx
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
import { useSignIn } from "@clerk/clerk-expo";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import { useTheme } from "../../contexts/ThemeContext";

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { isLoaded, signIn } = useSignIn();

  const handleResetPassword = async () => {
    setEmailError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!isLoaded) {
      setEmailError("Authentication service is not ready");
      return;
    }

    setLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });

      setSuccessMessage("Password reset email sent! Check your inbox.");
      Alert.alert(
        "Reset Email Sent",
        "We've sent a password reset link to your email address.",
        [
          {
            text: "OK",
            onPress: () =>
              router.push({
                pathname: "/(auth)/reset-password",
                params: { email: email.trim() },
              }),
          },
        ]
      );
    } catch (err: any) {
      console.error("Password reset error:", err);

      if (err.errors) {
        const clerkError = err.errors[0];
        if (clerkError.code === "form_identifier_not_found") {
          setEmailError("No account found with this email address");
        } else {
          setEmailError(clerkError.message || "Failed to send reset email");
        }
      } else {
        setEmailError("An unexpected error occurred");
      }
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
            Enter your email address and we&apos;ll send you a link to reset your
            password.
          </Text>

          <View style={styles.formContainer}>
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
                  setEmailError("");
                  setSuccessMessage("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
            {successMessage ? (
              <Text style={styles.successText}>{successMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading || !isLoaded}
            >
              <Text style={styles.resetButtonText}>
                {loading ? "Sending..." : "Send Reset Email"}
              </Text>
            </TouchableOpacity>

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
  logoContainer: { alignItems: "center" },
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
  resetButton: {
    backgroundColor: "#7BB8A8",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  disabledButton: { opacity: 0.6 },
  resetButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  footerContainer: { alignItems: "center", marginTop: 20 },
  footerText: { fontSize: 14, color: "#666", textAlign: "center" },
  linkText: {
    fontWeight: "400",
    color: "#E43232",
    textDecorationLine: "underline",
  },
  errorText: { color: "#FF6B6B", marginTop: 4, marginLeft: 8, fontSize: 13 },
  successText: { color: "#4CAF50", marginTop: 4, marginLeft: 8, fontSize: 13 },
});
