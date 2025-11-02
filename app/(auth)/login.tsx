// app/(auth)/login.tsx
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSignIn, useUser } from "@clerk/clerk-expo";
import activityApi from "../../utils/activityApi";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import { useTheme } from "../../contexts/ThemeContext";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user } = useUser();

  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // No direct base URL; delegate to activityApi

  const handleSignIn = async () => {
    if (!isLoaded) {
      setError("Authentication service not ready");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        
        // Update login timestamp after successful login
        let clerkUserId = (signInAttempt as any).createdUserId || (signInAttempt as any).userId || user?.id;
        if (!clerkUserId) {
          // Give Clerk hooks a tick to update after setActive
          await new Promise((r) => setTimeout(r, 300));
          clerkUserId = user?.id;
        }
        if (clerkUserId) {
          try { await activityApi.recordLogin(clerkUserId); } catch (_e) { /* ignore */ }
        }
        
        router.replace("/(app)/(tabs)/home");
      } else {
        setError("Sign in process incomplete. Please try again.");
        console.log(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error("Sign in error:", err);

      if (err.errors) {
        const clerkError = err.errors[0];
        if (
          clerkError.code === "form_identifier_not_found" ||
          clerkError.code === "form_password_incorrect"
        ) {
          setError("Invalid email or password");
        } else {
          setError(clerkError.message || "Sign in failed");
        }
      } else {
        setError("An unexpected error occurred");
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
          <View style={styles.topEllipse}></View>

          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={218} />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>Sign In To SafeSpace</Text>

          <View style={styles.toggleContainer}>
            <View style={[styles.toggleButton, styles.activeToggle, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.activeToggleText}>Sign In</Text>
            </View>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text style={[styles.inactiveToggleText, { color: theme.colors.textSecondary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderLight
            }]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Enter your email address"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Password</Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderLight
            }]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Enter your password..."
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError("");
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.colors.icon}
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: theme.colors.primary }, loading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={loading || !isLoaded}
            >
              <Text style={styles.signInButtonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                disabled={loading}
              >
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  Dont have an account?{" "}
                  <Text style={[styles.linkText, { color: theme.colors.error }]}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={[styles.linkText, { color: theme.colors.error }]}>Forgot Password</Text>
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
  topEllipse: {
    position: "absolute",
    top: 0,
    left: -50,
    right: -50,
    height: 200,
    backgroundColor: "#B87B7B",
    opacity: 0.1,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    zIndex: -1,
  },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 2 },
  logoContainer: { alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
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
  activeToggle: { backgroundColor: "#7BB8A8" },
  activeToggleText: { color: "#FFF", fontWeight: "600", fontSize: 16 },
  inactiveToggleText: { color: "#666", fontWeight: "500", fontSize: 16 },
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
  eyeIcon: { padding: 4 },
  signInButton: {
    backgroundColor: "#7BB8A8",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  disabledButton: { opacity: 0.6 },
  signInButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  footerContainer: { alignItems: "center", gap: 10 },
  footerText: { fontSize: 14, color: "#666", textAlign: "center" },
  linkText: {
    fontWeight: "400",
    color: "#E43232",
    textDecorationLine: "underline",
  },
  forgotPassword: { marginTop: 5 },
  errorText: { color: "#E43232", marginTop: 4, marginLeft: 8, fontSize: 13 },
});
